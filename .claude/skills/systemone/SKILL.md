---
name: systemone
description: Tự động sinh payload JSON chuẩn xác cho SystemOne Engine (noul, noun, string, number, list), gọi script gateway Node.js và tích hợp luồng phán đoán/router.
---

# SystemOne Evaluation Skill

Skill hỗ trợ sinh schema câu hỏi, đóng gói payload JSON chuẩn cho SystemOne Engine và thực thi qua CLI script gateway.

## 1. Schema Payload SystemOne

Endpoint nhận payload JSON có cấu trúc:
```json
{
  "model": "oc/jev-1.13-free",
  "state": { ... },
  "questions": [ ... ]
}
```

### Các kiểu dữ liệu Question (`type`):

1. **`noul`** (Boolean / Điều kiện xác suất):
   - Đánh giá tính đúng/sai hoặc xác suất của điều kiện.
   - Trả về xác suất `yes` [0..1].
   ```json
   {
     "id": "is_urgent",
     "type": "noul",
     "instructions": "Yêu cầu có mang tính khẩn cấp cần xử lý ngay lập tức không?"
   }
   ```

2. **`noun`** (Choice / Phân loại danh mục):
   - Chọn đúng một phương án trong danh sách `options`.
   ```json
   {
     "id": "category",
     "type": "noun",
     "instructions": "Xác định danh mục chính của yêu cầu",
     "options": ["bug_report", "feature_request", "support", "billing"]
   }
   ```

3. **`string`** (Trích xuất chuỗi):
   - Trích xuất thông tin cụ thể từ state.
   ```json
   {
     "id": "target_component",
     "type": "string",
     "instructions": "Tên component hoặc module được nhắc đến"
   }
   ```

4. **`number`** (Đo lường / Thang điểm):
   - Điểm số hoặc ước lượng số lượng/mức độ.
   ```json
   {
     "id": "priority_score",
     "type": "number",
     "instructions": "Đánh giá mức độ ưu tiên trên thang từ 1 đến 5",
     "min": 1,
     "max": 5
   }
   ```

5. **`list`** (Danh sách nhãn / Multi-label):
   - Chọn nhiều nhãn áp dụng từ `options`.
   ```json
   {
     "id": "tags",
     "type": "list",
     "instructions": "Các chủ đề kỹ thuật liên quan",
     "options": ["backend", "frontend", "database", "devops", "security"]
   }
   ```

---

## 2. Thực thi qua Gateway Script

Script thực thi tại: `.claude/skills/systemone/script/systemone-eval.js`

### Yêu cầu môi trường:
- `JEV_API_KEY`: API key xác thực.
- `JEV_ENDPOINT_URL`: (Tùy chọn) Mặc định `https://router.kepter.id.vn/v1/systemone`.
- `JEV_MODEL`: (Tùy chọn) Mặc định `oc/jev-1.13-free`.

### Lệnh chạy:

**Cách 1: Truyền JSON trực tiếp qua tham số**
```bash
node .claude/skills/systemone/script/systemone-eval.js '{"state":{"text":"Lỗi 500 khi checkout"},"questions":[{"id":"is_urgent","type":"noul","instructions":"Có khẩn cấp không?"}]}'
```

**Cách 2: Pipe qua stdin**
```bash
echo '{"state":{"ticket":"Không thể kết nối DB"},"questions":[{"id":"topic","type":"noun","options":["db","ui","auth"]}]}' | node .claude/skills/systemone/script/systemone-eval.js
```

---

## 3. Quy trình áp dụng

1. **State**: Gom dữ liệu ngữ cảnh vào `state`.
2. **Questions**: Tạo câu hỏi nguyên tử với kiểu dữ liệu (`noul`, `noun`, `string`, `number`, `list`).
3. **Execute**: Chạy script gateway nhận kết quả định kiểu.
4. **Route**: Rẽ nhánh luồng dựa trên kết quả.
