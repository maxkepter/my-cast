import { Readable, Writable } from 'node:stream';

export interface LocalFileStat {
  size: number;
  isDirectory: boolean;
  isFile: boolean;
  modifiedAt: Date;
}

export interface LocalStorageCleanResult {
  deletedDirsCount: number;
  deletedFilesCount: number;
  freedBytes: number;
}

export const LOCAL_STORAGE_SERVICE = Symbol('LOCAL_STORAGE_SERVICE');

export interface LocalStorageService {
  /**
   * Tạo thư mục tạm thời độc lập cho 1 job transcode (vd: /tmp/mycast/job-123).
   * @param prefix Tiền tố thư mục (mặc định: 'job-')
   * @returns Đường dẫn tuyệt đối đến thư mục tạm vừa tạo
   */
  createTempDir(prefix?: string): Promise<string>;

  /**
   * Đảm bảo thư mục tồn tại, tạo đệ quy nếu chưa có.
   */
  ensureDir(dirPath: string): Promise<void>;

  /**
   * Ghi dữ liệu vào file cục bộ (hỗ trợ Buffer, string hoặc Stream).
   */
  writeFile(
    filePath: string,
    data: Buffer | Uint8Array | string | Readable,
  ): Promise<string>;

  /**
   * Đọc toàn bộ nội dung file thành Buffer.
   */
  readFile(filePath: string): Promise<Buffer>;

  /**
   * Mở ReadStream để đọc file (pipe sang FFmpeg hoặc HTTP upload).
   */
  createReadStream(filePath: string): Readable;

  /**
   * Mở WriteStream để ghi dữ liệu (nhận từ download HTTP).
   */
  createWriteStream(filePath: string): Writable;

  /**
   * Xóa một file cục bộ.
   */
  deleteFile(filePath: string): Promise<void>;

  /**
   * Xóa đệ quy toàn bộ thư mục và các tệp tin bên trong (dọn dẹp workspace sau job).
   */
  deleteDir(dirPath: string): Promise<void>;

  /**
   * Kiểm tra sự tồn tại của file hoặc thư mục.
   */
  exists(targetPath: string): Promise<boolean>;

  /**
   * Lấy thông tin thống kê của file/thư mục.
   */
  stat(targetPath: string): Promise<LocalFileStat>;

  /**
   * Liệt kê danh sách đường dẫn tuyệt đối các file trong thư mục.
   * @param dirPath Thư mục cần duyệt
   * @param recursive Có duyệt đệ quy hay không (mặc định: false)
   */
  listFiles(dirPath: string, recursive?: boolean): Promise<string[]>;

  /**
   * Chuyển đổi đường dẫn tương đối thành đường dẫn tuyệt đối theo base dir.
   */
  resolvePath(...paths: string[]): string;

  /**
   * Dọn dẹp các thư mục tạm mồ côi (orphaned jobs) có tuổi thọ lớn hơn maxAgeMs.
   * @param maxAgeMs Thời gian hết hạn tính bằng mili giây (mặc định: 2 giờ)
   */
  cleanupOrphanedDirs(maxAgeMs?: number): Promise<LocalStorageCleanResult>;
}
