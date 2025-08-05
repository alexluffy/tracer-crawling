// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  hasMore: boolean;
  totalCounts?: Record<string, number>;
}

// Wallet Types
export interface WalletData {
  address: string;
  ownerName?: string;
  chain: string;
  searchCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletWithDetails extends WalletData {
  tags: string[];
  scamDetail?: ScamDetailData | null;
}

export interface CreateWalletRequest {
  address: string;
  ownerName?: string;
  chain: string;
}

export interface UpdateWalletRequest {
  ownerName?: string;
  chain?: string;
}

// Tag Types
export type TagType =
  | "scam"
  | "otc"
  | "blacklist"
  | "kol"
  | "hacker"
  | "f0_user";

export interface WalletTagData {
  id: number;
  walletAddress: string;
  tagType: TagType;
  addedBy: string | null;
  createdAt: Date;
}

export interface CreateTagRequest {
  tagType: TagType;
  addedBy: string | null;
}

// Scam Detail Types
export interface ScamDetailData {
  walletAddress: string;
  twitterHandle?: string;
  reason: string;
  scamLink?: string;
}

export interface ScamDetailWithWallet extends ScamDetailData {
  ownerName?: string;
  chain: string;
  createdAt: Date;
}

export interface CreateScamDetailRequest {
  walletAddress: string;
  twitterHandle?: string;
  reason: string;
  scamLink?: string;
}

export interface UpdateScamDetailRequest {
  twitterHandle?: string;
  reason?: string;
  scamLink?: string;
}

// Graph Types
export interface GraphData {
  id: number;
  rootWalletAddress: string;
  createdAt: Date;
  nodes?: GraphNodeData[];
  edges?: GraphEdgeData[];
}

export interface GraphWithDetails extends GraphData {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
}

export interface GraphWithWallet extends GraphData {
  ownerName?: string;
  chain: string;
}

export interface CreateGraphRequest {
  rootWalletAddress: string;
  nodes?: string[];
  edges?: CreateEdgeRequest[];
}

// Graph Node Types
export interface GraphNodeData {
  id: number;
  graphId: number;
  walletAddress: string;
}

export interface CreateNodeRequest {
  walletAddress: string;
}

// Graph Edge Types
export interface GraphEdgeData {
  id: number;
  graphId: number;
  txHash: string;
  fromNodeAddress: string;
  toNodeAddress: string;
  value?: string;
}

export interface CreateEdgeRequest {
  txHash: string;
  fromNodeAddress: string;
  toNodeAddress: string;
  value?: string;
}

// Statistics Types
export interface StatsOverview {
  totalWallets: number;
  totalScamDetails: number;
  totalGraphs: number;
  totalNodes: number;
  totalEdges: number;
}

export interface TopSearchedWallet {
  address: string;
  ownerName?: string;
  searchCount: number;
  chain: string;
}

export interface StatsResponse {
  overview: StatsOverview;
  tagStats: Record<TagType, number>;
  chainStats: Record<string, number>;
  topSearchedWallets: TopSearchedWallet[];
}

// Search Types
export type SearchType = "all" | "wallets" | "scam";

export interface SearchParams {
  q: string;
  type?: SearchType;
  page?: number;
  limit?: number;
}

export interface SearchResults {
  wallets: (WalletData & { tags: TagType[] })[];
  scamDetails: ScamDetailWithWallet[];
}

export interface SearchResponse {
  data: SearchResults;
  pagination: PaginationResponse & {
    hasMore: {
      wallets: boolean;
      scamDetails: boolean;
    };
  };
  query: string;
  type: SearchType;
}

// Error Types
export interface ApiError {
  success: false;
  error: string;
}

// Utility Types
export type ApiMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface RequestOptions {
  method: ApiMethod;
  headers?: Record<string, string>;
  body?: any;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResponse {
  success: false;
  error: string;
  validationErrors?: ValidationError[];
}
