import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

// We need to mock the module imports before importing the service
jest.mock('@app/persistance', () => ({
  Product: class Product {},
  Store: class Store {},
  Transaction: class Transaction {},
  TransactionTypeTypeORM: {
    STOCK_IN: 'stock_in',
    STOCK_OUT: 'stock_out',
    ADJUSTMENT: 'adjustment',
  },
  TransactionStatusTypeORM: {
    COMPLETED: 'completed',
    PENDING: 'pending',
  },
}));

jest.mock('@app/common', () => ({
  LoggerService: class LoggerService {
    setContext = jest.fn();
    log = jest.fn();
    error = jest.fn();
    warn = jest.fn();
    debug = jest.fn();
  },
}));

// Import after mocks
import { ProductService } from './product.service';
import { Product, Store, Transaction, TransactionTypeTypeORM, TransactionStatusTypeORM } from '@app/persistance';
import { LoggerService } from '@app/common';
import { StockUpdateType } from '../dto/update-stock.dto';

describe('ProductService', () => {
  let service: ProductService;
  let productRepository: any;
  let storeRepository: any;
  let transactionRepository: any;

  const mockStore = {
    id: 'store-123',
    userId: 'user-123',
    name: 'Test Store',
  };

  const mockProduct = {
    id: 'product-123',
    name: 'Test Product',
    category: 'Electronics',
    price: 99.99,
    quantity: 10,
    sku: 'SKU-TEST-123',
    storeId: 'store-123',
    store: mockStore,
  };

  const mockTransaction = {
    id: 'transaction-123',
    productId: 'product-123',
    quantity: 5,
    type: TransactionTypeTypeORM.STOCK_IN,
    status: TransactionStatusTypeORM.COMPLETED,
  };

  const mockLoggerService = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const mockProductRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockStoreRepo = {
      findOne: jest.fn(),
    };

    const mockTransactionRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepo,
        },
        {
          provide: getRepositoryToken(Store),
          useValue: mockStoreRepo,
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepo,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    productRepository = module.get(getRepositoryToken(Product));
    storeRepository = module.get(getRepositoryToken(Store));
    transactionRepository = module.get(getRepositoryToken(Transaction));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const createProductDto = {
        name: 'New Product',
        category: 'Electronics',
        price: 149.99,
        quantity: 20,
        storeId: 'store-123',
      };

      storeRepository.findOne.mockResolvedValue(mockStore);
      productRepository.create.mockReturnValue({ ...createProductDto, sku: 'SKU-TEST' });
      productRepository.save.mockResolvedValue({ id: 'product-456', ...createProductDto, sku: 'SKU-TEST' });
      transactionRepository.create.mockReturnValue(mockTransaction);
      transactionRepository.save.mockResolvedValue(mockTransaction);

      const result = await service.createProduct('user-123', createProductDto);

      expect(result).toBeDefined();
      expect(result.name).toBe('New Product');
      expect(storeRepository.findOne).toHaveBeenCalledWith({ where: { id: 'store-123' } });
      expect(productRepository.create).toHaveBeenCalled();
      expect(productRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if store does not exist', async () => {
      storeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createProduct('user-123', {
          name: 'Product',
          category: 'Electronics',
          price: 100,
          quantity: 10,
          storeId: 'nonexistent-store',
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the store', async () => {
      storeRepository.findOne.mockResolvedValue({
        ...mockStore,
        userId: 'other-user',
      });

      await expect(
        service.createProduct('user-123', {
          name: 'Product',
          category: 'Electronics',
          price: 100,
          quantity: 10,
          storeId: 'store-123',
        })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getProductById', () => {
    it('should return a product when found and user has access', async () => {
      productRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.getProductById('user-123', 'product-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('product-123');
      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'product-123' },
        relations: ['store', 'transactions'],
      });
    });

    it('should throw NotFoundException if product does not exist', async () => {
      productRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getProductById('user-123', 'nonexistent-product')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the product', async () => {
      productRepository.findOne.mockResolvedValue({
        ...mockProduct,
        store: { ...mockStore, userId: 'other-user' },
      });

      await expect(
        service.getProductById('user-123', 'product-123')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateProduct', () => {
    it('should update a product successfully', async () => {
      const updateDto = { name: 'Updated Product' };

      productRepository.findOne.mockResolvedValue(mockProduct);
      productRepository.save.mockResolvedValue({ ...mockProduct, ...updateDto });

      const result = await service.updateProduct('user-123', 'product-123', updateDto);

      expect(result.name).toBe('Updated Product');
      expect(productRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product does not exist', async () => {
      productRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateProduct('user-123', 'nonexistent-product', { name: 'New Name' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the product', async () => {
      productRepository.findOne.mockResolvedValue({
        ...mockProduct,
        store: { ...mockStore, userId: 'other-user' },
      });

      await expect(
        service.updateProduct('user-123', 'product-123', { name: 'New Name' })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product successfully', async () => {
      productRepository.findOne.mockResolvedValue(mockProduct);
      productRepository.remove.mockResolvedValue(mockProduct);

      await service.deleteProduct('user-123', 'product-123');

      expect(productRepository.remove).toHaveBeenCalledWith(mockProduct);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      productRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteProduct('user-123', 'nonexistent-product')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStock', () => {
    it('should add stock successfully (STOCK_IN)', async () => {
      productRepository.findOne.mockResolvedValue({ ...mockProduct, quantity: 10 });
      productRepository.save.mockResolvedValue({ ...mockProduct, quantity: 15 });
      transactionRepository.create.mockReturnValue(mockTransaction);
      transactionRepository.save.mockResolvedValue(mockTransaction);

      const result = await service.updateStock('user-123', 'product-123', {
        type: StockUpdateType.STOCK_IN,
        quantity: 5,
      });

      expect(result.quantity).toBe(15);
    });

    it('should remove stock successfully (STOCK_OUT)', async () => {
      productRepository.findOne.mockResolvedValue({ ...mockProduct, quantity: 10 });
      productRepository.save.mockResolvedValue({ ...mockProduct, quantity: 5 });
      transactionRepository.create.mockReturnValue(mockTransaction);
      transactionRepository.save.mockResolvedValue(mockTransaction);

      const result = await service.updateStock('user-123', 'product-123', {
        type: StockUpdateType.STOCK_OUT,
        quantity: 5,
      });

      expect(result.quantity).toBe(5);
    });

    it('should throw BadRequestException if insufficient stock for STOCK_OUT', async () => {
      productRepository.findOne.mockResolvedValue({ ...mockProduct, quantity: 3 });

      await expect(
        service.updateStock('user-123', 'product-123', {
          type: StockUpdateType.STOCK_OUT,
          quantity: 5,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should adjust stock successfully (ADJUSTMENT)', async () => {
      productRepository.findOne.mockResolvedValue({ ...mockProduct, quantity: 10 });
      productRepository.save.mockResolvedValue({ ...mockProduct, quantity: 25 });
      transactionRepository.create.mockReturnValue(mockTransaction);
      transactionRepository.save.mockResolvedValue(mockTransaction);

      const result = await service.updateStock('user-123', 'product-123', {
        type: StockUpdateType.ADJUSTMENT,
        quantity: 25,
      });

      expect(result.quantity).toBe(25);
    });
  });

  describe('listProducts', () => {
    it('should return paginated list of products', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
      };

      productRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.listProducts({
        userId: 'user-123',
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should filter products by category', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
      };

      productRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.listProducts({
        userId: 'user-123',
        page: 1,
        limit: 10,
        category: 'Electronics',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('should filter low stock products', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
      };

      productRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.listProducts({
        userId: 'user-123',
        page: 1,
        limit: 10,
        lowStock: true,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.quantity <= :lowStockThreshold',
        { lowStockThreshold: 10 }
      );
    });
  });

  describe('getProductHistory', () => {
    it('should return product transaction history', async () => {
      productRepository.findOne.mockResolvedValue(mockProduct);
      transactionRepository.findAndCount.mockResolvedValue([[mockTransaction], 1]);

      const result = await service.getProductHistory('user-123', 'product-123', {
        page: 1,
        limit: 10,
      });

      expect(result.product.id).toBe('product-123');
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });
});
