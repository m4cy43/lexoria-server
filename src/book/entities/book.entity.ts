import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Author } from '../../author/entities/author.entity';
import { Genre } from '../../genre/entities/genre.entity';
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

  @ManyToMany(() => Genre, (genre) => genre.books, { cascade: true })
  @JoinTable({
    name: 'book_genres',
    joinColumn: { name: 'book', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'genre', referencedColumnName: 'id' },
  })
  genres: Genre[];

  @ManyToOne(() => Publisher, (publisher) => publisher.books, { cascade: true })
  publisher: Publisher;
}
