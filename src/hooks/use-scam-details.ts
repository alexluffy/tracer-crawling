import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, ScamDetailData, PaginationParams } from '../app/(api)/api/v1/types';

const API_BASE = '/api/v1';

// Types for hook parameters
interface UseScamDetailsParams extends PaginationParams {
  search?: string;
}

interface CreateScamDetailData {
  walletAddress: string;
  scamType: string;
  description?: string;
  reportedBy?: string;
  evidenceUrl?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface UpdateScamDetailData {
  scamType?: string;
  description?: string;
  reportedBy?: string;
  evidenceUrl?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

// Fetch scam details with pagination and search
export function useScamDetails(params: UseScamDetailsParams = {}) {
  const { page = 1, limit = 10, search = '' } = params;
  
  return useQuery({
    queryKey: ['scam-details', { page, limit, search }],
    queryFn: async (): Promise<ApiResponse<ScamDetailData[]>> => {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      });
      
      const response = await fetch(`${API_BASE}/scam-details?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch scam details');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch single scam detail by wallet address
export function useScamDetail(walletAddress: string) {
  return useQuery({
    queryKey: ['scam-detail', walletAddress],
    queryFn: async (): Promise<ApiResponse<ScamDetailData>> => {
      const response = await fetch(`${API_BASE}/scam-details/${walletAddress}`);
      if (!response.ok) {
        throw new Error('Failed to fetch scam detail');
      }
      return response.json();
    },
    enabled: !!walletAddress,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Create new scam detail
export function useCreateScamDetail() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateScamDetailData): Promise<ApiResponse<ScamDetailData>> => {
      const response = await fetch(`${API_BASE}/scam-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create scam detail');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate scam details list and related wallet
      queryClient.invalidateQueries({ queryKey: ['scam-details'] });
      if (data.data?.walletAddress) {
        queryClient.invalidateQueries({ queryKey: ['wallet', data.data.walletAddress] });
      }
    },
  });
}

// Update scam detail
export function useUpdateScamDetail() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ walletAddress, data }: { walletAddress: string; data: UpdateScamDetailData }): Promise<ApiResponse<ScamDetailData>> => {
      const response = await fetch(`${API_BASE}/scam-details/${walletAddress}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update scam detail');
      }
      
      return response.json();
    },
    onSuccess: (_, { walletAddress }) => {
      // Invalidate specific scam detail and scam details list
      queryClient.invalidateQueries({ queryKey: ['scam-detail', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['scam-details'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', walletAddress] });
    },
  });
}

// Delete scam detail
export function useDeleteScamDetail() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (walletAddress: string): Promise<ApiResponse<null>> => {
      const response = await fetch(`${API_BASE}/scam-details/${walletAddress}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete scam detail');
      }
      
      return response.json();
    },
    onSuccess: (_, walletAddress) => {
      // Remove scam detail from cache and invalidate lists
      queryClient.removeQueries({ queryKey: ['scam-detail', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['scam-details'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', walletAddress] });
    },
  });
}