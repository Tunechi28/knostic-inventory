import { Module } from '@nestjs/common';
import { StoreController } from './controllers/store.controller';
import { ProductController } from './controllers/product.controller';
import { StoreService } from './services/store.service';
import { ProductService } from './services/product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Store, Transaction, Product } from '@app/persistance';
import { LoggerModule, RedisCacheModule } from '@app/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([Store, User, Transaction, Product]),
    LoggerModule,
    RedisCacheModule,
  ],
  controllers: [StoreController, ProductController],
  providers: [StoreService, ProductService],
  exports: [StoreService, ProductService],
})
export class InventoryModule {}
