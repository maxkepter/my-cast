---
name: systemone
description: Đánh giá có định kiểu và phân loại ngữ nghĩa qua SystemOne Engine (noul, noun, string, number/score, list) trực tiếp bằng CLI flags hoặc Node.js module mà không cần tạo file JSON.
---

# SystemOne Evaluation Skill

Skill hỗ trợ đánh giá trực tiếp qua CLI flags, JavaScript API hoặc JSON input, tự động load file `.env` và hỗ trợ đầy đủ 5 kiểu dữ liệu nguyên tử.

## 1. 5 Primitives Hỗ Trợ Đầy Đủ

1. **`noul`** (Boolean / Xác suất):
   - Đánh giá xác suất đúng/sai [0..1].
2. **`noun` / `choice`** (Phân loại danh mục):
   - Chọn đúng 1 phương án trong danh sách `options` kèm phân phối xác suất.
3. **`string`** (Trích xuất chuỗi):
   - Trích xuất nhãn/chuỗi cụ thể từ danh sách options hoặc state.
4. **`number` / `score`** (Thang điểm đo lường):
   - `number`: Đo lường trên thang số (`min, max`).
   - `score`: Thang điểm dựa trên các level mô tả có thứ tự.
5. **`list`** (Multi-label):
   - Chọn nhiều nhãn phù hợp từ danh sách `options` (tự động phân tích đa chiều).

---

## 2. Cách Dùng Trực Tiếp (Không Cần File JSON)

Script tại: `.claude/skills/systemone/script/systemone-eval.js` (tự động load `.env`).

### Cú pháp CLI Flags Đầy Đủ 5 Types:

```bash
node .claude/skills/systemone/script/systemone-eval.js \
  -s "Nội dung / Context cần đánh giá" \
  --noul <id> "<câu hỏi>" \
  --noun <id> "<câu hỏi>" "<opt1,opt2,opt3>" \
  --string <id> "<câu hỏi>" "<opt1,opt2,opt3>" \
  --number <id> "<câu hỏi>" "<min,max>" \
  --score <id> "<câu hỏi>" "<Level 0,Level 1,Level 2>" \
  --list <id> "<câu hỏi>" "<tag1,tag2,tag3>"
```

### Ví dụ Thực Tế:

```bash
node .claude/skills/systemone/script/systemone-eval.js \
  -s "Video streaming API gặp lỗi timeout khi upload video 2GB" \
  --noul is_urgent "Có khẩn cấp không?" \
  --noun category "Phân loại lỗi" "bug,performance,billing" \
  --number priority "Mức độ ưu tiên" "1,5" \
  --list tags "Các bộ phận liên quan" "backend,frontend,storage,devops" \
  --string target "Module bị ảnh hưởng" "video_upload,user_profile,auth"
```

### Cú pháp Rút Gọn `-q`:

```bash
node .claude/skills/systemone/script/systemone-eval.js \
  -s "User report video spam" \
  -q "is_valid:noul:Report có hợp lệ không?" \
  -q "action:noun:Hành động:ban=Khóa tài khoản,warn=Cảnh cáo,dismiss=Bỏ qua" \
  -q "severity:number:Mức độ nghiêm trọng:1,5" \
  -q "tags:list:Loại vi phạm:spam,harassment,hate_speech"
```

---

## 3. Cách Dùng Dạng Module Node.js

```javascript
const { evaluate } = require('./.claude/skills/systemone/script/systemone-eval');

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

## 4. Truyền File hoặc Pipe (Tùy chọn)

Vẫn hỗ trợ đọc file JSON hoặc pipe qua stdin nếu có sẵn:
```bash
node .claude/skills/systemone/script/systemone-eval.js payload.json
```
