import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';

// We need to mock the module imports before importing the service
jest.mock('@app/persistance', () => ({
  Store: class Store {},
  User: class User {},
  Product: class Product {},
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
import { StoreService } from './store.service';
import { Store, User, Product } from '@app/persistance';
import { LoggerService } from '@app/common';

describe('StoreService', () => {
  let service: StoreService;
  let storeRepository: any;
  let userRepository: any;
  let productRepository: any;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockStore = {
    id: 'store-123',
    userId: 'user-123',
    name: 'Test Store',
    description: 'A test store',
    address: '123 Test St',
  };

  const mockProduct = {
    id: 'product-123',
    name: 'Test Product',
    category: 'Electronics',
    price: 99.99,
    quantity: 10,
    storeId: 'store-123',
  };

  const mockLoggerService = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const mockStoreRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockUserRepo = {
      findOne: jest.fn(),
    };

    const mockProductRepo = {
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreService,
        {
          provide: getRepositoryToken(Store),
          useValue: mockStoreRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepo,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<StoreService>(StoreService);
    storeRepository = module.get(getRepositoryToken(Store));
    userRepository = module.get(getRepositoryToken(User));
    productRepository = module.get(getRepositoryToken(Product));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createStore', () => {
    it('should create a store successfully', async () => {
      const createStoreDto = {
        name: 'New Store',
        description: 'A new store',
        address: '456 New St',
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      storeRepository.findOne.mockResolvedValue(null);
      storeRepository.create.mockReturnValue({ ...createStoreDto, userId: 'user-123' });
      storeRepository.save.mockResolvedValue({ id: 'store-456', ...createStoreDto, userId: 'user-123' });

      const result = await service.createStore('user-123', createStoreDto);

      expect(result).toBeDefined();
      expect(result.name).toBe('New Store');
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 'user-123' } });
      expect(storeRepository.create).toHaveBeenCalled();
      expect(storeRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createStore('nonexistent-user', { name: 'Store', description: '', address: '' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if store name already exists for user', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      storeRepository.findOne.mockResolvedValue(mockStore);

      await expect(
        service.createStore('user-123', { name: 'Test Store', description: '', address: '' })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getStoreById', () => {
    it('should return a store when found and user has access', async () => {
      storeRepository.findOne.mockResolvedValue({
        ...mockStore,
        user: mockUser,
        products: [],
      });

      const result = await service.getStoreById('user-123', 'store-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('store-123');
      expect(storeRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'store-123' },
        relations: ['user', 'products'],
      });
    });

    it('should throw NotFoundException if store does not exist', async () => {
      storeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getStoreById('user-123', 'nonexistent-store')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the store', async () => {
      storeRepository.findOne.mockResolvedValue({
        ...mockStore,
        userId: 'other-user',
      });

      await expect(
        service.getStoreById('user-123', 'store-123')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStore', () => {
    it('should update a store successfully', async () => {
      const updateDto = { name: 'Updated Store' };

      storeRepository.findOne
        .mockResolvedValueOnce(mockStore)
        .mockResolvedValueOnce(null);

      storeRepository.save.mockResolvedValue({ ...mockStore, ...updateDto });

      const result = await service.updateStore('user-123', 'store-123', updateDto);

      expect(result.name).toBe('Updated Store');
      expect(storeRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if store does not exist', async () => {
      storeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateStore('user-123', 'nonexistent-store', { name: 'New Name' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the store', async () => {
      storeRepository.findOne.mockResolvedValue({
        ...mockStore,
        userId: 'other-user',
      });

      await expect(
        service.updateStore('user-123', 'store-123', { name: 'New Name' })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listStores', () => {
    it('should return paginated list of stores', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockStore], 1]),
      };

      storeRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.listStores({
        userId: 'user-123',
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should filter stores by search term', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockStore], 1]),
      };

      storeRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.listStores({
        userId: 'user-123',
        page: 1,
        limit: 10,
        search: 'test',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });

  describe('calculateInventoryValue', () => {
    it('should calculate inventory value for a store', async () => {
      storeRepository.findOne.mockResolvedValue({
        ...mockStore,
        user: mockUser,
        products: [mockProduct],
      });

      const mockProductQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            product_category: 'Electronics',
            totalValue: '999.90',
            totalQuantity: '10',
            productCount: '1',
          },
        ]),
      };

      productRepository.createQueryBuilder.mockReturnValue(mockProductQueryBuilder);

      const result = await service.calculateInventoryValue('user-123', 'store-123');

      expect(result.store.id).toBe('store-123');
      expect(result.summary.totalValue).toBe(999.9);
      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0].category).toBe('Electronics');
    });
  });

  describe('getStoreProducts', () => {
    it('should return paginated products for a store', async () => {
      storeRepository.findOne.mockResolvedValue({
        ...mockStore,
        user: mockUser,
        products: [],
      });

      const mockProductQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
      };

      productRepository.createQueryBuilder.mockReturnValue(mockProductQueryBuilder);

      const result = await service.getStoreProducts('user-123', 'store-123', {
        page: 1,
        limit: 10,
      });

      expect(result.store.id).toBe('store-123');
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });
});
