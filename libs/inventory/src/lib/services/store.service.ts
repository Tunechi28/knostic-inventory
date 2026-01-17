import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Store, User, Product } from '@app/persistance';
import { CreateStoreDto } from '../dto/create-store.dto';
import { UpdateStoreDto } from '../dto/update-store.dto';
import { LoggerService } from '@app/common';

interface ListStoresOptions {
  userId: string;
  page: number;
  limit: number;
  search?: string;
}

interface GetStoreProductsOptions {
  page: number;
  limit: number;
  category?: string;
  search?: string;
}

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(StoreService.name);
  }

  async createStore(userId: string, createStoreDto: CreateStoreDto): Promise<Store> {
    const existingUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['store'],
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    if (existingUser.store) {
      throw new ConflictException('User already has a store');
    }

    const existingStore = await this.storeRepository.findOne({
      where: { name: createStoreDto.name },
    });

    if (existingStore) {
      throw new ConflictException('Store with this name already exists');
    }

    const store = this.storeRepository.create({
      ...createStoreDto,
      userId,
    });

    const savedStore = await this.storeRepository.save(store);
    this.logger.log(`Created store ${savedStore.id} for user ${userId}`);
    
    return savedStore;
  }

  async listStores(options: ListStoresOptions) {
    const { userId, page, limit, search } = options;
    const offset = (page - 1) * limit;

    const queryBuilder = this.storeRepository
      .createQueryBuilder('store')
      .leftJoinAndSelect('store.user', 'user')
      .leftJoinAndSelect('store.products', 'products')
      .where('store.userId = :userId', { userId });

    if (search) {
      queryBuilder.andWhere(
        'LOWER(store.name) LIKE LOWER(:search) OR LOWER(store.description) LIKE LOWER(:search)',
        { search: `%${search}%` }
      );
    }

    const [stores, total] = await queryBuilder
      .orderBy('store.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      data: stores,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getStoreById(userId: string, storeId: string): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
      relations: ['user', 'products'],
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (store.userId !== userId) {
      throw new ForbiddenException('You do not have access to this store');
    }

    return store;
  }

  async updateStore(userId: string, storeId: string, updateStoreDto: UpdateStoreDto): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (store.userId !== userId) {
      throw new ForbiddenException('You do not own this store');
    }

    if (updateStoreDto.name) {
      const existingStore = await this.storeRepository.findOne({
        where: { name: updateStoreDto.name },
      });

      if (existingStore && existingStore.id !== storeId) {
        throw new ConflictException('Store with this name already exists');
      }
    }

    Object.assign(store, updateStoreDto);
    const updatedStore = await this.storeRepository.save(store);
    
    this.logger.log(`Updated store ${storeId} by user ${userId}`);
    return updatedStore;
  }

  async calculateInventoryValue(userId: string, storeId: string) {
    const store = await this.getStoreById(userId, storeId);

    const productValues = await this.productRepository
      .createQueryBuilder('product')
      .select([
        'product.category',
        'SUM(product.quantity * product.price) as totalValue',
        'SUM(product.quantity) as totalQuantity',
        'COUNT(product.id) as productCount'
      ])
      .where('product.storeId = :storeId', { storeId })
      .groupBy('product.category')
      .getRawMany();

    const totalValue = productValues.reduce((sum, category) => 
      sum + parseFloat(category.totalValue || '0'), 0
    );

    const totalQuantity = productValues.reduce((sum, category) => 
      sum + parseInt(category.totalQuantity || '0'), 0
    );

    const totalProducts = productValues.reduce((sum, category) => 
      sum + parseInt(category.productCount || '0'), 0
    );

    return {
      store: {
        id: store.id,
        name: store.name,
      },
      summary: {
        totalValue: Number(totalValue.toFixed(2)),
        totalProducts,
        totalQuantity,
      },
      breakdown: productValues.map(category => ({
        category: category.product_category,
        totalValue: Number(parseFloat(category.totalValue || '0').toFixed(2)),
        totalQuantity: parseInt(category.totalQuantity || '0'),
        productCount: parseInt(category.productCount || '0'),
      })),
    };
  }

  async getStoreProducts(userId: string, storeId: string, options: GetStoreProductsOptions) {
    const store = await this.getStoreById(userId, storeId);
    const { page, limit, category, search } = options;
    const offset = (page - 1) * limit;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .where('product.storeId = :storeId', { storeId });

    if (category) {
      queryBuilder.andWhere('LOWER(product.category) = LOWER(:category)', { category });
    }

    if (search) {
      queryBuilder.andWhere(
        'LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.description) LIKE LOWER(:search)',
        { search: `%${search}%` }
      );
    }

    const [products, total] = await queryBuilder
      .orderBy('product.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      store: {
        id: store.id,
        name: store.name,
      },
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
