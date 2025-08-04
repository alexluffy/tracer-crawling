# Tracer API Documentation

API để tra cứu và quản lý thông tin địa chỉ ví blockchain (EVM, TRX, SOL networks).

## Base URL
```
http://localhost:3000/api/v1
```

## Supported Networks
- `ethereum` - Ethereum và các EVM chains
- `tron` - Tron network
- `solana` - Solana network

## Address Validation
- **Ethereum**: 42 ký tự, bắt đầu với `0x` (ví dụ: `0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45`)
- **Tron**: 34 ký tự, bắt đầu với `T` (ví dụ: `TRX9Yg3ymw7Z8pdwVBKU6BpweN3d4Qjyy`)
- **Solana**: 32-44 ký tự, base58 (ví dụ: `11111111111111111111111111111112`)

## Risk Scoring System

### Tag Weights
- `scam`: 80 điểm
- `hacker`: 75 điểm
- `blacklist`: 70 điểm
- `otc`: 30 điểm
- `kol`: 10 điểm
- `f0_user`: 5 điểm

### Safety Levels
- `safe`: 0-30 điểm
- `caution`: 31-70 điểm
- `dangerous`: 71-100 điểm

---

## 1. Address Endpoints

### GET /api/v1/address/[id]
Tra cứu thông tin chi tiết của một địa chỉ ví.

**Parameters:**
- `id` (path): Địa chỉ ví cần tra cứu
- `network` (query, optional): Network của ví (default: ethereum)

**Response:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
  "network": "ethereum",
  "found": true,
  "ownerName": "Binance Hot Wallet",
  "riskScore": 15,
  "safetyLevel": "safe",
  "searchCount": 42,
  "tags": [
    {
      "type": "exchange",
      "addedBy": "admin"
    }
  ],
  "scamDetails": null,
  "hasGraphData": true,
  "graphCount": 2,
  "lastActivity": "2024-01-15T10:30:00Z",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400`: Invalid address format
- `404`: Wallet not found
- `500`: Internal server error

### POST /api/v1/address/[id]
Thêm tag mới cho địa chỉ ví.

**Request Body:**
```json
{
  "tagType": "scam",
  "addedBy": "user123",
  "network": "ethereum",
  "ownerName": "Scammer Wallet",
  "scamDetails": {
    "reason": "Phishing attack on users",
    "scamLink": "https://fake-site.com",
    "twitterHandle": "@scammer123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tag added successfully",
  "tag": {
    "id": 123,
    "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
    "tagType": "scam",
    "addedBy": "user123"
  }
}
```

### GET /api/v1/address
Tìm kiếm nhiều địa chỉ ví hoặc theo từ khóa.

**Query Parameters:**
- `addresses` (optional): Danh sách địa chỉ cách nhau bởi dấu phẩy
- `search` (optional): Từ khóa tìm kiếm (address hoặc owner name)
- `network` (optional): Lọc theo network
- `tagType` (optional): Lọc theo loại tag
- `limit` (optional): Số lượng kết quả (max 100, default 10)
- `offset` (optional): Vị trí bắt đầu (default 0)

**Example:**
```
GET /api/v1/address?search=binance&network=ethereum&limit=5
```

**Response:**
```json
{
  "results": [
    {
      "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
      "network": "ethereum",
      "ownerName": "Binance Hot Wallet",
      "riskScore": 15,
      "safetyLevel": "safe",
      "searchCount": 42,
      "tags": [...],
      "scamDetails": null,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "limit": 5,
    "offset": 0,
    "total": 1,
    "hasMore": false
  },
  "filters": {
    "search": "binance",
    "network": "ethereum",
    "tagType": null
  }
}
```

### POST /api/v1/address
Thêm nhiều địa chỉ ví cùng lúc (batch operation).

**Request Body:**
```json
{
  "wallets": [
    {
      "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
      "network": "ethereum",
      "ownerName": "Binance Hot Wallet",
      "tags": [
        {
          "type": "exchange",
          "addedBy": "admin"
        }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "processed": 1,
  "failed": 0,
  "results": [...],
  "errors": []
}
```

---

## 2. Tags Endpoints

### GET /api/v1/tags
Lấy danh sách tất cả tags hoặc theo filter.

**Query Parameters:**
- `tagType` (optional): Lọc theo loại tag
- `addedBy` (optional): Lọc theo người thêm
- `walletAddress` (optional): Lọc theo địa chỉ ví
- `limit` (optional): Số lượng kết quả (max 100, default 50)
- `offset` (optional): Vị trí bắt đầu (default 0)

**Response:**
```json
{
  "tags": [
    {
      "id": 123,
      "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
      "tagType": "exchange",
      "addedBy": "admin",
      "createdAt": "2024-01-01T00:00:00Z",
      "wallet": {
        "chain": "ethereum",
        "ownerName": "Binance Hot Wallet"
      }
    }
  ],
  "pagination": {...},
  "statistics": {
    "scam": 150,
    "exchange": 50,
    "kol": 25
  },
  "filters": {...}
}
```

### DELETE /api/v1/tags
Xóa tags theo IDs (chỉ có thể xóa tags do mình thêm).

**Request Body:**
```json
{
  "tagIds": [123, 124, 125],
  "addedBy": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully deleted 2 tags",
  "deletedCount": 2,
  "deletedIds": [123, 124],
  "notFound": [125]
}
```

---

## 3. Graph Endpoints

### GET /api/v1/graph
Lấy danh sách graphs hoặc theo filter.

**Query Parameters:**
- `rootWalletAddress` (optional): Lọc theo địa chỉ ví gốc
- `includeNodes` (optional): Bao gồm thông tin nodes (default: false)
- `includeEdges` (optional): Bao gồm thông tin edges (default: false)
- `limit` (optional): Số lượng kết quả (max 50, default 20)
- `offset` (optional): Vị trí bắt đầu (default 0)

**Response:**
```json
{
  "graphs": [
    {
      "id": 1,
      "rootWalletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
      "createdAt": "2024-01-01T00:00:00Z",
      "rootWallet": {
        "chain": "ethereum",
        "ownerName": "Binance Hot Wallet"
      },
      "nodeCount": 15,
      "edgeCount": 28,
      "nodes": [...], // if includeNodes=true
      "edges": [...] // if includeEdges=true
    }
  ],
  "pagination": {...},
  "filters": {...}
}
```

### POST /api/v1/graph
Tạo graph mới.

**Request Body:**
```json
{
  "rootWalletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
  "nodes": [
    {
      "walletAddress": "0x123...",
      "nodeType": "wallet",
      "chain": "ethereum",
      "ownerName": "Exchange Wallet"
    }
  ],
  "edges": [
    {
      "fromWalletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
      "toWalletAddress": "0x123...",
      "transactionHash": "0xabc123...",
      "amount": "1000000000000000000",
      "timestamp": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### GET /api/v1/graph/[id]
Lấy thông tin chi tiết của một graph.

**Query Parameters:**
- `includeWalletDetails` (optional): Bao gồm chi tiết ví (default: false)
- `includeTags` (optional): Bao gồm tags và risk scores (default: false)

**Response:**
```json
{
  "id": 1,
  "rootWalletAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
  "createdAt": "2024-01-01T00:00:00Z",
  "rootWallet": {...},
  "nodes": [
    {
      "id": 1,
      "walletAddress": "0x123...",
      "nodeType": "wallet",
      "wallet": {...}, // if includeWalletDetails=true
      "tags": [...], // if includeTags=true
      "riskScore": 25, // if includeTags=true
      "safetyLevel": "safe" // if includeTags=true
    }
  ],
  "edges": [...],
  "statistics": {
    "totalNodes": 15,
    "totalEdges": 28,
    "nodeTypes": {
      "wallet": 12,
      "contract": 3
    },
    "tagDistribution": {...}, // if includeTags=true
    "averageRiskScore": 35, // if includeTags=true
    "highRiskNodes": 2 // if includeTags=true
  },
  "options": {
    "includeWalletDetails": false,
    "includeTags": false
  }
}
```

### PUT /api/v1/graph/[id]
Cập nhật graph (thêm nodes/edges).

**Request Body:**
```json
{
  "action": "add",
  "nodes": [...],
  "edges": [...]
}
```

### DELETE /api/v1/graph/[id]
Xóa graph.

**Response:**
```json
{
  "success": true,
  "message": "Graph deleted successfully",
  "deleted": {
    "graphId": 1,
    "nodesDeleted": 15,
    "edgesDeleted": 28
  }
}
```

---

## 4. Statistics Endpoint

### GET /api/v1/stats
Lấy thống kê tổng quan của hệ thống.

**Query Parameters:**
- `timeframe` (optional): Khoảng thời gian (all, 7d, 30d, 90d) (default: all)
- `network` (optional): Lọc theo network

**Response:**
```json
{
  "overview": {
    "totalWallets": 10000,
    "totalTags": 5000,
    "totalScams": 500,
    "totalGraphs": 100,
    "totalNodes": 1500,
    "totalEdges": 3000,
    "totalSearches": 50000
  },
  "distribution": {
    "networks": {
      "ethereum": 7000,
      "tron": 2000,
      "solana": 1000
    },
    "tags": {
      "scam": 500,
      "exchange": 200,
      "kol": 100
    },
    "riskLevels": {
      "safe": 6000,
      "caution": 3000,
      "dangerous": 500,
      "untagged": 500
    }
  },
  "activity": {
    "last24Hours": {
      "newWallets": 50,
      "newTags": 25,
      "newGraphs": 2
    },
    "topSearchedWallets": [
      {
        "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45",
        "network": "ethereum",
        "ownerName": "Binance Hot Wallet",
        "searchCount": 1000
      }
    ],
    "topTaggers": [
      {
        "user": "admin",
        "tagsAdded": 500
      }
    ]
  },
  "filters": {
    "timeframe": "30d",
    "network": null
  },
  "generatedAt": "2024-01-15T10:30:00Z"
}
```

---

## Error Handling

Tất cả API endpoints trả về error theo format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes
- `INVALID_ADDRESS`: Địa chỉ ví không hợp lệ
- `MISSING_FIELDS`: Thiếu trường bắt buộc
- `LIMIT_EXCEEDED`: Vượt quá giới hạn cho phép
- `NOT_FOUND`: Không tìm thấy resource
- `INTERNAL_ERROR`: Lỗi server nội bộ

## Rate Limiting

- Mỗi IP được phép tối đa 1000 requests/hour
- Batch operations (POST /address) giới hạn 50 items/request
- Search operations giới hạn 100 results/request

## Authentication

Hiện tại API không yêu cầu authentication, nhưng sẽ được thêm vào trong tương lai với:
- API Keys cho external integrations
- JWT tokens cho user sessions
- Role-based access control

## Examples

### Tra cứu địa chỉ ví
```bash
curl "http://localhost:3000/api/v1/address/0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45?network=ethereum"
```

### Thêm tag scam
```bash
curl -X POST "http://localhost:3000/api/v1/address/0x123..." \
  -H "Content-Type: application/json" \
  -d '{
    "tagType": "scam",
    "addedBy": "user123",
    "scamDetails": {
      "reason": "Phishing attack"
    }
  }'
```

### Tìm kiếm ví theo từ khóa
```bash
curl "http://localhost:3000/api/v1/address?search=binance&limit=10"
```

### Lấy thống kê 30 ngày qua
```bash
curl "http://localhost:3000/api/v1/stats?timeframe=30d"
```