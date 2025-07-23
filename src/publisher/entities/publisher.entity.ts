import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Book } from '../../book/entities/book.entity';

@Entity('publishers')
export class Publisher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @OneToMany(() => Book, (book) => book.publisher)
  books: Book[];
}
