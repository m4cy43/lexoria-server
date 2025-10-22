import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from './user.entity';

export enum SearchType {
  TEXT = 'text',
  VECTOR = 'vector',
  FUZZY = 'fuzzy',
  HYBRID = 'hybrid',
  RAG = 'rag',
}

@Entity('search_logs')
export class SearchLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true })
  user: User;

  @Column({
    type: 'enum',
    enum: SearchType,
  })
  searchType: SearchType;

  @Column({ type: 'text' })
  queryText: string;

  @Column({ type: 'integer' })
  resultsCount: number;

  @Column({ type: 'integer' })
  executionTimeMs: number;

  @CreateDateColumn()
  createdAt: Date;
}
