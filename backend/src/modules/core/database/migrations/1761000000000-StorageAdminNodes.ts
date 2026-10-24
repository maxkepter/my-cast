import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex } from 'typeorm';

export class StorageAdminNodes1761000000000 implements MigrationInterface {
  name = 'StorageAdminNodes1761000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('storage_nodes'))) {
      await queryRunner.createTable(
        new Table({
          name: 'storage_nodes',
          columns: [
            { name: 'nodeId', type: 'varchar', length: '36', isPrimary: true },
            { name: 'name', type: 'varchar', length: '255' },
            { name: 'endpoint', type: 'varchar', length: '2048' },
            { name: 'region', type: 'varchar', length: '255' },
            { name: 'bucket', type: 'varchar', length: '255' },
            { name: 'forcePathStyle', type: 'boolean', default: true },
            { name: 'accessKeyId', type: 'varchar', length: '255' },
            { name: 'secretAccessKey', type: 'text' },
            { name: 'publicUrl', type: 'varchar', length: '2048', isNullable: true },
            { name: 'quotaBytes', type: 'bigint', default: 0 },
            { name: 'usedBytes', type: 'bigint', default: 0 },
            { name: 'isActive', type: 'boolean', default: true },
            { name: 'isHealthy', type: 'boolean', default: true },
            { name: 'createdAt', type: 'timestamptz', default: 'now()' },
            { name: 'updatedAt', type: 'timestamptz', default: 'now()' },
          ],
        }),
      );
    }

    if (await queryRunner.hasTable('storages')) {
      const storageTable = await queryRunner.getTable('storages');
      if (!storageTable?.findColumnByName('storageNodeId')) {
        await queryRunner.addColumn(
          'storages',
          new TableColumn({ name: 'storageNodeId', type: 'varchar', length: '36', isNullable: true }),
        );
      } else {
        const nodeIdColumn = storageTable.findColumnByName('storageNodeId');
        if (nodeIdColumn && !nodeIdColumn.isNullable) {
          await queryRunner.changeColumn(
            'storages',
            nodeIdColumn,
            new TableColumn({ ...nodeIdColumn, isNullable: true }),
          );
        }
      }

      const refreshed = await queryRunner.getTable('storages');
      if (!refreshed?.findColumnByName('status')) {
        await queryRunner.addColumn(
          'storages',
          new TableColumn({ name: 'status', type: 'varchar', length: '50', default: "'READY'" }),
        );
      }

      const indexName = 'IDX_storages_node_status';
      if (!(await queryRunner.hasColumn('storages', 'storageNodeId'))) return;
      if (!refreshed?.indices.some((index) => index.name === indexName)) {
        await queryRunner.createIndex(
          'storages',
          new TableIndex({ name: indexName, columnNames: ['storageNodeId', 'status'] }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('storages')) {
      const table = await queryRunner.getTable('storages');
      const index = table?.indices.find((item) => item.name === 'IDX_storages_node_status');
      if (index) await queryRunner.dropIndex('storages', index);
      if (table?.findColumnByName('status')) {
        await queryRunner.dropColumn('storages', 'status');
      }
      // Keep storageNodeId to avoid destroying ownership data on rollback.
    }
    if (await queryRunner.hasTable('storage_nodes')) {
      await queryRunner.dropTable('storage_nodes');
    }
  }
}
