# Scripts Database

Thư mục này chứa các script để quản lý và import dữ liệu vào database.

## Các Script Có Sẵn

### 1. Import OTC Wallets

**File:** `import-otc-wallets.ts`

**Mô tả:** Import dữ liệu các ví OTC từ file JSON vào database

**Cách sử dụng:**
```bash
# Sử dụng npm script
npm run import:otc

# Hoặc chạy trực tiếp
npx tsx scripts/import-otc-wallets.ts
```

**Chức năng:**
- Đọc dữ liệu từ `/src/mock/mock-otc-address/otc-address.json`
- Tạo wallet records trong bảng `wallets`
- Thêm tag `otc` cho mỗi ví trong bảng `wallet_tags`
- Tự động xác định chain (bitcoin/ethereum) dựa trên currency
- Tạo owner name từ platform information
- Kiểm tra và tránh duplicate records

**Dữ liệu được import:**
- Địa chỉ ví (address)
- Tên chủ sở hữu (ownerName) - được tạo từ platform
- Chain (bitcoin/ethereum)
- Tag OTC

### 2. Seed Database

**File:** `seed-database.ts`

**Mô tả:** Script seed dữ liệu mẫu cho database

**Cách sử dụng:**
```bash
# Sử dụng npm script
npm run seed:db

# Hoặc chạy trực tiếp
npx tsx scripts/seed-database.ts
```

## Yêu Cầu

- Node.js
- TypeScript
- Database đã được setup và migrate
- File `.env` với database connection

## Lưu Ý

1. **Backup Database:** Luôn backup database trước khi chạy script import
2. **Environment:** Đảm bảo chạy script trong môi trường phù hợp (dev/staging)
3. **Permissions:** Script cần quyền đọc file và ghi database
4. **Duplicates:** Script tự động kiểm tra và xử lý duplicate records

## Troubleshooting

### Lỗi Database Connection
```bash
Error: Database connection failed
```
**Giải pháp:** Kiểm tra file `.env` và database connection string

### Lỗi File Not Found
```bash
Error: ENOENT: no such file or directory
```
**Giải pháp:** Đảm bảo file JSON tồn tại trong đường dẫn chính xác

### Lỗi Permission
```bash
Error: Permission denied
```
**Giải pháp:** Kiểm tra quyền đọc file và ghi database

## Thêm Script Mới

1. Tạo file TypeScript trong thư mục `scripts/`
2. Import các dependencies cần thiết từ `../src/lib/db`
3. Thêm script command vào `package.json`
4. Cập nhật README này

## Ví Dụ Script Template

```typescript
import { db } from "../src/lib/db";
import { wallets } from "../src/lib/db/schema";

async function myScript() {
  try {
    console.log("🚀 Bắt đầu script...");
    
    // Logic của script
    
    console.log("✅ Script hoàn tất");
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  myScript()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { myScript };
```