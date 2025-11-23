import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdditionalIndexes1763910714304 implements MigrationInterface {
  name = 'AdditionalIndexes1763910714304';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable pg_trgm extension if not already
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    // Trigram indexes for fast text search
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_authors_name_trgm 
            ON authors USING gin (name gin_trgm_ops);
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_categories_name_trgm 
            ON categories USING gin (name gin_trgm_ops);
        `);

    // Optional: add trigram index for publisher name if needed
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_publishers_name_trgm
            ON publishers USING gin (name gin_trgm_ops);
        `);

    // Index join tables for faster EXISTS queries
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_book_authors_book
            ON book_authors (book);
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_book_authors_author
            ON book_authors (author);
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_book_categories_book
            ON book_categories (book);
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_book_categories_category
            ON book_categories (category);
        `);

    // Index book_chunks by bookId for faster vector + text candidate lookup
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_book_chunks_bookid
            ON book_chunks ("bookId");
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_book_chunks_bookid;`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_book_categories_category;`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_book_categories_book;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_book_authors_author;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_book_authors_book;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_publishers_name_trgm;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_categories_name_trgm;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_authors_name_trgm;`);
  }
}
