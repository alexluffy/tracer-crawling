// Export all API hooks for easy importing

// Wallets hooks
export {
  useWallets,
  useWallet,
  useCreateWallet,
  useUpdateWallet,
  useDeleteWallet,
} from './use-wallets';

// Wallet tags hooks
export {
  useWalletTags,
  useAddWalletTag,
  useRemoveWalletTag,
} from './use-wallet-tags';

// Scam details hooks
export {
  useScamDetails,
  useScamDetail,
  useCreateScamDetail,
  useUpdateScamDetail,
  useDeleteScamDetail,
} from './use-scam-details';

// Graphs hooks
export {
  useGraphs,
  useGraph,
  useCreateGraph,
  useDeleteGraph,
  useGraphNodes,
  useAddGraphNode,
  useRemoveGraphNode,
  useGraphEdges,
  useAddGraphEdge,
  useRemoveGraphEdge,
} from './use-graphs';

// Search hooks
export {
  useSearch,
  useSearchDebounced,
  useSearchSuggestions,
  useRecentSearches,
  addToRecentSearches,
  clearRecentSearches,
} from './use-search';

// Stats hooks
export {
  useSystemStats,
  useWalletStats,
  useGraphStats,
  useRiskDistribution,
  useRecentActivity,
  useTopRiskyWallets,
  useRecentScams,
  useDashboardStats,
} from './use-stats';