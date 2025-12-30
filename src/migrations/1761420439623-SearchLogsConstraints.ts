import { MigrationInterface, QueryRunner } from 'typeorm';

export class SearchLogsConstraints1761420439623 implements MigrationInterface {
  name = 'SearchLogsConstraints1761420439623';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "search_logs" ADD CONSTRAINT "UQ_4489e319cd8620779a9e0e10d37" UNIQUE ("userId", "queryText")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "search_logs" DROP CONSTRAINT "UQ_4489e319cd8620779a9e0e10d37"`,
    );
  }
}
