import { Module } from '@nestjs/common';
import {
  getKafkaConfig,
  KafkaModule,
  DatabaseModule,
  CoreModule,
  SeedModule,
  appConfig,
} from '@app/common';
import { PersistanceModule } from '@app/persistance';
import { InventoryModule } from '@app/inventory';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@app/auth';

const kafkaConfig = getKafkaConfig();

@Module({
  imports: [
    CoreModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig],
    }),
    KafkaModule.register(kafkaConfig),
    DatabaseModule.forRoot([]),
    PersistanceModule,
    InventoryModule,
    AuthModule,
    SeedModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
