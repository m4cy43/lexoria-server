import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Book } from '../../book/entities/book.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @ManyToMany(() => Book, (book) => book.categories)
  books: Book[];
}
