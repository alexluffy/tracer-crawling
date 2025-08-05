# Demo Tracer UI Guide

## Tổng quan

Giao diện Demo Tracer đã được thiết kế lại theo phong cách Arkham Intel và Debank với dark mode, bao gồm:

### 🔍 Trang Search (Homepage)
- **URL**: `/`
- **Tính năng**: Tìm kiếm wallet addresses, ENS domains
- **Design**: Dark theme với gradient backgrounds
- **Components**: Search bar, trending insights, stats grid

### 💼 Trang Chi tiết Ví
- **URL**: `/wallet/[address]`
- **Tính năng**: Hiển thị thông tin chi tiết wallet
- **Design**: Professional layout với transaction history
- **Components**: Balance cards, transaction tabs, stats overview

## Tính năng chính

### 🎨 Dark Mode Design
- Màu nền: `bg-slate-950`
- Card backgrounds: `bg-slate-800/50`
- Border colors: `border-slate-700`
- Gradient text effects cho branding

### 🔍 Search Functionality
- Real-time search với API integration
- Loading states và error handling
- Click-to-navigate từ search results

### 📊 Wallet Details
- Balance display với USD conversion
- Transaction history với filtering
- Tag system cho wallet classification
- Copy-to-clipboard functionality

### 🎯 User Experience
- Responsive design cho mobile/desktop
- Smooth transitions và hover effects
- Professional color scheme
- Intuitive navigation

## Components Structure

```
src/app/
├── page.tsx                    # Homepage với search
├── wallet/[address]/
│   └── page.tsx               # Wallet detail page
└── globals.css                # Dark theme styles
```

## Color Palette

- **Primary**: Blue gradients (`from-blue-400 to-purple-400`)
- **Background**: Slate 950 (`bg-slate-950`)
- **Cards**: Slate 800 với opacity (`bg-slate-800/50`)
- **Borders**: Slate 700 (`border-slate-700`)
- **Text**: White primary, Slate 400 secondary
- **Accents**: Green cho positive, Red cho negative

## Navigation Flow

1. **Homepage** → Search for wallet
2. **Search Results** → Click wallet address
3. **Wallet Detail** → View transactions, balance, tags
4. **Back Navigation** → Return to search

## API Integration

- Search: `GET /api/v1/address?search={query}`
- Wallet Details: `GET /api/v1/address/{address}`
- Mock data được sử dụng cho demonstration

## Best Practices

- Consistent spacing với Tailwind classes
- Proper loading states
- Error handling với fallbacks
- Accessible design patterns
- Mobile-first responsive approach

Giao diện đã sẵn sàng để test và phát triển thêm các tính năng mới!