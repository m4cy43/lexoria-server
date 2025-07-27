import { MigrationInterface, QueryRunner } from "typeorm";

export class UserTable1753622027772 implements MigrationInterface {
    name = 'UserTable1753622027772'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "book_categories" DROP CONSTRAINT "FK_8ac7aab3af6888fd395c1722198"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8ac7aab3af6888fd395c172219"`);
        await queryRunner.query(`CREATE TYPE "public"."users_roles_enum" AS ENUM('user', 'admin')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "iconUrl" character varying, "roles" "public"."users_roles_enum" array NOT NULL DEFAULT '{user}', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a082a07ecc20b69011642c9bbd" ON "book_categories" ("book") `);
        await queryRunner.query(`ALTER TABLE "book_categories" ADD CONSTRAINT "FK_a082a07ecc20b69011642c9bbde" FOREIGN KEY ("book") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "book_categories" DROP CONSTRAINT "FK_a082a07ecc20b69011642c9bbde"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a082a07ecc20b69011642c9bbd"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_roles_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_8ac7aab3af6888fd395c172219" ON "book_categories" ("book") `);
        await queryRunner.query(`ALTER TABLE "book_categories" ADD CONSTRAINT "FK_8ac7aab3af6888fd395c1722198" FOREIGN KEY ("book") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

}
