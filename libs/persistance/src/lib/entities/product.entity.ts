import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
  Check,
} from 'typeorm';
import { Store } from './store.entity';
import { Transaction } from './transaction.entity';
import { BaseEntity } from '@app/common';

@Entity({ name: 'products' })
@Index(['storeId', 'name'], { unique: true })
@Check(`"price" >= 0`)
@Check(`"quantity" >= 0`)
export class Product extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({
    type: 'varchar',
    name: 'sku',
    unique: true,
    nullable: false,
    comment: 'System-generated unique product SKU',
  })
  sku!: string;

  @Column({ type: 'varchar', name: 'name', nullable: false })
  name!: string;

  @Column({ type: 'varchar', name: 'category', nullable: false })
  category!: string;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: 0.0,
    name: 'price',
  })
  price!: number;

  @Column({
    type: 'int',
    default: 0,
    name: 'quantity',
  })
  quantity!: number;

  @Column({ type: 'text', name: 'description', nullable: true })
  description!: string;

  @Column({ type: 'varchar', name: 'image_url', nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'uuid', name: 'store_id' })
  storeId!: string;

  @ManyToOne(() => Store, (store) => store.products, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @OneToMany(() => Transaction, (transaction) => transaction.product)
  transactions!: Transaction[];
}
