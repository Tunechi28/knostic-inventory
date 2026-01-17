import { Module } from '@nestjs/common';
import { EmailNotificationController } from './controller/email.controller';
import { EmailModule, getEmailConfig } from '@app/common';
import { Transaction, User, Store, Product } from '@app/persistance';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KafkaModule, DatabaseModule, appConfig } from '@app/common';
import { ConfigModule } from '@nestjs/config';

const emailConfig = getEmailConfig();

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, User, Store, Product]),
    EmailModule.register(emailConfig),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig],
    }),
    DatabaseModule.forRoot([]),
    KafkaModule,
  ],
  controllers: [EmailNotificationController],
  providers: [],
})
export class AppModule {}
