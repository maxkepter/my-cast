import {
  CreateStorageNodeReq,
  StorageNodeListQueryReq,
  UpdateStorageNodeReq,
} from '../../dtos/req.dto';
import {
  StorageNodeHealthRes,
  StorageNodeListRes,
  StorageNodeRes,
} from '../../dtos/res.dto';

export const STORAGE_NODE_ADMIN_SERVICE = Symbol('STORAGE_NODE_ADMIN_SERVICE');

export interface StorageNodeAdminService {
  /**
   * Truy vấn và liệt kê danh sách các storage node theo tiêu chí bộ lọc (nguồn ENV/DB, trạng thái healthy/unhealthy).
   *
   * @param query - Tham số truy vấn bộ lọc danh sách node.
   * @returns Danh sách storage node kèm thông tin chế độ lưu trữ (mode) và tổng số node.
   */
  list(query?: StorageNodeListQueryReq): Promise<StorageNodeListRes>;

  /**
   * Tạo mới một storage node lưu vào cơ sở dữ liệu sau khi kiểm tra probe kết nối thành công tới bucket và nạp node vào pool.
   *
   * @param input - DTO chứa thông tin kết nối và quota của storage node mới.
   * @returns Thông tin chi tiết của storage node vừa được tạo.
   */
  create(input: CreateStorageNodeReq): Promise<StorageNodeRes>;

  /**
   * Cập nhật thông tin cấu hình (credentials, endpoint, quota, trạng thái kích hoạt) của một storage node trong database và làm mới pool.
   *
   * @param id - Định danh node cần cập nhật.
   * @param input - DTO chứa các trường cấu hình cần thay đổi.
   * @returns Thông tin chi tiết của storage node sau khi cập nhật.
   */
  update(id: string, input: UpdateStorageNodeReq): Promise<StorageNodeRes>;

  /**
   * Xóa một storage node khỏi database và giải phóng khỏi pool sau khi đảm bảo an toàn (không còn object ở trạng thái ready).
   *
   * @param id - Định danh storage node cần xóa.
   */
  remove(id: string): Promise<void>;

  /**
   * Thực hiện kiểm tra tính sẵn sàng (health check) và kết nối thực tế tới bucket của storage node.
   *
   * @param id - Định danh storage node cần kiểm tra.
   * @returns Kết quả kiểm tra trạng thái hoạt động và khả năng truy cập bucket của node.
   */
  healthCheck(id: string): Promise<StorageNodeHealthRes>;
}
