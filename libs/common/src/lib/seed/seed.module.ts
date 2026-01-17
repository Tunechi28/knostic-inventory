import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { User, Store, Product } from '@app/persistance';
import { LoggerModule } from '../logger';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Store, Product]),
    LoggerModule,
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}