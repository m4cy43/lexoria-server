import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Author } from 'src/author/entities/author.entity';
import { Genre } from 'src/genre/entities/genre.entity';

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'numeric', precision: 2, scale: 1, nullable: true })
  starRating: number;

  @Column({ type: 'int', default: 0 })
  numRatings: number;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'date', nullable: true })
  firstPublished: Date;

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
}
