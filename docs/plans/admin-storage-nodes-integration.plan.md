# Plan: Sửa Điều Hướng Admin & Tích Hợp API Storage Nodes Thực Tế

## Tổng quan & Đánh giá SystemOne

### Mục tiêu tính năng
1. **Khắc phục lỗi điều hướng trang Quản trị**:
   - Truy cập `http://localhost:3000/admin` hiện đang bị `useEffect` trong `frontend/src/app/admin/page.tsx` tự động `router.replace('/admin/storage-nodes')`, làm che khuất Dashboard điều hành trung tâm. Cần loại bỏ auto-redirect này.
   - Trang đăng nhập quản trị `frontend/src/app/admin/login/page.tsx` đang fallback về `/admin/storage-nodes` khi không có query param `redirect`. Cần chuyển fallback về `/admin`.
2. **Tích hợp API Backend thực tế cho Storage Nodes**:
   - Trong `frontend/src/services/storage-admin.service.ts`: Xoá bỏ hành vi nuốt lỗi (catch block) và tự động fallback sang `mockStorageAdminService` trong môi trường development. Kết nối trực tiếp đến backend `/admin/storage-nodes` qua `apiClient` (đã có JWT Bearer token interceptor). Ném lỗi thực tế để UI (`StorageNodesPage`) hiển thị thông báo lỗi chi tiết qua `getStorageErrorMessage(err)`. Cung cấp cơ chế bật mock rõ ràng qua biến môi trường `NEXT_PUBLIC_USE_MOCK_STORAGE === 'true'`.
   - Trong `frontend/src/components/admin/storage/edit-storage-node-modal.tsx`: Tối ưu payload của `UpdateStorageNodeInput` trong form chỉnh sửa. Chỉ gửi các trường kết nối S3 (`endpoint`, `bucket`, `region`, `forcePathStyle`, `accessKeyId`, `secretAccessKey`) khi người dùng thực sự thay đổi chúng, tránh việc `forcePathStyle` và các giá trị ban đầu luôn bị gửi khiến backend kích hoạt `probeCandidate` (HeadBucket probe) không cần thiết khi chỉ muốn đổi Quota hoặc toggle Active.

---

### Báo cáo Quá trình & Kết quả SystemOne Evaluation

#### 1. Quá trình sử dụng (Evaluation Process)
- **Input State (`-s`)**: `"Sửa routing admin /admin và tích hợp backend thực tế cho admin/storage-nodes"`
- **Thiết kế Questions/Primitives (`-q`)**:
  - `complexity:number:Độ phức tạp kỹ thuật:1,10`: Đo lường độ phức tạp thay đổi kiến trúc và mã nguồn.
  - `risk:noun:Mức độ rủi ro:low,medium,high,critical`: Đánh giá rủi ro ảnh hưởng tới routing, authentication và I/O probe của S3.
  - `modules:list:Module liên quan:frontend,storage,auth,admin`: Xác định các bounded contexts bị tác động.
  - `strategy:noun:Chiến lược triển khai:clean_refactor,patch_fix,rewrite`: Định tuyến phương án thực thi tối ưu.
- **Lệnh thực thi**:
  ```bash
  node .agents/skills/systemone/script/systemone-eval.js \
    -s "Sửa routing admin /admin và tích hợp backend thực tế cho admin/storage-nodes" \
    -q "complexity:number:Độ phức tạp kỹ thuật:1,10" \
    -q "risk:noun:Mức độ rủi ro:low,medium,high,critical" \
    -q "modules:list:Module liên quan:frontend,storage,auth,admin" \
    -q "strategy:noun:Chiến lược triển khai:clean_refactor,patch_fix,rewrite"
  ```

#### 2. Kết quả định lượng từ SystemOne Engine
- **Engine Model**: `typesafe/jev-1.13-20260917`
- **Bảng kết quả**:

| Metric / Primitive | Kiểu dữ liệu | Giá trị Output | Confidence / Xác suất | Ghi chú đánh giá |
|---|---|---|---|---|
| `complexity` | `number` | **4.05 / 10** | 0.54 | Độ phức tạp trung bình, tập trung vào đồng bộ DTO và error handling |
| `risk` | `noun` | **medium** | `medium: 0.71`<br>`high: 0.24`<br>`low: 0.03`<br>`critical: 0.02` | Rủi ro trung bình do liên quan đến token authentication và probe S3 |
| `modules` | `list` | **`["admin", "storage", "frontend"]`** | `admin: 0.92`<br>`storage: 0.82`<br>`frontend: 0.60`<br>`auth: 0.41` | Tác động trực tiếp đến Admin Portal & Storage Gateway Service |
| `strategy` | `noun` | **patch_fix** | `patch_fix: 0.92`<br>`clean_refactor: 0.05`<br>`rewrite: 0.03` | Áp dụng chiến lược Patch Fix tinh gọn, bảo toàn logic hiện hữu |

#### 3. Quyết định kiến trúc dựa trên SystemOne
- Áp dụng chiến lược **patch_fix**: Không viết lại (rewrite) cấu trúc modal hay service, mà sửa chữa chuẩn xác logic lọc payload, gỡ bỏ auto-redirect và chuẩn hóa error propagation.
- Giữ vững ranh giới hợp đồng API REST giữa Frontend (`apiClient`) và Backend (`StorageAdminController`), không thay đổi backend schema trừ khi cần thiết.

---

## Ma trận phụ thuộc & Contracts giữa các Module

| Module | Phụ thuộc vào (Upstream) | Cung cấp cho (Downstream) | Exported Service / API | Event Schemas | Mock Spec cho Test |
|---|---|---|---|---|---|
| **Admin Portal UI** (`frontend/src/app/admin/`) | `StorageAdminService`, `useAuth` | End-user (Staff/Admin) | UI Pages (`/admin`, `/admin/login`, `/admin/storage-nodes`) | N/A (Client UI) | Router mocks, AuthContext mocks |
| **StorageAdminService** (`frontend/src/services/`) | `apiClient` (`axios`), `tokenService` | Storage UI Pages & Modals | `StorageAdminServiceContract` (`list`, `create`, `update`, `remove`, `healthCheck`) | N/A (HTTP Client) | `mockStorageAdminService`, `mockStorageNodes` |
| **Backend Storage Admin** (`backend/.../storage/`) | PostgreSQL (`StorageNodeEntity`), S3/MinIO | Frontend Admin Portal | REST API `/admin/storage-nodes` (GET, POST, PATCH, DELETE, POST health-check) | `delete.storage` | Unit test repository mocks, S3 client mocks |

### Chi tiết Contracts giữa Frontend và Backend
- **Endpoint Contracts**:
  - `GET /admin/storage-nodes`: Query params `{ status?: 'healthy' | 'unhealthy', search?: string }` -> Response `StorageNodeListRes { totalNodes: number, nodes: StorageNode[] }`.
  - `POST /admin/storage-nodes`: Body `CreateStorageNodeInput` -> Response `StorageNode`.
  - `PATCH /admin/storage-nodes/:id`: Body `UpdateStorageNodeInput` -> Response `StorageNode`.
  - `DELETE /admin/storage-nodes/:id` -> 204 No Content / 200 OK.
  - `POST /admin/storage-nodes/:id/health-check` -> Response `StorageNodeHealthRes { nodeId: string, isHealthy: boolean, checkedAt: string }`.
- **Backend Probe Contract Rule**:
  - Backend `StorageNodeAdminService.update()` kiểm tra:
    ```typescript
    const connectionChanged = [
      'endpoint', 'region', 'bucket', 'forcePathStyle', 'accessKeyId', 'secretAccessKey'
    ].some((key) => input[key as keyof UpdateStorageNodeReq] !== undefined);
    if (connectionChanged) await this.probeCandidate(candidate);
    ```
  - **Contract Requirement**: Client chỉ được truyền các trường trên khi giá trị thực sự khác với cấu hình hiện tại của node hoặc khi người dùng nhập thông tin xác thực mới. Nếu chỉ đổi quota hoặc active, payload PATCH **tuyệt đối không chứa** bất kỳ thuộc tính connection nào.

---

## Thiết kế chi tiết từng Module & Hạng mục

### Hạng mục 1: Điều hướng Admin (`frontend/src/app/admin/`)

#### 1. Ranh giới & Mục tiêu
- Khôi phục Dashboard tổng quan tại `/admin` làm trang chủ của khu vực quản trị.
- Đồng bộ fallback redirect của trang đăng nhập quản trị `/admin/login`.

#### 2. Chi tiết thay đổi
1. **`frontend/src/app/admin/page.tsx`**:
   - Xoá `useEffect` chứa lệnh `router.replace('/admin/storage-nodes')`.
   - Giữ nguyên toàn bộ JSX giao diện Dashboard (Trung tâm Điều hành Hệ thống, thống kê cụm lưu trữ, đường dẫn điều hướng nhanh).
   - Xoá import không sử dụng (`useEffect`).

2. **`frontend/src/app/admin/login/page.tsx`**:
   - Tại dòng 23 (kiểm tra đã đăng nhập ADMIN):
     - Đổi: `const redirectUrl = searchParams.get('redirect') || '/admin/storage-nodes';`
     - Thành: `const redirectUrl = searchParams.get('redirect') || '/admin';`
   - Tại dòng 45 (sau khi Google auth thành công với role ADMIN):
     - Đổi: `const redirectUrl = searchParams.get('redirect') || '/admin/storage-nodes';`
     - Thành: `const redirectUrl = searchParams.get('redirect') || '/admin';`

---

### Hạng mục 2: Tích hợp API Backend trong `storage-admin.service.ts`

#### 1. Ranh giới & Mục tiêu
- `StorageAdminService` là lớp API Client giao tiếp trực tiếp với Backend NestJS qua `apiClient`.
- Cần loại bỏ việc nuốt lỗi (silent error catching) và tự động fallback sang mock khi `process.env.NODE_ENV === 'development'`.
- Ném lỗi thật từ axios để UI bắt được và định dạng thông báo chính xác thông qua `getStorageErrorMessage(err)`.
- Giữ khả năng bật mock có chủ đích khi biến môi trường `NEXT_PUBLIC_USE_MOCK_STORAGE === 'true'` (hữu ích cho demo/offline testing), nhưng không chặn unit tests của `apiClient`.

#### 2. Thiết kế logic chi tiết
- **Kiểm tra Mock flag**:
  ```typescript
  const isMockEnabled = (): boolean => {
    return process.env.NEXT_PUBLIC_USE_MOCK_STORAGE === 'true';
  };
  ```
  *(Lưu ý: Không đặt `process.env.NODE_ENV === 'test'` ở biến cấp module tĩnh khiến `apiClient` không bao giờ được gọi trong unit test của `StorageAdminService`)*.

- **Cập nhật các phương thức**:
  1. `list(query?: StorageNodeListQuery): Promise<StorageNodeListRes>`:
     - Nếu `isMockEnabled()`: gọi `mockStorageAdminService.list(query)`.
     - Ngược lại: gọi `const res = await apiClient.get<StorageNodeListRes>('/admin/storage-nodes', { params: query }); return res.data;`
     - Không có catch block nuốt lỗi; lỗi sẽ được throw tự nhiên cho caller.
  2. `create(input: CreateStorageNodeInput): Promise<StorageNode>`:
     - Nếu `isMockEnabled()`: gọi `mockStorageAdminService.create(input)`.
     - Ngược lại: gọi `const res = await apiClient.post<StorageNode>('/admin/storage-nodes', input); return res.data;`
  3. `update(id: string, input: UpdateStorageNodeInput): Promise<StorageNode>`:
     - Nếu `isMockEnabled()`: gọi `mockStorageAdminService.update(id, input)`.
     - Ngược lại: gọi `const res = await apiClient.patch<StorageNode>(`/admin/storage-nodes/${id}`, input); return res.data;`
  4. `remove(id: string): Promise<void>`:
     - Nếu `isMockEnabled()`: gọi `mockStorageAdminService.remove(id)`.
     - Ngược lại: gọi `await apiClient.delete(`/admin/storage-nodes/${id}`);`
  5. `healthCheck(id: string): Promise<StorageNodeHealthRes>`:
     - Nếu `isMockEnabled()`: gọi `mockStorageAdminService.healthCheck(id)`.
     - Ngược lại: gọi `const res = await apiClient.post<StorageNodeHealthRes>(`/admin/storage-nodes/${id}/health-check`); return res.data;`

---

### Hạng mục 3: Tối ưu hóa Payload trong `edit-storage-node-modal.tsx`

#### 1. Ranh giới & Mục tiêu
- Ngăn chặn tình trạng mọi thao tác cập nhật (kể cả chỉ sửa `quotaBytes` hoặc bật/tắt `isActive`) đều gửi kèm các trường S3 connection, đặc biệt là `forcePathStyle: true`.
- Loại bỏ kích hoạt bucket probe không mong muốn ở backend, tăng tốc độ phản hồi và tránh lỗi khi credentials không được nhập lại.

#### 2. Chi tiết thiết kế Form State & Payload Assembly
1. **Theo dõi trạng thái thay đổi (Dirty Tracking)**:
   - Thêm cờ theo dõi tương tác của người dùng với `forcePathStyle`:
     ```typescript
     const [isForcePathStyleChanged, setIsForcePathStyleChanged] = useState(false);
     ```
   - Trong thẻ input của `forcePathStyle`:
     ```typescript
     onChange={(e) => {
       setForcePathStyle(e.target.checked);
       setIsForcePathStyleChanged(true);
     }}
     ```
2. **Xây dựng Payload có chọn lọc trong `handleSubmit`**:
   - Khởi tạo payload cơ bản:
     ```typescript
     const quotaBytes = toQuotaBytes(quotaValue, quotaUnit);
     const payload: UpdateStorageNodeInput = {};

     // Quota & Active status
     if (quotaBytes !== node.quotaBytes) {
       payload.quotaBytes = quotaBytes;
     } else {
       payload.quotaBytes = quotaBytes; // đảm bảo luôn có giá trị quota hợp lệ
     }

     if (isActive !== node.isActive) {
       payload.isActive = isActive;
     }

     // S3 Connection fields: CHỈ gửi khi thực sự thay đổi so với node hiện tại
     const trimmedEndpoint = endpoint.trim();
     if (trimmedEndpoint && trimmedEndpoint !== (node.endpoint || '')) {
       payload.endpoint = trimmedEndpoint;
     }

     const trimmedRegion = region.trim();
     if (trimmedRegion && trimmedRegion !== (node.region || '')) {
       payload.region = trimmedRegion;
     }

     const trimmedBucket = bucket.trim();
     if (trimmedBucket && trimmedBucket !== (node.bucket || '')) {
       payload.bucket = trimmedBucket;
     }

     // Chỉ gửi forcePathStyle nếu người dùng thực sự chủ động thay đổi toggle này
     if (isForcePathStyleChanged) {
       payload.forcePathStyle = forcePathStyle;
     }

     // Credentials: chỉ gửi khi có nhập giá trị mới
     if (accessKeyId.trim()) {
       payload.accessKeyId = accessKeyId.trim();
     }
     if (secretAccessKey.trim()) {
       payload.secretAccessKey = secretAccessKey.trim();
     }
     ```
   - Kiểm tra rỗng: Đảm bảo payload có ít nhất 1 trường trước khi gọi API để tránh vi phạm validation ở backend:
     ```typescript
     if (Object.keys(payload).length === 0) {
       handleClose();
       return;
     }
     ```

---

## Cấu hình Backend NestJS @Module hoàn chỉnh (Tham chiếu)

Module `StorageModule` ở backend quản lý toàn bộ các API endpoint trên:
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([StorageNodeEntity, StorageObjectEntity]),
    EventEmitterModule,
  ],
  controllers: [StorageAdminController],
  providers: [
    StorageNodeAdminService,
    StoragePoolManager,
    S3StorageService,
    StorageNodeDeletionPolicy,
    StorageNodeDatabaseRepository,
    StorageExceptionInterceptor,
    DeleteStorageHandler,
    {
      provide: STORAGE_CONTRACT,
      useExisting: S3StorageService,
    },
    {
      provide: STORAGE_NODE_REPOSITORY,
      useExisting: StorageNodeDatabaseRepository,
    },
  ],
  exports: [STORAGE_CONTRACT, StoragePoolManager],
})
export class StorageModule {}
```

---

## Phân công triển khai cho Executor

- **Task 1: Sửa điều hướng Admin Dashboard & Login Fallback**
  - File: `frontend/src/app/admin/page.tsx`
    - Xoá `useEffect` redirect về `/admin/storage-nodes`.
    - Dọn dẹp import.
  - File: `frontend/src/app/admin/login/page.tsx`
    - Đổi fallback redirect từ `/admin/storage-nodes` thành `/admin` tại 2 vị trí (useEffect auto-redirect và handleGoogleSuccess).

- **Task 2: Tích hợp API thật và chuẩn hóa Error Handling trong StorageAdminService**
  - File: `frontend/src/services/storage-admin.service.ts`
    - Cấu hình hàm `isMockEnabled() = process.env.NEXT_PUBLIC_USE_MOCK_STORAGE === 'true'`.
    - Viết lại các phương thức `list`, `create`, `update`, `remove`, `healthCheck` để gọi `apiClient` trực tiếp khi không mock.
    - Loại bỏ hoàn toàn fallback dev trong catch block, để axios error ném thẳng ra caller.
  - File: `frontend/src/services/storage-admin.service.spec.ts`
    - Cập nhật test suite để xác minh `StorageAdminService` gọi đúng `apiClient` mà không bị mock chặn.

- **Task 3: Tối ưu payload UpdateStorageNodeInput trong Edit Modal**
  - File: `frontend/src/components/admin/storage/edit-storage-node-modal.tsx`
    - Thêm state `isForcePathStyleChanged`.
    - So khớp `endpoint`, `region`, `bucket` với giá trị ban đầu của `node`.
    - Chỉ gán các trường kết nối vào payload khi dirty/changed.

---

## Tiêu chí kiểm thử cho Auditor

### Pha 1: Kiểm thử Nội bộ Frontend (Unit Tests & Static Check)
- [ ] Chạy vitest trên file `frontend/src/services/storage-admin.service.spec.ts`:
  - 28/28 tests phải pass 100%.
  - Tất cả 5 tests trong `describe('StorageAdminService (API Client)')` (`list`, `create`, `update`, `remove`, `healthCheck`) phải pass và gọi đúng `apiClient` methods kèm URL tương ứng.
- [ ] Kiểm tra static phân tích code:
  - Không còn `router.replace('/admin/storage-nodes')` trong `frontend/src/app/admin/page.tsx`.
  - Fallback url trong `frontend/src/app/admin/login/page.tsx` là `/admin`.
  - `edit-storage-node-modal.tsx` không gửi `forcePathStyle` mặc định khi không thay đổi.

### Pha 2: Kiểm thử Tích hợp & Build Toàn Bộ Hệ Thống
- [ ] Next.js Build (`npm run build` trong `frontend/`): Không có lỗi TypeScript hay cú pháp.
- [ ] Backend Test: Chạy vitest backend đảm bảo các endpoint `/admin/storage-nodes` tiếp tục pass 100%.
- [ ] Luồng người dùng thực tế:
  - Truy cập `http://localhost:3000/admin`: Hiển thị trang Trung tâm Điều hành Hệ thống, không bị chuyển hướng.
  - Nhấp vào nút "Đến Quản lý Storage Nodes": Chuyển hướng đúng tới `/admin/storage-nodes`.
  - Chỉnh sửa quota của một node trong modal: Kiểm tra network tab chỉ gửi `{ quotaBytes: ... }`, backend phản hồi 200 OK ngay mà không probe bucket.
