# 🔍 Tracer - Blockchain Wallet Risk Assessment Platform

## 📋 Tổng quan dự án

**Tracer** là một nền tảng đánh giá rủi ro và gắn nhãn cho các ví blockchain, hỗ trợ đa mạng lưới bao gồm EVM, TRX và SOL. Hệ thống cho phép người dùng tra cứu thông tin an toàn của ví, chấm điểm và tính toán độ rủi ro dựa trên các hoạt động giao dịch và hành vi trên blockchain.

## 🎯 Mục tiêu chính

- **Gắn nhãn ví**: Phân loại và gắn nhãn các ví theo mức độ rủi ro
- **Đánh giá an toàn**: Cung cấp điểm số tin cậy cho từng ví
- **Phân tích rủi ro**: Tính toán và hiển thị mức độ rủi ro khi giao dịch
- **Hỗ trợ đa mạng**: EVM (Ethereum, BSC, Polygon...), TRX (Tron), SOL (Solana)

## 🌐 Mạng lưới được hỗ trợ

### EVM Networks

- Ethereum Mainnet
- Binance Smart Chain (BSC)
- Polygon
- Arbitrum
- Optimism
- Avalanche

### Non-EVM Networks

- **TRX**: Tron Network
- **SOL**: Solana Network

## 🏗️ Kiến trúc hệ thống

### Frontend

- **Framework**: Next.js 15 với TypeScript
- **UI Library**: Shadcn/UI + Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Theme**: Dark/Light mode support

### Backend & Database

- **API**: Next.js API Routes
- **Database**: PostgreSQL với Prisma ORM
- **Blockchain Integration**: Web3.js, Ethers.js, Tron Web, Solana Web3.js

### Core Features

- **Wallet Labeling System**: Gắn nhãn tự động và thủ công
- **Risk Scoring Engine**: Thuật toán chấm điểm rủi ro
- **Transaction Analysis**: Phân tích lịch sử giao dịch
- **Real-time Monitoring**: Theo dõi hoạt động ví real-time

## 👥 User Flow - Quy trình sử dụng

### 1. 🔐 Đăng nhập/Đăng ký

```
User → Landing Page → Sign Up/Login → Dashboard
```

- Đăng ký tài khoản với email
- Xác thực 2FA (tùy chọn)
- Kết nối ví MetaMask/WalletConnect (tùy chọn)

### 2. 🔍 Tra cứu ví

```
Dashboard → Search Bar → Enter Wallet Address → View Results
```

- Nhập địa chỉ ví cần tra cứu
- Chọn mạng lưới (EVM/TRX/SOL)
- Xem kết quả phân tích ngay lập tức

### 3. 📊 Xem báo cáo chi tiết

```
Search Results → Detailed Report → Risk Analysis → Transaction History
```

- **Risk Score**: Điểm rủi ro từ 0-100
- **Safety Level**: An toàn, Cảnh báo, Nguy hiểm
- **Labels**: Danh sách nhãn đã gắn
- **Transaction Analysis**: Phân tích giao dịch gần đây

### 4. 🏷️ Gắn nhãn ví

```
Wallet Report → Add Label → Select Category → Submit → Review
```

- Gắn nhãn thủ công cho ví
- Chọn danh mục: Scam, Phishing, Exchange, DeFi, etc.
- Thêm ghi chú và bằng chứng
- Chờ review từ community/admin

### 5. 📈 Theo dõi ví

```
Wallet Report → Add to Watchlist → Set Alerts → Monitor
```

- Thêm ví vào danh sách theo dõi
- Thiết lập cảnh báo khi có hoạt động bất thường
- Nhận thông báo qua email/push notification

### 6. 🤝 Đóng góp cộng đồng

```
Profile → Contribution History → Submit Reports → Earn Reputation
```

- Đóng góp nhãn và báo cáo
- Tích lũy điểm uy tín
- Mở khóa tính năng cao cấp

## 🎨 Giao diện chính

### 1. Dashboard

- Tổng quan hoạt động
- Ví đã tra cứu gần đây
- Thống kê rủi ro
- Trending wallets

### 2. Search & Results

- Thanh tìm kiếm thông minh
- Kết quả tra cứu real-time
- Bộ lọc theo mạng/rủi ro
- Export báo cáo

### 3. Wallet Profile

- Thông tin chi tiết ví
- Risk score visualization
- Transaction timeline
- Related wallets network

### 4. Community

- Leaderboard contributors
- Recent labels/reports
- Discussion forum
- Bounty programs

## 🔒 Hệ thống chấm điểm rủi ro

### Risk Factors (0-100 points)

- **Transaction Patterns**: Phân tích mẫu giao dịch
- **Associated Addresses**: Ví liên quan đã được gắn nhãn
- **Volume Analysis**: Phân tích khối lượng giao dịch
- **Time Patterns**: Mẫu thời gian hoạt động
- **Smart Contract Interactions**: Tương tác với contract

### Safety Levels

- 🟢 **Safe (0-30)**: Ví an toàn, có thể giao dịch
- 🟡 **Caution (31-70)**: Cần thận trọng, kiểm tra thêm
- 🔴 **Dangerous (71-100)**: Nguy hiểm, không nên giao dịch

## 🏷️ Hệ thống nhãn

### Automated Labels

- **Exchange**: Sàn giao dịch
- **DeFi Protocol**: Giao thức DeFi
- **Bridge**: Cầu nối cross-chain
- **Mixer**: Dịch vụ trộn coin

### Community Labels

- **Scam**: Lừa đảo
- **Phishing**: Trang web giả mạo
- **Ponzi**: Đa cấp
- **Rug Pull**: Rút thảm
- **Verified**: Đã xác minh

## 🚀 Roadmap

### Phase 1: Core Platform (Q1 2024)

- ✅ Basic wallet lookup
- ✅ EVM networks support
- ✅ Risk scoring algorithm
- ✅ Community labeling

### Phase 2: Advanced Features (Q2 2024)

- 🔄 TRX & SOL network support
- 🔄 Real-time monitoring
- 🔄 API for developers
- 🔄 Mobile app

### Phase 3: Enterprise (Q3 2024)

- 📋 Enterprise dashboard
- 📋 Compliance reporting
- 📋 White-label solution
- 📋 Advanced analytics

## 🛠️ Cài đặt và phát triển

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- pnpm (package manager)

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/tracer.git
cd tracer

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local

# Setup database
pnpm db:migrate
pnpm db:seed

# Start development server
pnpm dev
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Blockchain RPC URLs
ETHEREUM_RPC_URL="https://..."
BSC_RPC_URL="https://..."
TRON_RPC_URL="https://..."
SOLANA_RPC_URL="https://..."

# API Keys
ETHERSCAN_API_KEY="..."
BSCSCAN_API_KEY="..."
TRONSCAN_API_KEY="..."

# Authentication
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

## 📚 API Documentation

### Wallet Lookup

```typescript
GET /api/wallet/[address]?network=ethereum

Response:
{
  "address": "0x...",
  "network": "ethereum",
  "riskScore": 25,
  "safetyLevel": "safe",
  "labels": ["exchange", "verified"],
  "lastActivity": "2024-01-15T10:30:00Z",
  "transactionCount": 1250,
  "totalVolume": "1000000.50"
}
```

### Add Label

```typescript
POST /api/wallet/[address]/label

Body:
{
  "label": "scam",
  "category": "security",
  "evidence": "Phishing website detected",
  "source": "community"
}
```

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 📄 License

MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 📞 Liên hệ

- **Website**: https://tracer.app
- **Email**: contact@tracer.app
- **Twitter**: @TracerApp
- **Discord**: https://discord.gg/tracer

---

**Tracer** - Making blockchain safer, one wallet at a time. 🛡️
