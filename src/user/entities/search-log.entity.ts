import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { User } from './user.entity';

export enum SearchType {
  TEXT = 'text',
  VECTOR = 'vector',
  FUZZY = 'fuzzy',
  HYBRID = 'hybrid',
  HYBRID_FAST = 'hybrid-fast',
  RAG = 'rag',
}

@Entity('search_logs')
@Unique(['user', 'queryText'])
export class SearchLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
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
