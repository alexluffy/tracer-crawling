import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, WalletTagData, CreateTagRequest } from '../app/(api)/api/v1/types';

const API_BASE = '/api/v1';

// Fetch wallet tags
export function useWalletTags(walletAddress: string) {
  return useQuery({
    queryKey: ['wallet-tags', walletAddress],
    queryFn: async (): Promise<ApiResponse<WalletTagData[]>> => {
      const response = await fetch(`${API_BASE}/wallets/${walletAddress}/tags`);
      if (!response.ok) {
        throw new Error('Failed to fetch wallet tags');
      }
      return response.json();
    },
    enabled: !!walletAddress,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Add tag to wallet
export function useAddWalletTag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ walletAddress, data }: { walletAddress: string; data: CreateTagRequest }): Promise<ApiResponse<WalletTagData>> => {
      const response = await fetch(`${API_BASE}/wallets/${walletAddress}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add tag');
      }
      
      return response.json();
    },
    onSuccess: (_, { walletAddress }) => {
      // Invalidate wallet tags and wallet data
      queryClient.invalidateQueries({ queryKey: ['wallet-tags', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['wallet', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
  });
}

// Remove tag from wallet
export function useRemoveWalletTag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ walletAddress, tagId }: { walletAddress: string; tagId: number }): Promise<ApiResponse<null>> => {
      const response = await fetch(`${API_BASE}/wallets/${walletAddress}/tags`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tagId: tagId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove tag');
      }
      
      return response.json();
    },
    onSuccess: (_, { walletAddress }) => {
      // Invalidate wallet tags and wallet data
      queryClient.invalidateQueries({ queryKey: ['wallet-tags', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['wallet', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
  });
}