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
  - `noul`: Boolean/xác suất.
  - `noun`: Chọn 1 option từ danh sách.
  - `string`: Trích xuất chuỗi.
  - `number`: Đo lường thang điểm (`min`, `max`).
  - `list`: Chọn nhiều option từ danh sách.

### Hướng dẫn sử dụng

#### 1. Thiết lập biến môi trường
```powershell
$env:JEV_API_KEY = "your-api-key"
```
```bash
export JEV_API_KEY="your-api-key"
```

#### 2. Chạy qua CLI

**Cách 1: Truyền JSON trực tiếp**
```bash
node .claude/skills/systemone/script/systemone-eval.js '{"state":{"text":"Lỗi checkout"},"questions":[{"id":"urgent","type":"noul","instructions":"Có gấp không?"}]}'
```

**Cách 2: Pipe từ file JSON**
- PowerShell:
```powershell
Get-Content .claude/skills/systemone/examples/all-types-payload.json -Raw | node .claude/skills/systemone/script/systemone-eval.js
```
- Bash:
```bash
node .claude/skills/systemone/script/systemone-eval.js < .claude/skills/systemone/examples/all-types-payload.json
```

Payload mẫu đủ 5 types: [.claude/skills/systemone/examples/all-types-payload.json](.claude/skills/systemone/examples/all-types-payload.json)

Quy trình: gom context vào `state` -> sinh `questions` -> chạy script -> rẽ nhánh logic.
