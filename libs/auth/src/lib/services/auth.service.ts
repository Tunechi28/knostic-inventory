import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User, Store } from '@app/persistance';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { KafkaService } from '@app/common';
import { LoggerService, hashPassword, comparePassword } from '@app/common';
import { AuthPayload } from '../interfaces/auth-payload';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    private readonly jwtService: JwtService,
    private readonly kafkaService: KafkaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(AuthService.name);
  }

  async register(
    registerDto: RegisterDto,
  ): Promise<{
    user: Pick<User, 'id' | 'email'>;
    token: string;
    storeId: string;
  }> {
    const { email, password } = registerDto;
    this.logger.log(`Registration attempt for email: ${email}`);

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      this.logger.warn(`Email ${email} already exists.`);
      throw new BadRequestException('Email already exists');
    }

    if (!password || password.length < 8) {
      this.logger.warn(
        `Registration attempt with weak password for email: ${email}`,
      );
      throw new BadRequestException(
        'Password must be at least 8 characters long.',
      );
    }

    const hashedPassword = await hashPassword(password);

    let newUser: User;
    try {
      const userEntity = this.userRepository.create({
        email,
        passwordHash: hashedPassword,
      });
      newUser = await this.userRepository.save(userEntity);
      this.logger.log(
        `User ${newUser.id} created successfully for email ${email}.`,
      );
    } catch (dbError: any) {
      this.logger.error(
        'Error saving new user to database.',
        dbError.stack,
        undefined,
        { email },
      );
      throw new InternalServerErrorException(
        'User registration failed.',
      );
    }

    let store: Store;
    try {
      this.logger.log(`Creating store for new user ${newUser.id}...`);
      const storeEntity = this.storeRepository.create({
        userId: newUser.id,
        name: `${email.split('@')[0]}'s Store`,
        description: 'My inventory store',
      });
      store = await this.storeRepository.save(storeEntity);
      this.logger.log(
        `Store ${store.id} created for user ${newUser.id}.`,
      );
    } catch (storeError: any) {
      this.logger.error(
        `Failed to create store for user ${newUser.id}. Attempting to roll back user creation.`,
        storeError.stack,
        undefined,
        { userId: newUser.id },
      );
      await this.userRepository.delete(newUser.id).catch((delErr) => {
        this.logger.error(
          `Failed to delete user ${newUser.id} after store creation failure. Manual cleanup required.`,
          delErr.stack,
        );
      });
      throw new InternalServerErrorException(
        'Store creation failed. Registration rolled back.',
      );
    }

    try {
      await this.kafkaService.sendMessages('email-notification', [
        {
          value: JSON.stringify({
            to: newUser.email,
            text: 'Hi, Thanks for registering with our Inventory System!',
            subject: 'Registration Completed!',
          }),
        },
      ]);
      this.logger.log(
        `Registration notification sent to Kafka for user ${newUser.email}`,
      );
    } catch (kafkaError: any) {
      this.logger.warn(
        `Failed to send Kafka notification for user ${newUser.email}, but registration succeeded.`,
        kafkaError.stack,
      );
    }

    const token = this.generateToken(newUser);
    this.logger.log(`Token generated for user ${newUser.id}`);

    return {
      user: { id: newUser.id, email: newUser.email },
      token,
      storeId: store.id,
    };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ user: Pick<User, 'id' | 'email'>; token: string }> {
    const { email, password } = loginDto;
    this.logger.log(`Login attempt for email: ${email}`);

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      this.logger.warn(`Login failed: User with email ${email} not found.`);
      throw new NotFoundException('Invalid credentials');
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      this.logger.warn(`Login failed: Invalid password for email ${email}.`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user);
    this.logger.log(
      `User ${user.id} (${email}) logged in successfully. Token generated.`,
    );
    return {
      user: { id: user.id, email: user.email },
      token,
    };
  }

  private generateToken(user: User): string {
    const payload: AuthPayload = { userId: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }
}
