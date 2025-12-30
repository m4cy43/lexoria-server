import { MigrationInterface, QueryRunner } from 'typeorm';

export class LastSeenEntity1761480644468 implements MigrationInterface {
  name = 'LastSeenEntity1761480644468';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "last_seen" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "bookId" uuid, CONSTRAINT "PK_03bb2544eedf7a4d24f15f26b74" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "last_seen" ADD CONSTRAINT "FK_883d5792f78687ea8c188d261b6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "last_seen" ADD CONSTRAINT "FK_464307bb63abcf578aba0de05cb" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "last_seen" DROP CONSTRAINT "FK_464307bb63abcf578aba0de05cb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "last_seen" DROP CONSTRAINT "FK_883d5792f78687ea8c188d261b6"`,
    );
    await queryRunner.query(`DROP TABLE "last_seen"`);
  }
}
