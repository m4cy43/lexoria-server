import { MigrationInterface, QueryRunner } from 'typeorm';

export class HybridFastEnum1764018782151 implements MigrationInterface {
  name = 'HybridFastEnum1764018782151';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."search_logs_searchtype_enum" RENAME TO "search_logs_searchtype_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."search_logs_searchtype_enum" AS ENUM('text', 'vector', 'fuzzy', 'hybrid', 'hybrid-fast', 'rag')`,
    );
    await queryRunner.query(
      `ALTER TABLE "search_logs" ALTER COLUMN "searchType" TYPE "public"."search_logs_searchtype_enum" USING "searchType"::"text"::"public"."search_logs_searchtype_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."search_logs_searchtype_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."search_logs_searchtype_enum_old" AS ENUM('text', 'vector', 'fuzzy', 'hybrid', 'rag')`,
    );
    await queryRunner.query(
      `ALTER TABLE "search_logs" ALTER COLUMN "searchType" TYPE "public"."search_logs_searchtype_enum_old" USING "searchType"::"text"::"public"."search_logs_searchtype_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."search_logs_searchtype_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."search_logs_searchtype_enum_old" RENAME TO "search_logs_searchtype_enum"`,
    );
  }
}
