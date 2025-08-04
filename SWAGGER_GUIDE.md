# Swagger API Documentation Guide

## Tổng quan

Hệ thống Swagger API documentation đã được thiết lập để cung cấp giao diện tương tác cho việc test và khám phá các API endpoints của Demo Tracer.

## Cách sử dụng

### 1. Khởi động server
```bash
npm run dev
```

### 2. Truy cập Swagger UI
- **Swagger UI**: http://localhost:3000/api-docs
- **API Specification (JSON)**: http://localhost:3000/api/docs

## Các API Endpoints đã được document

### 🔍 Address APIs
- `GET /api/v1/address` - Tìm kiếm địa chỉ ví
- `POST /api/v1/address` - Thêm nhiều địa chỉ ví
- `GET /api/v1/address/{id}` - Lấy thông tin chi tiết ví
- `POST /api/v1/address/{id}` - Thêm tag cho ví

### 📊 Stats APIs
- `GET /api/v1/stats` - Lấy thống kê hệ thống

### 🏷️ Tags APIs
- `GET /api/v1/tags` - Lấy danh sách tags

### 📈 Graph APIs (Sẽ được bổ sung)
- `GET /api/v1/graph` - Lấy danh sách graphs
- `GET /api/v1/graph/{id}` - Lấy chi tiết graph

## Tính năng Swagger

### ✨ Interactive Testing
- Test trực tiếp các API endpoints
- Nhập parameters và request body
- Xem response ngay lập tức

### 📋 Schema Definitions
- Định nghĩa đầy đủ các data models
- Validation rules cho parameters
- Response format specifications

### 🔧 Request/Response Examples
- Ví dụ request body cho POST endpoints
- Sample responses cho mỗi status code
- Error handling documentation

## Cấu trúc Files

```
src/
├── lib/
│   └── swagger.ts              # Swagger configuration
├── app/
│   ├── api-docs/
│   │   └── page.tsx            # Swagger UI page
│   └── (api)/api/
│       └── docs/
│           └── route.ts        # API docs endpoint
└── app/(api)/api/v1/           # API routes with JSDoc
```

## Thêm Documentation cho API mới

### 1. Thêm JSDoc comments
```typescript
/**
 * @swagger
 * /api/v1/your-endpoint:
 *   get:
 *     summary: Your endpoint summary
 *     description: Detailed description
 *     tags:
 *       - YourTag
 *     parameters:
 *       - name: param1
 *         in: query
 *         description: Parameter description
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourSchema'
 */
export async function GET() {
  // Your implementation
}
```

### 2. Thêm Schema vào swagger.ts
```typescript
YourSchema: {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' }
  }
}
```

## Troubleshooting

### Lỗi thường gặp

1. **Swagger UI không load**
   - Kiểm tra server đã chạy chưa
   - Xem console browser có lỗi không

2. **API không hiển thị**
   - Kiểm tra JSDoc syntax
   - Verify schema references

3. **Styling issues**
   - Đảm bảo đã import swagger-ui.css
   - Check Tailwind CSS conflicts

### Debug Commands
```bash
# Test Swagger setup
node test-swagger.js

# Check TypeScript compilation
npm run build

# Lint check
npm run lint
```

## Best Practices

1. **Consistent Documentation**
   - Sử dụng tags để nhóm endpoints
   - Mô tả rõ ràng cho parameters
   - Cung cấp examples thực tế

2. **Schema Management**
   - Tái sử dụng schemas qua $ref
   - Định nghĩa common parameters
   - Validate response formats

3. **Error Handling**
   - Document tất cả error codes
   - Cung cấp error message examples
   - Explain error scenarios

## Kết luận

Swagger API documentation giúp:
- Tăng hiệu quả development
- Cải thiện API testing
- Tạo documentation tự động
- Hỗ trợ team collaboration

Để biết thêm chi tiết, tham khảo [OpenAPI Specification](https://swagger.io/specification/).