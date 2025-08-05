import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, WalletData, PaginationParams, CreateWalletRequest, UpdateWalletRequest } from '../app/(api)/api/v1/types';

const API_BASE = '/api/v1';

// Types for hook parameters
interface UseWalletsParams extends PaginationParams {
  search?: string;
}

// Using types from @/app/(api)/api/v1/types

// Fetch wallets with pagination and search
export function useWallets(params: UseWalletsParams = {}) {
  const { page = 1, limit = 10, search = '' } = params;
  
  return useQuery({
    queryKey: ['wallets', { page, limit, search }],
    queryFn: async (): Promise<ApiResponse<WalletData[]>> => {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      });
      
      const response = await fetch(`${API_BASE}/wallets?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch wallets');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch single wallet by address
export function useWallet(address: string) {
  return useQuery({
    queryKey: ['wallet', address],
    queryFn: async (): Promise<ApiResponse<WalletData>> => {
      const response = await fetch(`${API_BASE}/address/${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch wallet');
      }
      return response.json();
    },
    enabled: !!address,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Create new wallet
export function useCreateWallet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateWalletRequest): Promise<ApiResponse<WalletData>> => {
      const response = await fetch(`${API_BASE}/wallets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create wallet');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate wallets list to refetch
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
  });
}

// Update wallet
export function useUpdateWallet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ address, data }: { address: string; data: UpdateWalletRequest }): Promise<ApiResponse<WalletData>> => {
      const response = await fetch(`${API_BASE}/wallets/${address}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update wallet');
      }
      
      return response.json();
    },
    onSuccess: (_, { address }) => {
      // Invalidate specific wallet and wallets list
      queryClient.invalidateQueries({ queryKey: ['wallet', address] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
  });
}

// Delete wallet
export function useDeleteWallet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (address: string): Promise<ApiResponse<null>> => {
      const response = await fetch(`${API_BASE}/wallets/${address}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete wallet');
      }
      
      return response.json();
    },
    onSuccess: (_, address) => {
      // Remove wallet from cache and invalidate wallets list
      queryClient.removeQueries({ queryKey: ['wallet', address] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
  });
}