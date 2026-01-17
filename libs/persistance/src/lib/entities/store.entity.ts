import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { BaseEntity } from '@app/common';
import { Product } from './product.entity';

@Entity({ name: 'stores' })
export class Store extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'uuid', name: 'user_id', unique: true })
  userId!: string;

  @OneToOne(() => User, (user) => user.store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', name: 'name', nullable: false })
  name!: string;

  @Column({ type: 'text', name: 'description', nullable: true })
  description!: string;

  @Column({ type: 'varchar', name: 'address', nullable: true })
  address!: string;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @OneToMany(() => Product, (product) => product.store, { cascade: true })
  products!: Product[];
}
