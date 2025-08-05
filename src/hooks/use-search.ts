import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { ApiResponse, PaginationParams } from "../app/(api)/api/v1/types";

const API_BASE = "/api/v1";

// Types for search results
interface SearchResult {
  id: number;
  type: "wallet" | "transaction";
  address?: string;
  transactionHash?: string;
  label?: string;
  description?: string;
  tags?: string[];
  riskScore?: number;
  isScam?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Types for hook parameters
interface UseSearchParams extends PaginationParams {
  query: string;
  type?: "wallet" | "transaction" | "all";
  riskScore?: number;
  isScam?: boolean;
}

// Search wallets and transactions
export function useSearch(params: UseSearchParams) {
  const { query, page = 1, limit = 10, type, riskScore, isScam } = params;

  return useQuery({
    queryKey: ["search", { query, page, limit, type, riskScore, isScam }],
    queryFn: async (): Promise<ApiResponse<SearchResult[]>> => {
      const searchParams = new URLSearchParams({
        q: query,
        page: page.toString(),
        limit: limit.toString(),
        ...(type && { type }),
        ...(riskScore !== undefined && { riskScore: riskScore.toString() }),
        ...(isScam !== undefined && { isScam: isScam.toString() }),
      });

      const response = await fetch(`${API_BASE}/search?${searchParams}`);
      if (!response.ok) {
        throw new Error("Failed to search");
      }
      return response.json();
    },
    enabled: !!query && query.length >= 2, // Only search if query has at least 2 characters
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Search with debounce for real-time search
export function useSearchDebounced(params: UseSearchParams, debounceMs = 300) {
  const { query, ...otherParams } = params;
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return useSearch({
    query: debouncedQuery,
    ...otherParams,
  });
}

// Search suggestions for autocomplete
export function useSearchSuggestions(query: string, limit = 5) {
  return useQuery({
    queryKey: ["search-suggestions", query, limit],
    queryFn: async (): Promise<ApiResponse<string[]>> => {
      const searchParams = new URLSearchParams({
        q: query,
        limit: limit.toString(),
        suggestions: "true",
      });

      const response = await fetch(`${API_BASE}/search?${searchParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }
      return response.json();
    },
    enabled: !!query && query.length >= 1,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Search recent queries (stored in localStorage)
export function useRecentSearches() {
  return useQuery({
    queryKey: ["recent-searches"],
    queryFn: (): string[] => {
      try {
        const stored = localStorage.getItem("recent-searches");
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    },
    staleTime: Number.POSITIVE_INFINITY, // Never stale, only updated manually
  });
}

// Helper function to add search to recent searches
export function addToRecentSearches(query: string, maxItems = 10) {
  try {
    const stored = localStorage.getItem("recent-searches");
    const recent: string[] = stored ? JSON.parse(stored) : [];

    // Remove if already exists
    const filtered = recent.filter((item) => item !== query);

    // Add to beginning
    const updated = [query, ...filtered].slice(0, maxItems);

    localStorage.setItem("recent-searches", JSON.stringify(updated));
  } catch (error) {
    console.warn("Failed to save recent search:", error);
  }
}

// Helper function to clear recent searches
export function clearRecentSearches() {
  try {
    localStorage.removeItem("recent-searches");
  } catch (error) {
    console.warn("Failed to clear recent searches:", error);
  }
}
