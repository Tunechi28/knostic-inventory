import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Store, Product } from '@app/persistance';
import { LoggerService } from '@app/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(SeedService.name);
  }

  async onApplicationBootstrap() {
    await this.seedData();
  }

  private async seedData() {
    try {
      const existingUsers = await this.userRepository.count();
      if (existingUsers > 0) {
        this.logger.log('Seed data already exists, skipping...');
        return;
      }

      this.logger.log('Starting to seed database with initial data...');

      const seedUsers = [
        {
          email: 'store1@example.com',
          password: 'password123',
          storeName: 'TechMart Electronics',
          storeDescription: 'Your one-stop shop for all electronics and gadgets',
          storeAddress: '123 Tech Street, Silicon Valley, CA',
        },
        {
          email: 'store2@example.com',
          password: 'password123',
          storeName: 'Fashion Forward',
          storeDescription: 'Trendy clothing and accessories',
          storeAddress: '456 Fashion Ave, New York, NY',
        },
        {
          email: 'store3@example.com',
          password: 'password123',
          storeName: 'BookWorm Paradise',
          storeDescription: 'Books for every reader',
          storeAddress: '789 Literature Lane, Boston, MA',
        },
      ];

      for (let i = 0; i < seedUsers.length; i++) {
        const userData = seedUsers[i];
        const user = await this.createUser(userData.email, userData.password);
        const store = await this.createStore(user.id, {
          name: userData.storeName,
          description: userData.storeDescription,
          address: userData.storeAddress,
        });
        await this.createProducts(store.id, i);
      }

      this.logger.log('Database seeding completed successfully');
    } catch (error) {
      this.logger.error('Error seeding database:', error);
    }
  }

  private async createUser(email: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email,
      passwordHash: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  private async createStore(userId: string, storeData: { name: string; description: string; address: string }): Promise<Store> {
    const store = this.storeRepository.create({
      ...storeData,
      userId,
    });
    const savedStore = await this.storeRepository.save(store);
    return Array.isArray(savedStore) ? savedStore[0] : savedStore;
  }

  private async createProducts(storeId: string, storeIndex: number): Promise<void> {
    const products = this.getProductsForStore(storeIndex);

    for (const productData of products) {
      const product = this.productRepository.create({
        ...productData,
        storeId,
        sku: this.generateSku(),
      });
      await this.productRepository.save(product);
    }
  }

  private getProductsForStore(storeIndex: number) {
    const allProducts = [
      // Electronics
      {
        name: 'iPhone 15 Pro',
        category: 'Electronics',
        price: 999.99,
        quantity: 25,
        description: 'Latest iPhone with advanced camera system and A17 Pro chip',
        imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop',
      },
      {
        name: 'MacBook Pro 14-inch',
        category: 'Electronics',
        price: 1999.99,
        quantity: 15,
        description: 'Powerful laptop with M3 chip for professionals',
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop',
      },
      {
        name: 'AirPods Pro',
        category: 'Electronics',
        price: 249.99,
        quantity: 50,
        description: 'Wireless earbuds with active noise cancellation',
        imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=400&fit=crop',
      },
      {
        name: 'Samsung Galaxy S24',
        category: 'Electronics',
        price: 899.99,
        quantity: 30,
        description: 'Premium Android smartphone with AI features',
        imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=400&fit=crop',
      },
      {
        name: 'Dell XPS 13',
        category: 'Electronics',
        price: 1199.99,
        quantity: 20,
        description: 'Ultra-portable laptop with stunning InfinityEdge display',
        imageUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=400&fit=crop',
      },
      {
        name: 'Sony WH-1000XM5',
        category: 'Electronics',
        price: 349.99,
        quantity: 18,
        description: 'Premium noise-cancelling wireless headphones',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
      },

      // Clothing
      {
        name: 'Classic Denim Jacket',
        category: 'Clothing',
        price: 79.99,
        quantity: 40,
        description: 'Timeless denim jacket perfect for any season',
        imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400&h=400&fit=crop',
      },
      {
        name: 'Cotton T-Shirt Pack',
        category: 'Clothing',
        price: 29.99,
        quantity: 100,
        description: 'Comfortable cotton t-shirts in assorted colors',
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
      },
      {
        name: 'Running Sneakers',
        category: 'Clothing',
        price: 129.99,
        quantity: 35,
        description: 'High-performance running shoes with excellent cushioning',
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
      },
      {
        name: 'Wool Sweater',
        category: 'Clothing',
        price: 89.99,
        quantity: 25,
        description: 'Cozy wool sweater for cold weather',
        imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=400&fit=crop',
      },

      // Books
      {
        name: 'The Pragmatic Programmer',
        category: 'Books',
        price: 39.99,
        quantity: 45,
        description: 'Essential guide for software developers',
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop',
      },
      {
        name: 'Clean Code',
        category: 'Books',
        price: 42.99,
        quantity: 38,
        description: 'A handbook of agile software craftsmanship',
        imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=400&fit=crop',
      },
      {
        name: 'JavaScript Guide',
        category: 'Books',
        price: 29.99,
        quantity: 60,
        description: 'Essential insights into JavaScript programming',
        imageUrl: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=400&fit=crop',
      },
      {
        name: 'Design Patterns',
        category: 'Books',
        price: 54.99,
        quantity: 20,
        description: 'Elements of reusable object-oriented software',
        imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=400&fit=crop',
      },

      // Home & Garden
      {
        name: 'Smart Thermostat',
        category: 'Home & Garden',
        price: 199.99,
        quantity: 15,
        description: 'Wi-Fi enabled programmable thermostat with app control',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
      },
      {
        name: 'Indoor Plant Collection',
        category: 'Home & Garden',
        price: 49.99,
        quantity: 30,
        description: 'Set of 3 low-maintenance indoor plants',
        imageUrl: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop',
      },
      {
        name: 'LED Desk Lamp',
        category: 'Home & Garden',
        price: 34.99,
        quantity: 50,
        description: 'Adjustable LED desk lamp with USB charging port',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      },
      {
        name: 'Coffee Maker',
        category: 'Home & Garden',
        price: 79.99,
        quantity: 22,
        description: 'Automatic drip coffee maker with programmable timer',
        imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400&h=400&fit=crop',
      },
    ];

    // Return category-specific products based on store type
    // Store 0: TechMart Electronics - Electronics + Home
    // Store 1: Fashion Forward - Clothing
    // Store 2: BookWorm Paradise - Books
    const storeCategories: Record<number, string[]> = {
      0: ['Electronics', 'Home & Garden'],
      1: ['Clothing'],
      2: ['Books'],
    };

    const categories = storeCategories[storeIndex] || ['Electronics', 'Clothing', 'Books', 'Home & Garden'];
    return allProducts.filter(p => categories.includes(p.category));
  }

  private generateSku(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `SKU-${timestamp}-${random}`;
  }
}
