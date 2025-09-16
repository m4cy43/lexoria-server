import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Author } from '../../author/entities/author.entity';
import { Category } from '../../category/entities/category.entity';
import { Publisher } from '../../publisher/entities/publisher.entity';
import { BookChunk } from './book-chunk.entity';

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date', nullable: true })
  publishedDate: Date;

  @Column({ nullable: true })
  imageUrl: string;

  @ManyToMany(() => Author, (author) => author.books, { cascade: true })
  @JoinTable({
    name: 'book_authors',
    joinColumn: { name: 'book', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'author', referencedColumnName: 'id' },
  })
  authors: Author[];

  @ManyToMany(() => Category, (category) => category.books, { cascade: true })
  @JoinTable({
    name: 'book_categories',
    joinColumn: { name: 'book', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category', referencedColumnName: 'id' },
  })
  categories: Category[];

  @ManyToOne(() => Publisher, (publisher) => publisher.books, { cascade: true })
  publisher: Publisher;

  @OneToMany(() => BookChunk, (chunk) => chunk.book, { cascade: true })
  chunks: BookChunk[];
}
