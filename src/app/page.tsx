"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, TrendingUp, Users, Globe, Coins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSearchDebounced } from "@/hooks/use-search";
import { useSystemStats } from "@/hooks/use-stats";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Use the search hook with debouncing
  const {
    data: searchResponse,
    isLoading: isSearching,
    error,
  } = useSearchDebounced(
    {
      query: searchQuery,
      limit: 10,
      type: "wallet",
    },
    300 // 300ms debounce
  );

  // Use system stats hook
  const { data: statsResponse, isLoading: isStatsLoading } = useSystemStats();
  const stats = statsResponse?.data;

  const searchResults = searchResponse?.data || [];

  const handleSearch = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    // The search is handled automatically by the hook with debouncing
  };

  const handleWalletClick = (address: string) => {
    router.push(`/wallet/${address}`);
  };

  const mockTrendingInsights = [
    {
      title: "Ethereum Whales Take Selling $6M as ETH ETF...",
      category: "Whales",
      timeAgo: "2 minutes ago",
      updates: 2,
    },
    {
      title: "SOL Futures Flash Massive Signals: Negative Funding...",
      category: "Futures",
      timeAgo: "11 minutes ago",
      updates: 1,
    },
    {
      title: "Bitcoin Rebounds to $115,000 Amid Analyst's $2M...",
      category: "Bitcoin",
      timeAgo: "15 minutes ago",
      updates: 3,
    },
  ];

  const getStatsData = () => {
    if (isStatsLoading) {
      return [
        {
          label: "Total Wallets",
          value: <Loader2 className="h-6 w-6 animate-spin" />,
          change: "",
          icon: Users,
        },
        {
          label: "Transactions",
          value: <Loader2 className="h-6 w-6 animate-spin" />,
          change: "",
          icon: TrendingUp,
        },
        {
          label: "Scam Wallets",
          value: <Loader2 className="h-6 w-6 animate-spin" />,
          change: "",
          icon: Globe,
        },
        {
          label: "Avg Risk Score",
          value: <Loader2 className="h-6 w-6 animate-spin" />,
          change: "",
          icon: Coins,
        },
      ];
    }

    return [
      {
        label: "Total Wallets",
        value: stats?.totalWallets?.toLocaleString() || "2.4M",
        change: stats?.recentActivity?.walletsAdded24h
          ? `+${stats.recentActivity.walletsAdded24h}`
          : "+12.5%",
        icon: Users,
      },
      {
        label: "Transactions",
        value: stats?.totalTransactions?.toLocaleString() || "847.2K",
        change: "+8.3%",
        icon: TrendingUp,
      },
      {
        label: "Scam Wallets",
        value: stats?.totalScamWallets?.toLocaleString() || "15",
        change: stats?.recentActivity?.scamsDetected24h
          ? `+${stats.recentActivity.scamsDetected24h}`
          : "+2",
        icon: Globe,
      },
      {
        label: "Avg Risk Score",
        value: stats?.averageRiskScore?.toFixed(1) || "4.2",
        change: "",
        icon: Coins,
      },
    ];
  };

  const mockStats = getStatsData();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              DEMO TRACER
            </h1>
            <Badge
              variant="outline"
              className="border-blue-500/30 text-blue-400"
            >
              INTEL
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex space-x-6">
             
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            DEMO TRACER INTEL
          </h2>
          <p className="text-xl text-slate-400 mb-8">
            Search for people, funds, exchanges, and ENS.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search for wallets, addresses, and ENS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="pl-12 pr-4 py-4 text-lg bg-slate-800/50 border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
              />
            </div>
            <Button
              onClick={() => handleSearch()}
              disabled={isSearching}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 px-6"
            >
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>

        {/* Search Results */}
        {searchQuery && searchQuery.length >= 2 && (
          <Card className="bg-slate-800/50 border-slate-700 mb-12">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                Search Results for &quot;{searchQuery}&quot;
                {isSearching && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="text-red-400 text-sm p-4 bg-red-900/20 rounded-lg border border-red-800">
                  Error: {error.message}
                </div>
              )}
              {isSearching ? (
                <div className="text-slate-400 text-center py-8 flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 hover:bg-slate-700/70 transition-colors cursor-pointer"
                    onClick={() => router.push(`/wallet/${result.address}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm text-blue-400">
                        {result.address
                          ? `${result.address.slice(
                              0,
                              10
                            )}...${result.address.slice(-8)}`
                          : result.transactionHash
                          ? `${result.transactionHash.slice(
                              0,
                              10
                            )}...${result.transactionHash.slice(-8)}`
                          : "Unknown"}
                      </span>
                      <div className="flex gap-2">
                        {result.tags?.map((tag: string, tagIndex: number) => (
                          <Badge
                            key={tagIndex}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {result.riskScore !== undefined && (
                          <Badge
                            variant={
                              result.riskScore > 7
                                ? "destructive"
                                : result.riskScore > 4
                                ? "secondary"
                                : "default"
                            }
                            className="text-xs"
                          >
                            Risk: {result.riskScore}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">
                        {result.label ||
                          result.description ||
                          "Unknown Wallet"}
                      </span>
                      <span className="text-slate-400 text-sm capitalize">
                        {result.type}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-center py-8">
                  No results found for &quot;{searchQuery}&quot;
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Show message for short queries */}
        {searchQuery && searchQuery.length < 2 && (
          <Card className="bg-slate-800/50 border-slate-700 mb-12">
            <CardContent className="p-6">
              <div className="text-slate-400 text-center py-4">
                Please enter at least 2 characters to search
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {mockStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-green-400 text-sm">{stat.change}</p>
                    </div>
                    <Icon className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trending Insights */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">TRENDING INSIGHTS</h3>
            <Badge className="bg-slate-800 text-slate-300">ALL NETWORKS</Badge>
          </div>

          <div className="space-y-4">
            {mockTrendingInsights.map((insight, index) => (
              <Card
                key={index}
                className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all cursor-pointer"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Badge
                        variant="outline"
                        className="border-purple-500/30 text-purple-400"
                      >
                        {insight.category}
                      </Badge>
                      <h4 className="font-semibold">{insight.title}</h4>
                    </div>
                    <div className="flex items-center space-x-4 text-slate-400">
                      <span>{insight.timeAgo}</span>
                      <Badge className="bg-blue-600">
                        {insight.updates} updates
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
