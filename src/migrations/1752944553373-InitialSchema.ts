import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1752944553373 implements MigrationInterface {
  name = 'InitialSchema1752944553373';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "authors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, CONSTRAINT "PK_d2ed02fabd9b52847ccb85e6b88" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "publishers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, CONSTRAINT "UQ_39082806f986a63cd7dcf1782a5" UNIQUE ("name"), CONSTRAINT "PK_9d73f23749dca512efc3ccbea6a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "books" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text, "publishedDate" date, "imageUrl" character varying, "publisherId" uuid, CONSTRAINT "PK_f3f2f25a099d24e12545b70b022" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "genres" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, CONSTRAINT "UQ_f105f8230a83b86a346427de94d" UNIQUE ("name"), CONSTRAINT "PK_80ecd718f0f00dde5d77a9be842" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "book_authors" ("book" uuid NOT NULL, "author" uuid NOT NULL, CONSTRAINT "PK_de3fdbe245c44731872e5174e12" PRIMARY KEY ("book", "author"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_55bf51f695722a9af2ed06d91e" ON "book_authors" ("book") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d9a92af03bc56f1285b91a4721" ON "book_authors" ("author") `,
    );
    await queryRunner.query(
      `CREATE TABLE "book_genres" ("book" uuid NOT NULL, "genre" uuid NOT NULL, CONSTRAINT "PK_67b37f7f78dd3498d5e18c6a9fa" PRIMARY KEY ("book", "genre"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8ac7aab3af6888fd395c172219" ON "book_genres" ("book") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9d85e2b1db6632537faf77f456" ON "book_genres" ("genre") `,
    );
    await queryRunner.query(
      `ALTER TABLE "books" ADD CONSTRAINT "FK_594ad92cc478a33e51fd0e31bf3" FOREIGN KEY ("publisherId") REFERENCES "publishers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "book_authors" ADD CONSTRAINT "FK_55bf51f695722a9af2ed06d91e1" FOREIGN KEY ("book") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "book_authors" ADD CONSTRAINT "FK_d9a92af03bc56f1285b91a47216" FOREIGN KEY ("author") REFERENCES "authors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "book_genres" ADD CONSTRAINT "FK_8ac7aab3af6888fd395c1722198" FOREIGN KEY ("book") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "book_genres" ADD CONSTRAINT "FK_9d85e2b1db6632537faf77f4565" FOREIGN KEY ("genre") REFERENCES "genres"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "book_genres" DROP CONSTRAINT "FK_9d85e2b1db6632537faf77f4565"`,
    );
    await queryRunner.query(
      `ALTER TABLE "book_genres" DROP CONSTRAINT "FK_8ac7aab3af6888fd395c1722198"`,
    );
    await queryRunner.query(
      `ALTER TABLE "book_authors" DROP CONSTRAINT "FK_d9a92af03bc56f1285b91a47216"`,
    );
    await queryRunner.query(
      `ALTER TABLE "book_authors" DROP CONSTRAINT "FK_55bf51f695722a9af2ed06d91e1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "books" DROP CONSTRAINT "FK_594ad92cc478a33e51fd0e31bf3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9d85e2b1db6632537faf77f456"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8ac7aab3af6888fd395c172219"`,
    );
    await queryRunner.query(`DROP TABLE "book_genres"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d9a92af03bc56f1285b91a4721"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_55bf51f695722a9af2ed06d91e"`,
    );
    await queryRunner.query(`DROP TABLE "book_authors"`);
    await queryRunner.query(`DROP TABLE "genres"`);
    await queryRunner.query(`DROP TABLE "books"`);
    await queryRunner.query(`DROP TABLE "publishers"`);
    await queryRunner.query(`DROP TABLE "authors"`);
  }
}
