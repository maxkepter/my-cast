# Plan: Khắc Phục Lỗi 500 RoleGuard Thiếu @Injectable() & Bổ Sung Unit Test Suite

## Tổng quan & Đánh giá SystemOne

### Mục tiêu tính năng & Sửa lỗi
Khi người dùng hoặc hệ thống truy cập endpoint quản trị (ví dụ: `GET /admin/storage-nodes`), máy chủ phản hồi lỗi HTTP 500:
```
[Nest] 1388  - 11/20/2026, 9:41:30 PM   ERROR [ExceptionsHandler] TypeError: Cannot read properties of undefined (reading 'getAllAndOverride')
    at RoleGuard.canActivate (D:\SE\project\my-cast\backend\src\modules\features\auth\infra\guards\role.guard.ts:13:42)
```

**Nguyên nhân kỹ thuật**:
Trong NestJS, dependency injection (DI) dựa trên TypeScript decorators và reflection metadata (`reflect-metadata`). File [role.guard.ts](file:///d:/SE/project/my-cast/backend/src/modules/features/auth/infra/guards/role.guard.ts) định nghĩa class `RoleGuard` có constructor `constructor(private readonly reflector: Reflector) {}` nhưng **thiếu decorator `@Injectable()`** từ `@nestjs/common`.

Khi một Guard không có decorator `@Injectable()`, TypeScript compiler không emit metadata tham số constructor (`design:paramtypes`). Do đó, khi NestJS IoC container khởi tạo `RoleGuard` (khi controller sử dụng `@UseGuards(JwtGuard, RoleGuard)`), nó không thể inject instance của `Reflector`, dẫn đến `this.reflector` mang giá trị `undefined`. Khi phương thức `canActivate` thực thi dòng 13:
```typescript
const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [ ... ]);
```
lập tức phát sinh `TypeError: Cannot read properties of undefined (reading 'getAllAndOverride')`.

**Mục tiêu giải quyết**:
1. Thêm decorator `@Injectable()` vào class `RoleGuard` trong `backend/src/modules/features/auth/infra/guards/role.guard.ts`.
2. Tạo test suite đơn vị [role.guard.spec.ts](file:///d:/SE/project/my-cast/backend/src/modules/features/auth/infra/guards/role.guard.spec.ts) bao phủ toàn diện:
   - Xác thực khởi tạo và giải quyết dependency injection của `Reflector` thông qua `Test.createTestingModule`.
   - Test case: Cho phép truy cập khi không khai báo `@Roles()` (route public hoặc không yêu cầu role cụ thể).
   - Test case: Cho phép truy cập khi `req.user.role` nằm trong danh sách `requiredRoles`.
   - Test case: Chặn truy cập (trả về `false`) khi `req.user.role` không khớp.
   - Test case: Chặn truy cập (trả về `false`) khi `req.user` bị `undefined` hoặc không có thuộc tính `role`.
   - Test case: Kiểm tra tính ưu tiên của handler metadata so với controller class metadata (override behavior).
3. Đảm bảo toàn bộ backend test suites pass và endpoint `/admin/storage-nodes` hoạt động bình thường, không còn lỗi 500.

---

### Báo cáo Quá trình & Kết quả SystemOne Evaluation

#### 1. Quá trình sử dụng (Evaluation Process)
- **Input State (`-s`)**: `"Fix TypeError: Cannot read properties of undefined (reading 'getAllAndOverride') in RoleGuard at /admin/storage-nodes due to missing @Injectable() decorator in role.guard.ts. NestJS IoC fails to inject Reflector dependency. Need to add @Injectable() and create unit test suite covering reflector injection and role authorization checks."`
- **Thiết kế Questions/Primitives (`-q`)**:
  - `complexity:number:Độ phức tạp kỹ thuật:1,10`: Đo lường độ phức tạp thay đổi mã nguồn và phạm vi test.
  - `risk:noun:Mức độ rủi ro:low,medium,high,critical`: Đánh giá rủi ro ảnh hưởng bảo mật và RBAC toàn hệ thống.
  - `modules:list:Module liên quan:auth,user,storage,admin`: Xác định các bounded context chịu ảnh hưởng.
  - `pattern:noun:Phương án xử lý:ioc_decorator_fix,custom_guard_refactor,global_guard_provider`: Định tuyến giải pháp kiến trúc tối ưu.
- **Lệnh thực thi**:
  ```bash
  node .agents/skills/systemone/script/systemone-eval.js \
    -s "Fix TypeError: Cannot read properties of undefined (reading 'getAllAndOverride') in RoleGuard at /admin/storage-nodes due to missing @Injectable() decorator in role.guard.ts. NestJS IoC fails to inject Reflector dependency. Need to add @Injectable() and create unit test suite covering reflector injection and role authorization checks." \
    -q "complexity:number:Độ phức tạp kỹ thuật:1,10" \
    -q "risk:noun:Mức độ rủi ro:low,medium,high,critical" \
    -q "modules:list:Module liên quan:auth,user,storage,admin" \
    -q "pattern:noun:Phương án xử lý:ioc_decorator_fix,custom_guard_refactor,global_guard_provider"
  ```

#### 2. Kết quả định lượng từ SystemOne Engine
- **Engine Model**: `typesafe/jev-1.13-20260917`
- **Bảng kết quả**:

| Metric / Primitive | Kiểu dữ liệu | Giá trị Output | Confidence / Xác suất | Ghi chú đánh giá |
|---|---|---|---|---|
| `complexity` | `number` | **3.31 / 10** | 0.48 | Độ phức tạp thấp đến trung bình: sửa 1 dòng decorator và viết test suite chuẩn |
| `risk` | `noun` | **medium** | `medium: 0.47`<br>`low: 0.38`<br>`high: 0.12`<br>`critical: 0.03` | Rủi ro trung bình vì RoleGuard quản lý phân quyền (RBAC) cho toàn bộ API Admin |
| `modules` | `list` | **`["auth", "admin"]`** | `auth: 0.86`<br>`admin: 0.83`<br>`storage: 0.41`<br>`user: 0.26` | Tác động trực tiếp đến Auth infra guard và luồng bảo vệ Admin routes |
| `pattern` | `noun` | **ioc_decorator_fix** | `ioc_decorator_fix: 1.00`<br>`custom_guard_refactor: 0.00`<br>`global_guard_provider: 0.00` | Khắc phục chuẩn NestJS IoC với `@Injectable()` và giữ nguyên guard contract |

#### 3. Quyết định kiến trúc dựa trên SystemOne
- Áp dụng phương án **ioc_decorator_fix**:
  - Gắn `@Injectable()` từ `@nestjs/common` vào `RoleGuard` để NestJS compiler kích hoạt phát sinh constructor metadata.
  - Giữ nguyên cấu trúc DI qua constructor `constructor(private readonly reflector: Reflector) {}`.
  - Không thay đổi contract công khai của `AuthModule` hay `auth.contract.ts` vì `RoleGuard` đã được export đầy đủ.
  - Bổ sung Unit Test độc lập để ngăn chặn hồi quy (regression) và đảm bảo 100% coverage cho nhánh kiểm tra role.

---

## Ma trận phụ thuộc & Contracts giữa các Module

| Module | Phụ thuộc vào (Upstream) | Cung cấp cho (Downstream) | Exported Service / API | Event Schemas | Mock Spec cho Test |
|---|---|---|---|---|---|
| **AuthModule** (`backend/src/modules/features/auth`) | `UserModule` (Role Enum), `@nestjs/core` (Reflector) | Tất cả các Controller cần RBAC (`StorageAdminController`, `AdminController`, v.v.) | `RoleGuard`, `Roles`, `JwtGuard`, `AuthService` | N/A | Mock `Reflector`, Mock `ExecutionContext` |
| **StorageModule (Admin Controller)** (`backend/src/modules/core/storage`) | `AuthModule` (`RoleGuard`, `Roles`, `JwtGuard`) | Frontend Admin Portal (`/admin/storage-nodes`) | REST API: `GET, POST, PATCH, DELETE /admin/storage-nodes` | `delete.storage` | Mock `RoleGuard` returning `true` |

### Chi tiết Contracts giữa các module
- **Contract AuthModule ↔ Downstream Modules**:
  ```typescript
  // File: backend/src/modules/features/auth/contracts/auth.contract.ts
  export { RoleGuard } from '../infra/guards/role.guard';
  export { Roles, ROLES_KEY } from '../infra/decorators/role.decorator';
  export { JwtGuard } from '../infra/guards/jwt.guard';
  export { Role } from '../../user/domain/enums/role.enum';
  ```
- **Mock Spec cho Unit Test `RoleGuard`**:
  ```typescript
  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const createMockExecutionContext = (user?: any): ExecutionContext => ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
      getResponse: jest.fn(),
      getNext: jest.fn(),
    }),
  } as unknown as ExecutionContext);
  ```

---

## Thiết kế chi tiết từng Module (Tuân thủ 6 bước)

### Module: AuthModule (`backend/src/modules/features/auth`)

#### 1. Ranh giới & Phụ thuộc
- Phụ thuộc upstream: `UserModule` (cung cấp enum `Role`), `@nestjs/core` (`Reflector`).
- Cung cấp cho downstream: Bảo vệ các route phân quyền dựa trên role (RBAC).

#### 2. Business Rules (Enums & Metadata)
- Role Enum (`domain/enums/role.enum.ts`):
  - `Role.ADMIN = 'admin'`
  - `Role.USER = 'user'`
- Rule 1: Nếu endpoint không gắn `@Roles(...)` (hoặc mảng role rỗng) -> `canActivate` trả về `true` (cho phép).
- Rule 2: Nếu endpoint gắn `@Roles(...)` mà request không có `req.user` hoặc không có `req.user.role` -> trả về `false`.
- Rule 3: Nếu `req.user.role` nằm trong danh sách `requiredRoles` -> trả về `true`.
- Rule 4: Nếu `req.user.role` không thuộc `requiredRoles` -> trả về `false`.

#### 3. API & Schema (Guard Contract)
- Class: `RoleGuard implements CanActivate`
- Constructor: `constructor(private readonly reflector: Reflector)`
- Method: `canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>`

#### 4. Domain Models
- `Role` enum từ `backend/src/modules/features/user/domain/enums/role.enum.ts`.

#### 5. Usecase Services & Event Handlers
- Guard hoạt động như một interception usecase kiểm tra authorization trước khi request chạm vào controller handler.

#### 6. Triển khai Infra & Cấu hình Module
- **Cập nhật File**: [role.guard.ts](file:///d:/SE/project/my-cast/backend/src/modules/features/auth/infra/guards/role.guard.ts)
  - Import `Injectable` từ `@nestjs/common`.
  - Thêm decorator `@Injectable()` trước `export class RoleGuard implements CanActivate`.
- **Cấu hình `@Module` hoàn chỉnh của `AuthModule`**:
  ```typescript
  @Module({
    imports: [
      TypeOrmModule.forFeature([RefreshToken, User]),
      PassportModule.register({ defaultStrategy: 'jwt' }),
      JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          secret: config.get<string>('JWT_SECRET', 'jwt-secret'),
          signOptions: {
            expiresIn: (config.get<string>('JWT_EXPIRATION', '1h') as any),
          },
        }),
      }),
      ConfigModule,
      UserModule,
      EventModule,
    ],
    controllers: [AuthController],
    providers: [
      AuthService,
      RefreshTokenService,
      JwtStrategy,
      JwtGuard,
      RoleGuard,
    ],
    exports: [
      AuthService,
      RefreshTokenService,
      JwtGuard,
      RoleGuard,
      JwtModule,
      PassportModule,
      TypeOrmModule,
    ],
  })
  export class AuthModule {}
  ```

---

## Danh sách phân công triển khai (cho Executor)

### Task 1: Sửa mã nguồn `role.guard.ts`
- **File**: `backend/src/modules/features/auth/infra/guards/role.guard.ts`
- **Thao tác**:
  1. Thêm `Injectable` vào import từ `@nestjs/common`:
     ```typescript
     import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
     ```
  2. Gắn decorator `@Injectable()` ngay phía trên định nghĩa class:
     ```typescript
     @Injectable()
     export class RoleGuard implements CanActivate {
       constructor(private readonly reflector: Reflector) {}
       ...
     }
     ```

### Task 2: Viết Unit Test Suite `role.guard.spec.ts`
- **File tạo mới**: `backend/src/modules/features/auth/infra/guards/role.guard.spec.ts`
- **Nội dung test**:
  1. **DI Resolution test**:
     - Sử dụng `Test.createTestingModule({ providers: [RoleGuard, { provide: Reflector, useValue: mockReflector }] }).compile()`.
     - Lấy guard qua `module.get<RoleGuard>(RoleGuard)`.
     - Xác nhận `guard` và `guard['reflector']` được định nghĩa (`expect(guard).toBeDefined()`, `expect(guard['reflector']).toBeDefined()`).
  2. **No required roles**:
     - `mockReflector.getAllAndOverride.mockReturnValue(undefined)` -> `guard.canActivate(context)` trả về `true`.
     - `mockReflector.getAllAndOverride.mockReturnValue([])` -> `guard.canActivate(context)` trả về `true`.
  3. **User has authorized role**:
     - `mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN])`.
     - Context request có user: `{ id: '1', role: Role.ADMIN }`.
     - `guard.canActivate(context)` trả về `true`.
  4. **User has unauthorized role**:
     - `mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN])`.
     - Context request có user: `{ id: '2', role: Role.USER }`.
     - `guard.canActivate(context)` trả về `false`.
  5. **User unauthenticated or missing role in request**:
     - Context request có user: `undefined` -> trả về falsy / `false`.
     - Context request có user: `{ id: '3' }` (không có role) -> trả về falsy / `false`.
  6. **Metadata override resolution**:
     - Xác nhận `reflector.getAllAndOverride` được gọi đúng với `ROLES_KEY` và targets `[context.getHandler(), context.getClass()]`.

---

## Tiêu chí kiểm thử (cho Auditor)

### Pha 1: Kiểm thử nội bộ Module Auth
- [ ] File `backend/src/modules/features/auth/infra/guards/role.guard.ts` có decorator `@Injectable()`.
- [ ] Chạy unit test riêng cho `RoleGuard`:
  ```bash
  cd backend && npm test -- src/modules/features/auth/infra/guards/role.guard.spec.ts
  ```
  Kết quả: 100% test cases pass.
- [ ] Chạy toàn bộ test suite của auth module:
  ```bash
  cd backend && npm test -- src/modules/features/auth
  ```
  Kết quả: Tất cả test của auth module pass.

### Pha 2: Kiểm thử tích hợp toàn bộ hệ thống
- [ ] Khởi động hoặc kiểm tra build backend:
  ```bash
  cd backend && npm run build
  ```
  Không có lỗi type-check hoặc compilation.
- [ ] Xác nhận không còn lỗi `TypeError: Cannot read properties of undefined (reading 'getAllAndOverride')` khi gửi request đến endpoint có sử dụng `@UseGuards(RoleGuard)` (như `/admin/storage-nodes`).
- [ ] Monorepo lint và type check pass 100%.
