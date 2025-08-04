# API Hooks Documentation

Bộ hooks React Query để tương tác với Tracer API. Các hooks này cung cấp interface đơn giản và type-safe để thực hiện các thao tác CRUD với database.

## Cài đặt và Setup

Các dependencies cần thiết đã được cài đặt:
- `@tanstack/react-query`: ^5.81.5
- React Query Provider đã được setup trong `src/lib/providers.tsx`

## Cấu trúc Hooks

### 1. Wallets (`use-wallets.ts`)

#### Query Hooks
- `useWallets(params)` - Lấy danh sách ví với phân trang và tìm kiếm
- `useWallet(address)` - Lấy thông tin chi tiết một ví

#### Mutation Hooks
- `useCreateWallet()` - Tạo ví mới
- `useUpdateWallet()` - Cập nhật thông tin ví
- `useDeleteWallet()` - Xóa ví

```typescript
// Ví dụ sử dụng
const { data: wallets, isLoading } = useWallets({ page: 1, limit: 10, search: 'abc' });
const { data: wallet } = useWallet('0x123...');
const createWallet = useCreateWallet();

// Tạo ví mới
const handleCreate = async () => {
  await createWallet.mutateAsync({
    address: '0x123...',
    label: 'My Wallet',
    riskScore: 5
  });
};
```

### 2. Wallet Tags (`use-wallet-tags.ts`)

- `useWalletTags(address)` - Lấy danh sách tags của ví
- `useAddWalletTag()` - Thêm tag mới
- `useRemoveWalletTag()` - Xóa tag

```typescript
const { data: tags } = useWalletTags('0x123...');
const addTag = useAddWalletTag();
const removeTag = useRemoveWalletTag();

// Thêm tag
await addTag.mutateAsync({ walletAddress: '0x123...', tag: 'suspicious' });
```

### 3. Scam Details (`use-scam-details.ts`)

#### Query Hooks
- `useScamDetails(params)` - Lấy danh sách báo cáo lừa đảo
- `useScamDetail(address)` - Lấy chi tiết báo cáo lừa đảo

#### Mutation Hooks
- `useCreateScamDetail()` - Tạo báo cáo lừa đảo mới
- `useUpdateScamDetail()` - Cập nhật báo cáo
- `useDeleteScamDetail()` - Xóa báo cáo

```typescript
const { data: scamDetails } = useScamDetails({ page: 1, limit: 10 });
const createScam = useCreateScamDetail();

// Tạo báo cáo lừa đảo
await createScam.mutateAsync({
  address: '0x123...',
  scamType: 'phishing',
  description: 'Phishing website',
  reportedBy: 'user123'
});
```

### 4. Graphs (`use-graphs.ts`)

#### Graph Management
- `useGraphs(params)` - Lấy danh sách biểu đồ
- `useGraph(id)` - Lấy chi tiết biểu đồ
- `useCreateGraph()` - Tạo biểu đồ mới
- `useDeleteGraph()` - Xóa biểu đồ

#### Nodes Management
- `useGraphNodes(graphId)` - Lấy danh sách nodes
- `useAddGraphNode()` - Thêm node mới
- `useRemoveGraphNode()` - Xóa node

#### Edges Management
- `useGraphEdges(graphId)` - Lấy danh sách edges
- `useAddGraphEdge()` - Thêm edge mới
- `useRemoveGraphEdge()` - Xóa edge

```typescript
const { data: graphs } = useGraphs({ page: 1, limit: 10 });
const { data: nodes } = useGraphNodes(graphId);
const { data: edges } = useGraphEdges(graphId);

const createGraph = useCreateGraph();
const addNode = useAddGraphNode();
const addEdge = useAddGraphEdge();

// Tạo biểu đồ mới
await createGraph.mutateAsync({
  rootWallet: '0x123...',
  name: 'Suspicious Network',
  description: 'Network analysis'
});
```

### 5. Search (`use-search.ts`)

- `useSearch(params)` - Tìm kiếm ví và giao dịch
- `useSearchDebounced(params, debounceMs)` - Tìm kiếm với debounce
- `useSearchSuggestions(query, limit)` - Gợi ý tìm kiếm
- `useRecentSearches(maxItems)` - Lịch sử tìm kiếm

```typescript
const { data: results } = useSearch({ 
  query: 'search term', 
  page: 1, 
  limit: 10,
  type: 'wallet' 
});

const { data: suggestions } = useSearchSuggestions('0x123', 5);
const { data: recent } = useRecentSearches(10);

// Helper functions
addToRecentSearches('0x123...');
clearRecentSearches();
```

### 6. Statistics (`use-stats.ts`)

#### System Stats
- `useSystemStats()` - Thống kê tổng quan hệ thống
- `useRiskDistribution()` - Phân bố risk score
- `useRecentActivity(hours)` - Hoạt động gần đây
- `useTopRiskyWallets(limit)` - Top ví có risk cao
- `useRecentScams(limit)` - Báo cáo lừa đảo gần đây

#### Specific Stats
- `useWalletStats(address)` - Thống kê ví cụ thể
- `useGraphStats(graphId)` - Thống kê biểu đồ cụ thể

#### Dashboard Helper
- `useDashboardStats()` - Tổng hợp stats cho dashboard

```typescript
const { data: systemStats } = useSystemStats();
const { data: walletStats } = useWalletStats('0x123...');
const dashboardStats = useDashboardStats();

// Dashboard stats bao gồm:
// - systemStats, riskDistribution, recentActivity
// - topRiskyWallets, recentScams
// - isLoading, isError, error (tổng hợp)
```

## Import và Sử dụng

```typescript
// Import từ index file
import {
  useWallets,
  useCreateWallet,
  useSearch,
  useSystemStats,
  useDashboardStats
} from '@/hooks/api';

// Hoặc import trực tiếp
import { useWallets } from '@/hooks/api/use-wallets';
```

## Demo và Testing

Để test các hooks:

1. Chạy development server:
```bash
npm run dev
```

2. Truy cập trang demo:
```
http://localhost:3000/demo
```

3. Trang demo bao gồm:
   - Dashboard với thống kê tổng quan
   - Tìm kiếm real-time
   - Tạo và quản lý ví
   - Thêm/xóa tags
   - Tạo báo cáo lừa đảo
   - Tạo biểu đồ phân tích

## Error Handling

Tất cả hooks đều có error handling tự động:

```typescript
const { data, isLoading, error, isError } = useWallets();

if (isError) {
  console.error('Error:', error);
}
```

## Caching và Performance

- **Stale Time**: Dữ liệu được cache với thời gian khác nhau tùy loại
- **Auto Refetch**: Một số hooks tự động refetch (stats, activity)
- **Optimistic Updates**: Mutations tự động invalidate cache liên quan
- **Background Refetch**: Dữ liệu được cập nhật khi focus window

## Best Practices

1. **Sử dụng enabled option** cho conditional queries:
```typescript
const { data } = useWallet(address, { enabled: !!address });
```

2. **Handle loading states** appropriately:
```typescript
if (isLoading) return <Spinner />;
if (isError) return <ErrorMessage error={error} />;
```

3. **Use mutation callbacks** cho user feedback:
```typescript
const createWallet = useCreateWallet({
  onSuccess: () => toast.success('Wallet created!'),
  onError: (error) => toast.error(error.message)
});
```

4. **Debounce search queries** để tránh quá nhiều requests:
```typescript
const { data } = useSearchDebounced({ query, page: 1 }, 300);
```