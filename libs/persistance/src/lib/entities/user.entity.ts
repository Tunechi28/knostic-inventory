import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  Index,
} from 'typeorm';
import { Store } from './store.entity';
import { BaseEntity } from '@app/common';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', unique: true, nullable: false })
  email!: string;

  @Column({ type: 'text', nullable: false, name: 'password_hash' })
  passwordHash!: string;

  @OneToOne(() => Store, (store) => store.user, { cascade: true })
  store!: Store;
}
