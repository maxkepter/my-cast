---
name: systemone
description: Đánh giá có định kiểu và phân loại ngữ nghĩa qua SystemOne Engine (noul, noun/choice, string, number/score, list) trực tiếp bằng CLI flags, Node.js module hoặc JSON input.
---

# SystemOne Evaluation Skill

Skill hỗ trợ đánh giá ngữ nghĩa có định kiểu, định tuyến và chấm điểm định lượng trực tiếp qua CLI flags, JavaScript API hoặc JSON input, tự động load file `.env` và hỗ trợ đầy đủ 5 kiểu dữ liệu nguyên tử.

## 1. Cấu hình Biến Môi Trường (Prerequisites)

Cấu hình trong shell environment, `.env` ở thư mục gốc dự án, hoặc `.agents/skills/systemone/script/.env` (tuyệt đối không commit `.env`; xem mẫu tại `.env.example`):

- `JEV_API_KEY` hoặc `TYPESAFE_API_KEY` (bắt buộc): API key xác thực.
- `JEV_ENDPOINT_URL` (tùy chọn): Custom SystemOne endpoint URL (mặc định `http://localhost:8080/v1/systemone`).
- `JEV_MODEL` (tùy chọn): Model chỉ định (mặc định `systemone-1.0`).

Nếu chưa cấu hình API key, ghi nhận SystemOne là `Skipped` và nêu rõ lý do đánh giá định tính.

## 2. 5 Primitives Hỗ Trợ Đầy Đủ

1. **`noul`** (Boolean / Xác suất `[0..1]`): Đánh giá xác suất đúng/sai của một mệnh đề.
2. **`noun` / `choice`** (Phân loại danh mục): Chọn đúng 1 phương án trong danh sách `options` kèm phân phối xác suất.
3. **`string`** (Trích xuất chuỗi): Trích xuất nhãn/định danh cụ thể từ danh sách options hoặc state.
4. **`number` / `score`** (Thang điểm đo lường):
   - `number`: Đo lường trên thang số (`min, max`).
   - `score`: Thang điểm dựa trên các level mô tả có thứ tự.
5. **`list`** (Multi-label): Chọn nhiều nhãn phù hợp từ danh sách `options`.

---

## 3. Cách Dùng Trực Tiếp Qua CLI

Script tại: `.agents/skills/systemone/script/systemone-eval.js` (chạy `--help` để xem hướng dẫn).

### Cú pháp CLI Flags Đầy Đủ 5 Types:

```bash
node .agents/skills/systemone/script/systemone-eval.js \
  -s "Nội dung / Context cần đánh giá" \
  --noul <id> "<câu hỏi>" \
  --noun <id> "<câu hỏi>" "<opt1,opt2,opt3>" \
  --string <id> "<câu hỏi>" "<opt1,opt2,opt3>" \
  --number <id> "<câu hỏi>" "<min,max>" \
  --score <id> "<câu hỏi>" "<Level 0,Level 1,Level 2>" \
  --list <id> "<câu hỏi>" "<tag1,tag2,tag3>"
```

### Ví dụ Thực Tế (MyCast):

```bash
node .agents/skills/systemone/script/systemone-eval.js \
  -s "Video streaming API gặp lỗi timeout khi upload video 2GB" \
  --noul is_urgent "Có khẩn cấp không?" \
  --noun category "Phân loại lỗi" "bug,performance,billing" \
  --number priority "Mức độ ưu tiên" "1,5" \
  --list tags "Các bộ phận liên quan" "backend,frontend,storage,devops" \
  --string target "Module bị ảnh hưởng" "video_upload,user_profile,auth"
```

### Cú pháp Rút Gọn `-q`:

```bash
node .agents/skills/systemone/script/systemone-eval.js \
  -s "User report video spam" \
  -q "is_valid:noul:Report có hợp lệ không?" \
  -q "action:noun:Hành động:ban=Khóa tài khoản,warn=Cảnh cáo,dismiss=Bỏ qua" \
  -q "severity:number:Mức độ nghiêm trọng:1,5" \
  -q "tags:list:Loại vi phạm:spam,harassment,hate_speech"
```

---

## 4. Cách Dùng Dạng Module Node.js

```javascript
const { evaluate } = require("./.agents/skills/systemone/script/systemone-eval");

const res = await evaluate({
  state: { text: "Video streaming API" },
  questions: {
    is_core: { type: "noul", instructions: "Có phải core domain?" },
    category: { type: "noun", instructions: "Danh mục", options: ["video", "social", "auth"] },
    priority: { type: "number", instructions: "Độ ưu tiên", min: 1, max: 5 },
    tags: { type: "list", instructions: "Tags liên quan", options: ["be", "fe", "storage"] }
  }
});
```

---

## 5. Truyền File hoặc Pipe (Tùy chọn)

```bash
node .agents/skills/systemone/script/systemone-eval.js payload.json
```

## 6. Quy Chuẩn Báo Cáo (Reporting Standard)

Khi báo cáo kết quả SystemOne trong output của agent, bắt buộc nêu rõ:
1. **Evaluation Process**: Tóm tắt state input, danh sách primitives đã cấu hình, và lệnh/code đã chạy.
2. **Results & Decision**: Các giá trị/điểm số/xác suất trả về và quyết định hành động cụ thể dựa trên kết quả đó.
