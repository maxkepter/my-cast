import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddVideoProcessingMetadata1762000000000 implements MigrationInterface {
  name = 'AddVideoProcessingMetadata1762000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('videos', 'processingMetadata'))) {
      await queryRunner.addColumn('videos', new TableColumn({ name: 'processingMetadata', type: 'jsonb', isNullable: true }));
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if ((await queryRunner.hasTable('videos')) && (await queryRunner.hasColumn('videos', 'processingMetadata'))) {
      await queryRunner.dropColumn('videos', 'processingMetadata');
    }
  }
}
