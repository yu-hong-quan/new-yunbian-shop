import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('tokens')
export class Token {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  @Column()
  adminId: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: false })
  isValid: boolean;
}
