# Project Guidelines

## SystemOne Evaluation
Dùng cho phân loại ngữ nghĩa, định tuyến (router) và đánh giá có định kiểu.

- **Skill**: `systemone` (chi tiết: [.claude/skills/systemone/SKILL.md](.claude/skills/systemone/SKILL.md)).
- **Script**: `.claude/skills/systemone/script/systemone-eval.js`
- **Biến môi trường**:
  - `JEV_API_KEY`: API key xác thực (bắt buộc).
  - `JEV_ENDPOINT_URL`: Endpoint (mặc định `https://router.kepter.id.vn/v1/systemone`).
  - `JEV_MODEL`: Model (mặc định `oc/jev-1.13-free`).
- **Primitives**:
  - `noul`: Boolean / xác suất [0..1].
  - `noun` / `choice`: Chọn 1 option kèm phân phối xác suất.
  - `string`: Trích xuất chuỗi / định danh.
  - `number` / `score`: Đo lường thang điểm (`min, max` hoặc ordered levels).
  - `list`: Chọn nhiều nhãn phù hợp (multi-label).

### Hướng dẫn sử dụng

#### 1. Thiết lập biến môi trường (Tự động nạp từ file `.env` nếu có)
Tạo file `.claude/skills/systemone/script/.env`:
```env
JEV_API_KEY=your-api-key
JEV_ENDPOINT_URL=https://router.kepter.id.vn/v1/systemone
JEV_MODEL=oc/jev-1.13-free
```

#### 2. Chạy trực tiếp qua CLI Flags (Không cần tạo file JSON)

**Ví dụ đánh giá đủ 5 types:**
```bash
node .claude/skills/systemone/script/systemone-eval.js \
  -s "Video streaming API gặp lỗi timeout khi upload video 2GB" \
  --noul is_urgent "Có khẩn cấp không?" \
  --noun category "Phân loại lỗi" "bug,performance,billing" \
  --number priority "Mức độ ưu tiên" "1,5" \
  --list tags "Các bộ phận liên quan" "backend,frontend,storage,devops" \
  --string target "Module bị ảnh hưởng" "video_upload,user_profile,auth"
```

**Hoặc dùng cú pháp gọn `-q`:**
```bash
node .claude/skills/systemone/script/systemone-eval.js \
  -s "Checkout error 500" \
  -q "urgent:noul:Có khẩn cấp không?" \
  -q "team:noun:Chọn team:be,fe,devops" \
  -q "priority:number:Độ ưu tiên:1,5" \
  -q "tags:list:Nhãn:database,auth,payment"
```

#### 3. Sử dụng dạng Node.js Module
```javascript
const { evaluate } = require('./.claude/skills/systemone/script/systemone-eval');
const res = await evaluate({ state, questions });
```

Payload mẫu đủ 5 types: [.claude/skills/systemone/examples/all-types-payload.json](.claude/skills/systemone/examples/all-types-payload.json)

Quy trình: gom context vào `state` -> sinh `questions` -> chạy script -> rẽ nhánh logic.
