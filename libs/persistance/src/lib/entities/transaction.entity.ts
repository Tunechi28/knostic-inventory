import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { Product } from './product.entity';
import { BaseEntity } from '@app/common';

export enum TransactionStatusTypeORM {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TransactionTypeTypeORM {
  STOCK_IN = 'STOCK_IN',
  STOCK_OUT = 'STOCK_OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  INITIAL = 'INITIAL',
}

@Entity({ name: 'transactions' })
@Check(`"quantity" > 0`)
export class Transaction extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({
    type: 'varchar',
    name: 'reference_number',
    unique: true,
    nullable: false,
  })
  referenceNumber!: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId!: string;

  @ManyToOne(() => Product, (product) => product.transactions, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'int', nullable: false })
  quantity!: number;

  @Column({
    type: 'enum',
    enum: TransactionStatusTypeORM,
    default: TransactionStatusTypeORM.COMPLETED,
    name: 'status',
  })
  status!: TransactionStatusTypeORM;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: TransactionTypeTypeORM,
    default: TransactionTypeTypeORM.STOCK_IN,
    name: 'type',
  })
  type!: TransactionTypeTypeORM;
}
