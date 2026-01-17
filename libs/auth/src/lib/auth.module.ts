import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './jwt/jwt-auth.strategy';
import { User, Store } from '@app/persistance';
import { KafkaModule, LoggerModule } from '@app/common';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, Store]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          console.error(
            'FATAL ERROR in AuthModule: JWT_SECRET is not defined in configuration.',
          );
          throw new Error('JWT_SECRET is not configured for JwtModule.');
        }
        return {
          secret,
          signOptions: {
            expiresIn: 3600, // 1 hour in seconds
          },
        };
      },
    }),
    LoggerModule,
    KafkaModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, PassportModule, JwtModule],
})
export class AuthModule {}
