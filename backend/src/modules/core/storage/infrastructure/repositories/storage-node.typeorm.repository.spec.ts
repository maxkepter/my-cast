import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageNodeTypeOrmRepository } from './storage-node.typeorm.repository';
import { StorageNode } from '../../domain/entities/storage-node.entity';
import { StorageObject } from '../../domain/entities/storage.entity';
import { Repository } from 'typeorm';

describe('StorageNodeTypeOrmRepository', () => {
  let nodeRepo: StorageNodeTypeOrmRepository;
  let mockNodeEntityRepo: Partial<Repository<StorageNode>>;
  let mockObjectEntityRepo: Partial<Repository<StorageObject>>;

  beforeEach(() => {
    mockNodeEntityRepo = {
      findOne: vi.fn(),
      find: vi.fn(),
      exists: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      merge: vi.fn((entity, patch) => Object.assign({}, entity, patch)),
    };
    mockObjectEntityRepo = {
      count: vi.fn(),
      createQueryBuilder: vi.fn(),
    };
    nodeRepo = new StorageNodeTypeOrmRepository(
      mockNodeEntityRepo as Repository<StorageNode>,
      mockObjectEntityRepo as Repository<StorageObject>,
    );
  });

  describe('StorageNode operations', () => {
    it('finds node by id', async () => {
      const node = { nodeId: 'node-1' } as StorageNode;
      vi.mocked(mockNodeEntityRepo.findOne!).mockResolvedValue(node);

      const result = await nodeRepo.findById('node-1');
      expect(mockNodeEntityRepo.findOne).toHaveBeenCalledWith({ where: { nodeId: 'node-1' } });
      expect(result).toBe(node);
    });

    it('finds all active nodes', async () => {
      const nodes = [{ nodeId: 'node-1', isActive: true }] as StorageNode[];
      vi.mocked(mockNodeEntityRepo.find!).mockResolvedValue(nodes);

      const result = await nodeRepo.findActiveNodes();
      expect(mockNodeEntityRepo.find).toHaveBeenCalledWith({ where: { isActive: true } });
      expect(result).toBe(nodes);
    });

    it('updates node if found', async () => {
      const existing = { nodeId: 'node-1', name: 'Old' } as StorageNode;
      vi.mocked(mockNodeEntityRepo.findOne!).mockResolvedValue(existing);
      vi.mocked(mockNodeEntityRepo.save!).mockImplementation(async (entity) => entity as StorageNode);

      const result = await nodeRepo.update('node-1', { name: 'New' });
      expect(result?.name).toBe('New');
    });

    it('returns null when updating non-existent node', async () => {
      vi.mocked(mockNodeEntityRepo.findOne!).mockResolvedValue(null);

      const result = await nodeRepo.update('node-404', { name: 'New' });
      expect(result).toBeNull();
    });

    it('deletes node by id', async () => {
      vi.mocked(mockNodeEntityRepo.delete!).mockResolvedValue({ raw: [], affected: 1 });

      await nodeRepo.delete('node-1');
      expect(mockNodeEntityRepo.delete).toHaveBeenCalledWith({ nodeId: 'node-1' });
    });
  });

  describe('Merged StorageObject read operations', () => {
    it('counts ready objects for a given node id', async () => {
      vi.mocked(mockObjectEntityRepo.count!).mockResolvedValue(42);

      const count = await nodeRepo.countReadyByNodeId('node-1');
      expect(mockObjectEntityRepo.count).toHaveBeenCalledWith({
        where: { storageNodeId: 'node-1', status: 'READY' },
      });
      expect(count).toBe(42);
    });

    it('sums ready bytes for a given node id', async () => {
      const mockQb = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({ total: '1048576' }),
      };
      vi.mocked(mockObjectEntityRepo.createQueryBuilder!).mockReturnValue(mockQb as never);

      const bytes = await nodeRepo.sumReadyBytesByNodeId('node-1');
      expect(mockObjectEntityRepo.createQueryBuilder).toHaveBeenCalledWith('storage');
      expect(mockQb.select).toHaveBeenCalledWith('COALESCE(SUM(CAST(storage.size AS BIGINT)), 0)', 'total');
      expect(mockQb.where).toHaveBeenCalledWith('storage.storageNodeId = :nodeId', { nodeId: 'node-1' });
      expect(mockQb.andWhere).toHaveBeenCalledWith('storage.status = :status', { status: 'READY' });
      expect(bytes).toBe(1048576);
    });

    it('handles null total as 0', async () => {
      const mockQb = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({ total: null }),
      };
      vi.mocked(mockObjectEntityRepo.createQueryBuilder!).mockReturnValue(mockQb as never);

      const bytes = await nodeRepo.sumReadyBytesByNodeId('node-empty');
      expect(bytes).toBe(0);
    });

    it('throws RangeError if total bytes exceeds safe integer', async () => {
      const mockQb = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({ total: '9007199254740992' }), // Number.MAX_SAFE_INTEGER + 1
      };
      vi.mocked(mockObjectEntityRepo.createQueryBuilder!).mockReturnValue(mockQb as never);

      await expect(nodeRepo.sumReadyBytesByNodeId('node-large')).rejects.toThrow(RangeError);
    });
  });
});
