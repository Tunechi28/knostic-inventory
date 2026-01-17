import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product, Store, Transaction, TransactionTypeTypeORM, TransactionStatusTypeORM } from '@app/persistance';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { UpdateStockDto, StockUpdateType } from '../dto/update-stock.dto';
import { LoggerService } from '@app/common';
import { v4 as uuidv4 } from 'uuid';

interface ListProductsOptions {
  userId: string;
  page: number;
  limit: number;
  category?: string;
  search?: string;
  storeId?: string;
  lowStock?: boolean;
}

interface ProductHistoryOptions {
  page: number;
  limit: number;
}

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(ProductService.name);
  }

  async createProduct(userId: string, createProductDto: CreateProductDto): Promise<Product> {
    const store = await this.storeRepository.findOne({
      where: { id: createProductDto.storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (store.userId !== userId) {
      throw new ForbiddenException('You do not own this store');
    }

    const sku = this.generateSku();

    const product = this.productRepository.create({
      ...createProductDto,
      sku,
    });

    const savedProduct = await this.productRepository.save(product);

    if (savedProduct.quantity > 0) {
      await this.createStockTransaction(
        savedProduct.id,
        savedProduct.quantity,
        TransactionTypeTypeORM.INITIAL,
        'Initial stock'
      );
    }

    this.logger.log(`Created product ${savedProduct.id} in store ${createProductDto.storeId}`);
    return savedProduct;
  }

  async listProducts(options: ListProductsOptions) {
    const { userId, page, limit, category, search, storeId, lowStock } = options;
    const offset = (page - 1) * limit;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.store', 'store')
      .where('store.userId = :userId', { userId });

    if (storeId) {
      queryBuilder.andWhere('product.storeId = :storeId', { storeId });
    }

    if (category) {
      queryBuilder.andWhere('LOWER(product.category) = LOWER(:category)', { category });
    }

    if (search) {
      queryBuilder.andWhere(
        'LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.description) LIKE LOWER(:search)',
        { search: `%${search}%` }
      );
    }

    if (lowStock) {
      queryBuilder.andWhere('product.quantity <= :lowStockThreshold', { lowStockThreshold: 10 });
    }

    const [products, total] = await queryBuilder
      .orderBy('product.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getProductById(userId: string, productId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['store', 'transactions'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.store.userId !== userId) {
      throw new ForbiddenException('You do not have access to this product');
    }

    return product;
  }

  async updateProduct(userId: string, productId: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['store'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.store.userId !== userId) {
      throw new ForbiddenException('You do not own this product');
    }

    Object.assign(product, updateProductDto);
    const updatedProduct = await this.productRepository.save(product);
    
    this.logger.log(`Updated product ${productId} by user ${userId}`);
    return updatedProduct;
  }

  async deleteProduct(userId: string, productId: string): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['store'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.store.userId !== userId) {
      throw new ForbiddenException('You do not own this product');
    }

    await this.productRepository.remove(product);
    this.logger.log(`Deleted product ${productId} by user ${userId}`);
  }

  async updateStock(userId: string, productId: string, updateStockDto: UpdateStockDto): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['store'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.store.userId !== userId) {
      throw new ForbiddenException('You do not own this product');
    }

    let newQuantity = product.quantity;
    let transactionType: TransactionTypeTypeORM;

    switch (updateStockDto.type) {
      case StockUpdateType.STOCK_IN:
        newQuantity += Math.abs(updateStockDto.quantity);
        transactionType = TransactionTypeTypeORM.STOCK_IN;
        break;
      case StockUpdateType.STOCK_OUT:
        const outQuantity = Math.abs(updateStockDto.quantity);
        if (product.quantity < outQuantity) {
          throw new BadRequestException('Insufficient stock quantity');
        }
        newQuantity -= outQuantity;
        transactionType = TransactionTypeTypeORM.STOCK_OUT;
        break;
      case StockUpdateType.ADJUSTMENT:
        newQuantity = Math.abs(updateStockDto.quantity);
        transactionType = TransactionTypeTypeORM.ADJUSTMENT;
        break;
    }

    if (newQuantity < 0) {
      throw new BadRequestException('Stock quantity cannot be negative');
    }

    product.quantity = newQuantity;
    const updatedProduct = await this.productRepository.save(product);

    await this.createStockTransaction(
      productId,
      Math.abs(updateStockDto.quantity),
      transactionType,
      updateStockDto.description || `${updateStockDto.type} operation`
    );

    this.logger.log(`Updated stock for product ${productId}: ${updateStockDto.type} ${updateStockDto.quantity}`);
    return updatedProduct;
  }

  async getProductHistory(userId: string, productId: string, options: ProductHistoryOptions) {
    const product = await this.getProductById(userId, productId);
    const { page, limit } = options;
    const offset = (page - 1) * limit;

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { productId },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    return {
      product: {
        id: product.id,
        name: product.name,
        currentQuantity: product.quantity,
      },
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  private generateSku(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `SKU-${timestamp}-${random}`;
  }

  private async createStockTransaction(
    productId: string,
    quantity: number,
    type: TransactionTypeTypeORM,
    description: string
  ): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      productId,
      quantity,
      type,
      description,
      referenceNumber: `TXN-${Date.now()}-${uuidv4().substring(0, 8)}`,
      status: TransactionStatusTypeORM.COMPLETED,
    });

    return this.transactionRepository.save(transaction);
  }
}