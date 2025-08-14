import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Author } from '../../author/entities/author.entity';
import { Category } from '../../category/entities/category.entity';
import { Publisher } from '../../publisher/entities/publisher.entity';

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

  @Column({
    type: 'vector' as any,
    length: 1536,
    nullable: true,
  })
  embedding: number[] | null;

  @BeforeUpdate()
  @BeforeInsert()
  stringifyVector() {
    if (this.embedding && Array.isArray(this.embedding)) {
      this.embedding = JSON.stringify(this.embedding) as any;
    }
  }
}
