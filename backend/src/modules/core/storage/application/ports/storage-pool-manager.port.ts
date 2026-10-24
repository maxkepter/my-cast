import { S3Client } from '@aws-sdk/client-s3';
import { StorageNode } from '../../domain/entities/storage-node.entity';

export const STORAGE_POOL_MANAGER = Symbol('STORAGE_POOL_MANAGER');

export interface StoragePoolManagerPort {
  /**
   * Khởi tạo và nạp kết nối S3Client cho một storage node vào connection pool.
   * Nếu node không hoạt động (isActive = false), node sẽ bị loại bỏ khỏi pool.
   *
   * @param node - Cấu hình thực thể StorageNode cần nạp.
   */
  loadNode(node: StorageNode): Promise<void> | void;

  /**
   * Làm mới kết nối của storage node trong connection pool (tái khởi tạo client khi cấu hình thay đổi).
   *
   * @param node - Cấu hình StorageNode mới cần cập nhật.
   */
  refreshNode(node: StorageNode): Promise<void> | void;

  /**
   * Hủy kết nối S3Client và xóa storage node khỏi connection pool theo ID.
   *
   * @param id - Định danh duy nhất (nodeId) của storage node.
   */
  removeNode(id: string): Promise<void> | void;

  /**
   * Lấy S3Client đang hoạt động và ở trạng thái khỏe mạnh (healthy) của một storage node cụ thể.
   * Ném lỗi nếu node không tồn tại, không hoạt động hoặc không healthy.
   *
   * @param nodeId - Định danh storage node cần lấy client.
   * @returns Thể hiện S3Client sẵn sàng thực thi lệnh.
   */
  getClientForNode(nodeId: string): S3Client;

  /**
   * Lựa chọn một storage node khả dụng theo thuật toán điều phối (Round Robin) để tiếp nhận dữ liệu tải lên mới.
   * Ném lỗi nếu không có node nào đang hoạt động và khỏe mạnh.
   *
   * @returns Cấu hình StorageNode được lựa chọn.
   */
  selectNode(): StorageNode;

  /**
   * Lấy danh sách tất cả các client cùng cấu hình node tương ứng đang ở trạng thái khỏe mạnh (healthy) và kích hoạt (active).
   *
   * @returns Danh sách các đối tượng chứa nodeId, S3Client và config node.
   */
  getHealthyClients(): Array<{
    nodeId: string;
    client: S3Client;
    config: StorageNode;
  }>;
}
