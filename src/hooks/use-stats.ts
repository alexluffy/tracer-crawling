import { useQuery } from '@tanstack/react-query';
import type { ApiResponse } from '../app/(api)/api/v1/types';

const API_BASE = '/api/v1';

// Types for stats data
interface SystemStats {
  totalWallets: number;
  totalScamWallets: number;
  totalGraphs: number;
  totalTransactions: number;
  totalScamDetails: number;
  averageRiskScore: number;
  recentActivity: {
    walletsAdded24h: number;
    scamsDetected24h: number;
    graphsCreated24h: number;
  };
  riskDistribution: {
    low: number; // 0-3
    medium: number; // 4-6
    high: number; // 7-8
    critical: number; // 9-10
  };
  topRiskyWallets: {
    address: string;
    riskScore: number;
    label?: string;
  }[];
  recentScams: {
    id: number;
    address: string;
    scamType: string;
    reportedAt: string;
  }[];
}

interface WalletStats {
  address: string;
  totalTransactions: number;
  totalValue: string;
  riskScore: number;
  tags: string[];
  connectedWallets: number;
  firstSeen: string;
  lastActivity: string;
  scamReports: number;
  isMonitored: boolean;
}

interface GraphStats {
  id: number;
  name: string;
  totalNodes: number;
  totalEdges: number;
  rootWallet: string;
  averageRiskScore: number;
  scamWalletsCount: number;
  createdAt: string;
  lastUpdated: string;
}

// Get system-wide statistics
export function useSystemStats() {
  return useQuery({
    queryKey: ['stats', 'system'],
    queryFn: async (): Promise<ApiResponse<SystemStats>> => {
      const response = await fetch(`${API_BASE}/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch system stats');
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Get wallet-specific statistics
export function useWalletStats(address: string) {
  return useQuery({
    queryKey: ['stats', 'wallet', address],
    queryFn: async (): Promise<ApiResponse<WalletStats>> => {
      const response = await fetch(`${API_BASE}/stats/wallet/${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch wallet stats');
      }
      return response.json();
    },
    enabled: !!address,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get graph-specific statistics
export function useGraphStats(graphId: number) {
  return useQuery({
    queryKey: ['stats', 'graph', graphId],
    queryFn: async (): Promise<ApiResponse<GraphStats>> => {
      const response = await fetch(`${API_BASE}/stats/graph/${graphId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch graph stats');
      }
      return response.json();
    },
    enabled: !!graphId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get risk distribution statistics
export function useRiskDistribution() {
  return useQuery({
    queryKey: ['stats', 'risk-distribution'],
    queryFn: async (): Promise<ApiResponse<SystemStats['riskDistribution']>> => {
      const response = await fetch(`${API_BASE}/stats/risk-distribution`);
      if (!response.ok) {
        throw new Error('Failed to fetch risk distribution');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Get recent activity statistics
export function useRecentActivity(hours: number = 24) {
  return useQuery({
    queryKey: ['stats', 'recent-activity', hours],
    queryFn: async (): Promise<ApiResponse<SystemStats['recentActivity']>> => {
      const response = await fetch(`${API_BASE}/stats/recent-activity?hours=${hours}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recent activity');
      }
      return response.json();
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
}

// Get top risky wallets
export function useTopRiskyWallets(limit: number = 10) {
  return useQuery({
    queryKey: ['stats', 'top-risky-wallets', limit],
    queryFn: async (): Promise<ApiResponse<SystemStats['topRiskyWallets']>> => {
      const response = await fetch(`${API_BASE}/stats/top-risky?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch top risky wallets');
      }
      return response.json();
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get recent scam reports
export function useRecentScams(limit: number = 10) {
  return useQuery({
    queryKey: ['stats', 'recent-scams', limit],
    queryFn: async (): Promise<ApiResponse<SystemStats['recentScams']>> => {
      const response = await fetch(`${API_BASE}/stats/recent-scams?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recent scams');
      }
      return response.json();
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 3 * 60 * 1000, // Refetch every 3 minutes
  });
}

// Helper hook to get all dashboard stats at once
export function useDashboardStats() {
  const systemStats = useSystemStats();
  const riskDistribution = useRiskDistribution();
  const recentActivity = useRecentActivity();
  const topRiskyWallets = useTopRiskyWallets(5);
  const recentScams = useRecentScams(5);

  return {
    systemStats,
    riskDistribution,
    recentActivity,
    topRiskyWallets,
    recentScams,
    isLoading: systemStats.isLoading || riskDistribution.isLoading || recentActivity.isLoading,
    isError: systemStats.isError || riskDistribution.isError || recentActivity.isError,
    error: systemStats.error || riskDistribution.error || recentActivity.error,
  };
}