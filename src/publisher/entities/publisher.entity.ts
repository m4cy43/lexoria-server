import { Book } from '../../book/entities/book.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('publishers')
export class Publisher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @OneToMany(() => Book, (book) => book.publisher)
  books: Book[];
}
