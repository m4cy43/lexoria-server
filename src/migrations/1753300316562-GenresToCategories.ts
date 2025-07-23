import { MigrationInterface, QueryRunner } from 'typeorm';

export class GenresToCategories1753300316562 implements MigrationInterface {
  name = 'GenresToCategories1753300316562';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "genres" RENAME TO "categories"`);
    await queryRunner.query(
      `ALTER TABLE "book_genres" RENAME TO "book_categories"`,
    );
    await queryRunner.query(
      `ALTER TABLE "book_categories" RENAME COLUMN "genre" TO "category"`,
    );

    await queryRunner.query(
      `ALTER TABLE "book_categories" DROP CONSTRAINT "FK_9d85e2b1db6632537faf77f4565"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9d85e2b1db6632537faf77f456"`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_cb86940c4c7c0f18870c60935c" ON "book_categories" ("category")`,
    );
    await queryRunner.query(
      `ALTER TABLE "book_categories" ADD CONSTRAINT "FK_cb86940c4c7c0f18870c60935c2" FOREIGN KEY ("category") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "book_categories" DROP CONSTRAINT "FK_cb86940c4c7c0f18870c60935c2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cb86940c4c7c0f18870c60935c"`,
    );

    await queryRunner.query(
      `ALTER TABLE "book_categories" RENAME COLUMN "category" TO "genre"`,
    );
    await queryRunner.query(
      `ALTER TABLE "book_categories" RENAME TO "book_genres"`,
    );
    await queryRunner.query(`ALTER TABLE "categories" RENAME TO "genres"`);

    await queryRunner.query(
      `CREATE INDEX "IDX_9d85e2b1db6632537faf77f456" ON "book_genres" ("genre")`,
    );
    await queryRunner.query(
      `ALTER TABLE "book_genres" ADD CONSTRAINT "FK_9d85e2b1db6632537faf77f4565" FOREIGN KEY ("genre") REFERENCES "genres"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
