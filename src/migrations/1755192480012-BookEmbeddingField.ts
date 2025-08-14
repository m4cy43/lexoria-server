import { MigrationInterface, QueryRunner } from "typeorm";

export class BookEmbeddingField1755192480012 implements MigrationInterface {
    name = 'BookEmbeddingField1755192480012'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "books" ADD "embedding" vector(1536)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "books" DROP COLUMN "embedding"`);
    }

}
