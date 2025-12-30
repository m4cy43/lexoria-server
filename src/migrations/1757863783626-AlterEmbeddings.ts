import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterEmbeddings1757863783626 implements MigrationInterface {
    name = 'AlterEmbeddings1757863783626'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "book_chunks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "chunkIndex" integer NOT NULL, "content" text NOT NULL, "embedding" vector(512), "bookId" uuid, CONSTRAINT "PK_83d270379fb5e1b5b7928fac6de" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "books" DROP COLUMN "embedding"`);
        await queryRunner.query(`ALTER TABLE "book_chunks" ADD CONSTRAINT "FK_de0e72e7b878a6ccbdb8db6ff89" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "book_chunks" DROP CONSTRAINT "FK_de0e72e7b878a6ccbdb8db6ff89"`);
        await queryRunner.query(`ALTER TABLE "books" ADD "embedding" vector`);
        await queryRunner.query(`DROP TABLE "book_chunks"`);
    }

}
