import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Book } from '../../book/entities/book.entity';

@Entity('book_chunks')
export class BookChunk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Book, (book) => book.id, { onDelete: 'CASCADE' })
  book: Book;

  @Column()
  chunkIndex: number;

  @Column('text')
  content: string;

  @Column({
    type: 'vector' as any,
    length: 512,
    nullable: true,
    select: false,
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
