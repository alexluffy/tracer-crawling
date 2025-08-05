"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Clock,
  Copy,
  DollarSign,
  ExternalLink,
  Loader2,
  Shield,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useWallet } from "@/hooks/use-wallets";
import type { WalletWithDetails } from "@/app/(api)/api/v1/types";
import { WalletFlowChart } from "@/components/wallet-flow-chart";

interface Transaction {
  id: string;
  from: string;
  to: string;
  value: string;
  timestamp: string;
  type: "in" | "out";
  token?: string;
  fee?: string;
}

interface Tag {
  id: number;
  type: string;
  value?: string;
}

interface WalletData {
  address: string;
  chain: string;
  ownerName?: string;
  balance?: string;
  balanceUSD?: string;
  transactions?: Transaction[];
  tags?: Tag[];
}

interface ApiWalletData {
  address: string;
  chain?: string;
  ownerName?: string;
  balance?: string;
  balanceUSD?: string;
  transactions?: Transaction[];
  tags?: Tag[];
}

export default function WalletDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("wallet");

  const address = params.address as string;

  // Use the wallet hook to fetch real data
  const { data: walletResponse, isLoading, error } = useWallet(address);
  const walletData = walletResponse?.data;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading wallet data...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Wallet</h1>
          <p className="text-slate-400 mb-4">{error.message}</p>
          <Button onClick={() => router.push("/")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  // Use real data from API
  const displayData: WalletData = walletData ? {
    address: walletData.address,
    chain: (walletData as any).chain || "Ethereum",
    ownerName: (walletData as any).ownerName,
    balance: (walletData as any).balance,
    balanceUSD: (walletData as any).balanceUSD,
    transactions: (walletData as any).transactions || [],
    tags: (walletData as any).tags || [],
  } : {
    address: address,
    chain: "Ethereum",
    ownerName: undefined,
    balance: undefined,
    balanceUSD: undefined,
    transactions: [],
    tags: [],
  };

  if (!displayData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-400">Wallet not found</p>
          <Button onClick={() => router.push("/")} className="mt-4">
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-slate-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
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
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Wallet Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {displayData.address.slice(2, 4).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {displayData.ownerName || "Unknown Wallet"}
              </h1>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-slate-400">
                  {formatAddress(displayData.address)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(displayData.address)}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {displayData.tags && displayData.tags.length > 0 ? (
              displayData.tags.map((tag: any, index: number) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="border-green-500/30 text-green-400"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  {tag.tagType || tag.type || 'UNKNOWN'}
                </Badge>
              ))
            ) : (
              <Badge
                variant="outline"
                className="border-slate-500/30 text-slate-400"
              >
                <Shield className="h-3 w-3 mr-1" />
                WALLET
              </Badge>
            )}
          </div>
        </div>

        {/* Balance Card */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-slate-400 text-sm mb-1">Ethereum Balance</p>
                <p className="text-2xl font-bold">
                  {displayData.balance || "0 ETH"}
                </p>
                <p className="text-green-400 text-sm">
                  ${displayData.balanceUSD || "0.00"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Received</p>
                <p className="text-xl font-semibold">26.3M ETH</p>
                <p className="text-slate-500 text-sm">$93,209,492,958</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Sent</p>
                <p className="text-xl font-semibold">26.3M ETH</p>
                <p className="text-slate-500 text-sm">$93,125,996,761</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Fees</p>
                  <p className="text-lg font-semibold">23.1K ETH</p>
                </div>
                <DollarSign className="h-6 w-6 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Nonce</p>
                  <p className="text-lg font-semibold">12,084,796</p>
                </div>
                <Activity className="h-6 w-6 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Transactions</p>
                  <p className="text-lg font-semibold">12,091,289</p>
                </div>
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Token Portfolio</p>
                  <p className="text-lg font-semibold">2,054</p>
                </div>
                <Clock className="h-6 w-6 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
            <TabsTrigger
              value="wallet"
              className="data-[state=active]:bg-slate-700"
            >
              Wallet
            </TabsTrigger>
            <TabsTrigger
              value="internal"
              className="data-[state=active]:bg-slate-700"
            >
              Internal
            </TabsTrigger>
            <TabsTrigger
              value="visualization"
              className="data-[state=active]:bg-slate-700"
            >
              Flow Chart
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="mt-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Transactions</h3>
              {(displayData.transactions || []).map(
                (tx: Transaction, index: number) => (
                  <Card
                    key={index}
                    className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              tx.type === "out"
                                ? "bg-red-500/20"
                                : "bg-green-500/20"
                            }`}
                          >
                            {tx.type === "out" ? (
                              <TrendingDown className="h-4 w-4 text-red-400" />
                            ) : (
                              <TrendingUp className="h-4 w-4 text-green-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-blue-400 text-sm">
                                {tx.id}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-slate-400">
                              <span>From {tx.from}</span>
                              <span>•</span>
                              <span>To {tx.to}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{tx.value} ETH</p>
                          <div className="flex items-center space-x-2 text-sm text-slate-400">
                            <span>Fee {tx.token}</span>
                            <span>•</span>
                            <span>{tx.fee}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        {tx.timestamp}
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </TabsContent>

          <TabsContent value="internal" className="mt-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6 text-center">
                <p className="text-slate-400">
                  Internal transactions will be displayed here
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visualization" className="mt-6">
            <WalletFlowChart walletAddress={displayData.address} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
