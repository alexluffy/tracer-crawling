# 📋 PROJECT RULES - Tracer Platform

## 🎯 Định nghĩa dự án

**Tracer** là một nền tảng đánh giá rủi ro và gắn nhãn cho các ví blockchain đa mạng lưới (EVM, TRX, SOL). Mục tiêu chính là tạo ra một hệ sinh thái an toàn cho người dùng blockchain thông qua việc phân tích, chấm điểm và cảnh báo rủi ro.

## 🏗️ Kiến trúc và công nghệ

### Frontend Stack

- **Framework**: Next.js 15 với App Router
- **Language**: TypeScript (strict mode)
- **UI Framework**: Shadcn/UI + Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Theme**: Dark/Light mode với next-themes
- **Package Manager**: pnpm (ONLY)

### Backend & Infrastructure

- **API**: Next.js API Routes
- **Database**: PostgreSQL với Prisma ORM
- **Authentication**: NextAuth.js
- **Blockchain Integration**:
  - EVM: ethers.js, web3.js
  - Tron: tronweb
  - Solana: @solana/web3.js

## 🎨 Design System Rules

### UI/UX Principles

1. **Consistency**: Sử dụng design tokens từ Shadcn/UI
2. **Accessibility**: Tuân thủ WCAG 2.1 AA standards
3. **Responsive**: Mobile-first approach
4. **Performance**: Lazy loading, code splitting
5. **Dark Mode**: Hỗ trợ đầy đủ dark/light theme

### Component Structure

```
src/components/
├── ui/           # Shadcn/UI base components
├── features/     # Feature-specific components
├── layout/       # Layout components
└── common/       # Shared components
```

## 🔐 Security & Privacy Rules

### Data Protection

1. **No Private Keys**: Không bao giờ lưu trữ private keys
2. **API Keys**: Sử dụng environment variables
3. **Rate Limiting**: Implement rate limiting cho APIs
4. **Input Validation**: Validate tất cả inputs
5. **HTTPS Only**: Chỉ sử dụng HTTPS trong production

### Blockchain Security

1. **Address Validation**: Validate địa chỉ ví trước khi query
2. **RPC Security**: Sử dụng trusted RPC endpoints
3. **Error Handling**: Không expose sensitive errors

## 📊 Core Features & Business Logic

### 1. Wallet Risk Assessment

```typescript
interface RiskScore {
  score: number; // 0-100
  level: "safe" | "caution" | "dangerous";
  factors: RiskFactor[];
  confidence: number;
}

interface RiskFactor {
  type: string;
  weight: number;
  description: string;
  evidence: string[];
}
```

### 2. Labeling System

```typescript
interface WalletLabel {
  id: string;
  address: string;
  network: Network;
  label: LabelType;
  category: LabelCategory;
  source: "automated" | "community" | "verified";
  confidence: number;
  evidence?: string;
  createdAt: Date;
  verifiedAt?: Date;
}

enum LabelType {
  SAFE = "safe",
  EXCHANGE = "exchange",
  DEFI = "defi",
  SCAM = "scam",
  PHISHING = "phishing",
  MIXER = "mixer",
  BRIDGE = "bridge",
}
```

### 3. Supported Networks

```typescript
enum Network {
  // EVM Networks
  ETHEREUM = "ethereum",
  BSC = "bsc",
  POLYGON = "polygon",
  ARBITRUM = "arbitrum",
  OPTIMISM = "optimism",
  AVALANCHE = "avalanche",

  // Non-EVM Networks
  TRON = "tron",
  SOLANA = "solana",
}
```

## 🔄 Development Workflow

### Git Workflow

1. **Branch Naming**: `feature/wallet-analysis`, `fix/risk-calculation`
2. **Commit Messages**: Conventional commits format
3. **PR Requirements**: Code review + tests passing
4. **Main Branch**: Protected, requires PR

### Code Quality

1. **ESLint**: Strict TypeScript rules
2. **Prettier**: Code formatting
3. **Husky**: Pre-commit hooks
4. **Testing**: Jest + React Testing Library

### Environment Setup

```bash
# Development
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm test         # Run tests
pnpm lint         # Lint code
pnpm type-check   # TypeScript check

# Database
pnpm db:migrate   # Run migrations
pnpm db:seed      # Seed database
pnpm db:studio    # Open Prisma Studio
```

## 📁 File Structure Rules

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Dashboard routes
│   ├── (auth)/           # Auth routes
│   ├── api/              # API routes
│   └── globals.css       # Global styles
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── features/         # Feature components
│   └── layout/           # Layout components
├── lib/                  # Utilities & configs
│   ├── db/              # Database utilities
│   ├── blockchain/      # Blockchain utilities
│   ├── utils.ts         # General utilities
│   └── validations.ts   # Zod schemas
├── hooks/               # Custom React hooks
├── types/               # TypeScript types
└── constants/           # App constants
```

## 🎯 Feature Development Guidelines

### Wallet Analysis Features

1. **Real-time Analysis**: Phân tích ví real-time khi user nhập address
2. **Historical Data**: Lưu trữ và hiển thị lịch sử phân tích
3. **Batch Processing**: Hỗ trợ phân tích nhiều ví cùng lúc
4. **Export Reports**: Xuất báo cáo PDF/CSV

### Community Features

1. **User Contributions**: Cho phép user đóng góp labels
2. **Reputation System**: Hệ thống điểm uy tín
3. **Moderation**: Review và verify community labels
4. **Bounty Programs**: Thưởng cho contributions chất lượng

### API Design

1. **RESTful**: Tuân thủ REST principles
2. **Rate Limiting**: Implement rate limiting
3. **Pagination**: Sử dụng cursor-based pagination
4. **Error Handling**: Consistent error responses
5. **Documentation**: OpenAPI/Swagger docs

## 🚀 Performance Rules

### Frontend Performance

1. **Code Splitting**: Lazy load components
2. **Image Optimization**: Next.js Image component
3. **Bundle Analysis**: Regular bundle size monitoring
4. **Caching**: Implement proper caching strategies

### Backend Performance

1. **Database Indexing**: Proper database indexes
2. **Query Optimization**: Optimize Prisma queries
3. **Caching**: Redis for frequently accessed data
4. **Background Jobs**: Queue system for heavy tasks

## 🧪 Testing Strategy

### Frontend Testing

1. **Unit Tests**: Components và utilities
2. **Integration Tests**: API calls và user flows
3. **E2E Tests**: Critical user journeys
4. **Visual Regression**: Screenshot testing

### Backend Testing

1. **API Tests**: Test all endpoints
2. **Database Tests**: Test database operations
3. **Blockchain Tests**: Mock blockchain interactions
4. **Load Tests**: Performance under load

## 📈 Monitoring & Analytics

### Application Monitoring

1. **Error Tracking**: Sentry integration
2. **Performance**: Web Vitals monitoring
3. **User Analytics**: Privacy-focused analytics
4. **API Monitoring**: Response times và error rates

### Business Metrics

1. **Wallet Lookups**: Số lượng tra cứu ví
2. **Risk Assessments**: Độ chính xác của risk scoring
3. **Community Contributions**: Labels và reports
4. **User Engagement**: Active users và retention

## 🔧 Configuration Files

### Required Config Files

- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS config
- `tsconfig.json` - TypeScript config
- `eslint.config.mjs` - ESLint rules
- `package.json` - Dependencies và scripts
- `prisma/schema.prisma` - Database schema
- `.env.example` - Environment variables template

## 🎨 Brand Guidelines

### Visual Identity

- **Primary Color**: Blue (#3B82F6)
- **Secondary Color**: Green (#10B981) for safe, Red (#EF4444) for danger
- **Typography**: Inter font family
- **Logo**: Minimalist design với blockchain elements

### Tone of Voice

- **Professional**: Serious về security
- **Accessible**: Dễ hiểu cho non-technical users
- **Trustworthy**: Xây dựng niềm tin
- **Educational**: Giáo dục users về blockchain security

---

**Lưu ý**: Tất cả development phải tuân thủ các rules này để đảm bảo consistency và quality của dự án Tracer.
