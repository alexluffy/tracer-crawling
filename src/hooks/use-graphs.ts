import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, GraphData, PaginationParams, CreateGraphRequest } from '../app/(api)/api/v1/types';

const API_BASE = '/api/v1';

// Types for hook parameters
interface UseGraphsParams extends PaginationParams {
  rootWallet?: string;
}

// Using CreateGraphRequest from @/app/(api)/api/v1/types

interface GraphNode {
  id: number;
  graphId: number;
  walletAddress: string;
  label?: string;
  nodeType?: string;
  x?: number;
  y?: number;
  createdAt: string;
}

interface GraphEdge {
  id: number;
  graphId: number;
  fromWallet: string;
  toWallet: string;
  transactionHash?: string;
  amount?: string;
  timestamp?: string;
  createdAt: string;
}

interface CreateNodeData {
  walletAddress: string;
  label?: string;
  nodeType?: string;
  x?: number;
  y?: number;
}

interface CreateEdgeData {
  fromWallet: string;
  toWallet: string;
  transactionHash?: string;
  amount?: string;
  timestamp?: string;
}

// Fetch graphs with pagination and search
export function useGraphs(params: UseGraphsParams = {}) {
  const { page = 1, limit = 10, rootWallet } = params;
  
  return useQuery({
    queryKey: ['graphs', { page, limit, rootWallet }],
    queryFn: async (): Promise<ApiResponse<GraphData[]>> => {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(rootWallet && { rootWallet })
      });
      
      const response = await fetch(`${API_BASE}/graphs?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch graphs');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch single graph by ID
export function useGraph(graphId: number) {
  return useQuery({
    queryKey: ['graph', graphId],
    queryFn: async (): Promise<ApiResponse<GraphData>> => {
      const response = await fetch(`${API_BASE}/graphs/${graphId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch graph');
      }
      return response.json();
    },
    enabled: !!graphId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Create new graph
export function useCreateGraph() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateGraphRequest): Promise<ApiResponse<GraphData>> => {
      const response = await fetch(`${API_BASE}/graphs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create graph');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate graphs list
      queryClient.invalidateQueries({ queryKey: ['graphs'] });
    },
  });
}

// Delete graph
export function useDeleteGraph() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (graphId: number): Promise<ApiResponse<null>> => {
      const response = await fetch(`${API_BASE}/graphs/${graphId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete graph');
      }
      
      return response.json();
    },
    onSuccess: (_, graphId) => {
      // Remove graph from cache and invalidate graphs list
      queryClient.removeQueries({ queryKey: ['graph', graphId] });
      queryClient.removeQueries({ queryKey: ['graph-nodes', graphId] });
      queryClient.removeQueries({ queryKey: ['graph-edges', graphId] });
      queryClient.invalidateQueries({ queryKey: ['graphs'] });
    },
  });
}

// Fetch graph nodes
export function useGraphNodes(graphId: number) {
  return useQuery({
    queryKey: ['graph-nodes', graphId],
    queryFn: async (): Promise<ApiResponse<GraphNode[]>> => {
      const response = await fetch(`${API_BASE}/graphs/${graphId}/nodes`);
      if (!response.ok) {
        throw new Error('Failed to fetch graph nodes');
      }
      return response.json();
    },
    enabled: !!graphId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Add node to graph
export function useAddGraphNode() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ graphId, data }: { graphId: number; data: CreateNodeData }): Promise<ApiResponse<GraphNode>> => {
      const response = await fetch(`${API_BASE}/graphs/${graphId}/nodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add node');
      }
      
      return response.json();
    },
    onSuccess: (_, { graphId }) => {
      // Invalidate graph nodes and graph data
      queryClient.invalidateQueries({ queryKey: ['graph-nodes', graphId] });
      queryClient.invalidateQueries({ queryKey: ['graph', graphId] });
    },
  });
}

// Remove node from graph
export function useRemoveGraphNode() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ graphId, walletAddress }: { graphId: number; walletAddress: string }): Promise<ApiResponse<null>> => {
      const response = await fetch(`${API_BASE}/graphs/${graphId}/nodes?walletAddress=${walletAddress}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove node');
      }
      
      return response.json();
    },
    onSuccess: (_, { graphId }) => {
      // Invalidate graph nodes and graph data
      queryClient.invalidateQueries({ queryKey: ['graph-nodes', graphId] });
      queryClient.invalidateQueries({ queryKey: ['graph', graphId] });
    },
  });
}

// Fetch graph edges
export function useGraphEdges(graphId: number) {
  return useQuery({
    queryKey: ['graph-edges', graphId],
    queryFn: async (): Promise<ApiResponse<GraphEdge[]>> => {
      const response = await fetch(`${API_BASE}/graphs/${graphId}/edges`);
      if (!response.ok) {
        throw new Error('Failed to fetch graph edges');
      }
      return response.json();
    },
    enabled: !!graphId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Add edge to graph
export function useAddGraphEdge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ graphId, data }: { graphId: number; data: CreateEdgeData }): Promise<ApiResponse<GraphEdge>> => {
      const response = await fetch(`${API_BASE}/graphs/${graphId}/edges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add edge');
      }
      
      return response.json();
    },
    onSuccess: (_, { graphId }) => {
      // Invalidate graph edges and graph data
      queryClient.invalidateQueries({ queryKey: ['graph-edges', graphId] });
      queryClient.invalidateQueries({ queryKey: ['graph', graphId] });
    },
  });
}

// Remove edge from graph
export function useRemoveGraphEdge() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ graphId, transactionHash }: { graphId: number; transactionHash: string }): Promise<ApiResponse<null>> => {
      const response = await fetch(`${API_BASE}/graphs/${graphId}/edges?txHash=${transactionHash}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove edge');
      }
      
      return response.json();
    },
    onSuccess: (_, { graphId }) => {
      // Invalidate graph edges and graph data
      queryClient.invalidateQueries({ queryKey: ['graph-edges', graphId] });
      queryClient.invalidateQueries({ queryKey: ['graph', graphId] });
    },
  });
}