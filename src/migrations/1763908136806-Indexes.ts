import { MigrationInterface, QueryRunner } from 'typeorm';

export class Indexes1763908136806 implements MigrationInterface {
  name = 'Indexes1763908136806';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable pg_trgm extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    // Trigram indexes for fast text search
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_books_title_trgm 
            ON books USING gin (title gin_trgm_ops);`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_books_description_trgm 
            ON books USING gin (description gin_trgm_ops);`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_book_chunks_content_trgm 
            ON book_chunks USING gin (content gin_trgm_ops);`);

    // Vector index for embeddings (HNSW)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_book_chunks_embedding_hnsw
            ON book_chunks USING hnsw (embedding vector_l2_ops)
            WITH (m = 16, ef_construction = 200);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes in reverse order
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_book_chunks_embedding_hnsw;`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_book_chunks_content_trgm;`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_books_description_trgm;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_books_title_trgm;`);
  }
}
