"use client";

import React, { useCallback, useMemo, useEffect } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  ConnectionLineType,
  Panel,
  useNodesState,
  useEdgesState,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet, ArrowRight, DollarSign } from "lucide-react";
import { useWalletGraph } from "@/hooks/use-graphs";

interface WalletFlowChartProps {
  walletAddress: string;
  graphId?: number;
}

// Custom node component for wallet
const WalletNode = ({ data }: { data: any }) => {
  const isMainWallet = data.isMain;
  const hasTransactions = data.transactionCount > 0;

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg border-2 min-w-[200px] ${
        isMainWallet
          ? "bg-gradient-to-r from-blue-600 to-purple-600 border-blue-400 text-white"
          : "bg-slate-800 border-slate-600 text-white"
      }`}
    >
      <div className="flex items-center space-x-2 mb-2">
        <Wallet className="h-4 w-4" />
        <span className="font-semibold text-sm">{data.label}</span>
      </div>

      <div className="text-xs opacity-80">
        <div>
          Address: {data.address.slice(0, 8)}...{data.address.slice(-6)}
        </div>
        {data.chain && (
          <div className="text-xs text-blue-300 mt-1">Chain: {data.chain}</div>
        )}
        {data.balance && (
          <div className="flex items-center space-x-1 mt-1">
            <DollarSign className="h-3 w-3" />
            <span>{data.balance} ETH</span>
          </div>
        )}
      </div>

      {data.tags && data.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {data.tags.map((tag: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag.toUpperCase()}
            </Badge>
          ))}
        </div>
      )}

      <div className="text-xs mt-2 opacity-70">
        Transactions: {data.transactionCount || 0}
      </div>
    </div>
  );
};

const nodeTypes = {
  wallet: WalletNode,
};

export function WalletFlowChart({
  walletAddress,
  graphId,
}: WalletFlowChartProps) {
  // Fetch real graph data
  const {
    data: graphResponse,
    isLoading,
    error,
  } = useWalletGraph(walletAddress);
  const graphData = graphResponse?.data;

  console.log(graphData, "graphData");
  // Mock data for demonstration - will be replaced with real data when available
  const mockNodes: Node[] = useMemo(
    () => [
      {
        id: "1",
        type: "wallet",
        position: { x: 400, y: 200 },
        data: {
          address: walletAddress,
          label: "Main Wallet",
          isMain: true,
          balance: "27620.27",
          transactionCount: 1250,
          tags: ["EXCHANGE", "VERIFIED"],
        },
      },
      {
        id: "2",
        type: "wallet",
        position: { x: 100, y: 100 },
        data: {
          address: "0x742d35Cc6634C0532925a3b8D4C9db96",
          label: "Binance Hot Wallet",
          isMain: false,
          balance: "15420.89",
          transactionCount: 850,
          tags: ["EXCHANGE"],
        },
      },
      {
        id: "3",
        type: "wallet",
        position: { x: 700, y: 100 },
        data: {
          address: "0x8894E0a0c962CB723c1976a4421c95949bE2D4E6",
          label: "Tether Treasury",
          isMain: false,
          balance: "98765.43",
          transactionCount: 2100,
          tags: ["STABLECOIN", "TREASURY"],
        },
      },
      {
        id: "4",
        type: "wallet",
        position: { x: 200, y: 350 },
        data: {
          address: "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503",
          label: "DeFi Protocol",
          isMain: false,
          balance: "5432.10",
          transactionCount: 450,
          tags: ["DEFI", "PROTOCOL"],
        },
      },
      {
        id: "5",
        type: "wallet",
        position: { x: 600, y: 350 },
        data: {
          address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          label: "Unknown Wallet",
          isMain: false,
          balance: "123.45",
          transactionCount: 75,
          tags: ["UNKNOWN"],
        },
      },
    ],
    [walletAddress]
  );

  const mockEdges: Edge[] = useMemo(
    () => [
      {
        id: "e1-2",
        source: "2",
        target: "1",
        type: "smoothstep" as const,
        animated: true,
        label: "1,250 ETH",
        labelStyle: { fill: "#fff", fontWeight: 600, fontSize: 12 },
        labelBgStyle: { fill: "#1e293b", fillOpacity: 0.8 },
        style: { stroke: "#10b981", strokeWidth: 3 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#10b981",
        },
      },
      {
        id: "e1-3",
        source: "1",
        target: "3",
        type: "smoothstep" as const,
        animated: true,
        label: "850 USDT",
        labelStyle: { fill: "#fff", fontWeight: 600, fontSize: 12 },
        labelBgStyle: { fill: "#1e293b", fillOpacity: 0.8 },
        style: { stroke: "#3b82f6", strokeWidth: 3 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#3b82f6",
        },
      },
      {
        id: "e1-4",
        source: "1",
        target: "4",
        type: "smoothstep" as const,
        animated: true,
        label: "500 ETH",
        labelStyle: { fill: "#fff", fontWeight: 600, fontSize: 12 },
        labelBgStyle: { fill: "#1e293b", fillOpacity: 0.8 },
        style: { stroke: "#f59e0b", strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#f59e0b",
        },
      },
      {
        id: "e1-5",
        source: "1",
        target: "5",
        type: "smoothstep" as const,
        label: "25 ETH",
        labelStyle: { fill: "#fff", fontWeight: 600, fontSize: 12 },
        labelBgStyle: { fill: "#1e293b", fillOpacity: 0.8 },
        style: { stroke: "#ef4444", strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#ef4444",
        },
      },
    ],
    []
  );

  // Use real data if available, otherwise fall back to mock data
  const finalNodes = useMemo(() => {
    if (graphData && graphData.nodes && graphData.nodes.length > 0) {
      // Convert real data to React Flow format
      return graphData.nodes.map((node: any, index: number) => {
        // Use wallet info if available from the API response
        const walletInfo = node.wallet || {};
        const walletTags = node.tags || [];

        return {
          id: node.id.toString(),
          type: "wallet",
          position: {
            x: 200 + (index % 3) * 300,
            y: 100 + Math.floor(index / 3) * 200,
          },
          data: {
            address: node.walletAddress,
            label:
              walletInfo.ownerName ||
              (node.walletAddress === walletAddress
                ? "Main Wallet"
                : `${node.walletAddress.slice(
                    0,
                    6
                  )}...${node.walletAddress.slice(-4)}`),
            isMain: node.walletAddress === walletAddress,
            balance: "0",
            transactionCount: 0,
            tags:
              walletTags.length > 0
                ? walletTags.map((tag: any) => tag.tagType || tag.type)
                : [node.nodeType || "WALLET"],
            chain: walletInfo.chain || "ethereum",
          },
        };
      });
    }
    return mockNodes;
  }, [graphData, mockNodes, walletAddress]);

  const finalEdges = useMemo(() => {
    if (
      graphData &&
      graphData.edges &&
      graphData.edges.length > 0 &&
      graphData.nodes
    ) {
      // Convert real data to React Flow format
      return graphData.edges.map((edge: any) => {
        // Find corresponding nodes to use their IDs
        const sourceNode = graphData.nodes?.find(
          (n: any) => n.walletAddress === edge.fromWalletAddress
        );
        const targetNode = graphData.nodes?.find(
          (n: any) => n.walletAddress === edge.toWalletAddress
        );

        return {
          id: `e${edge.id}`,
          source: sourceNode
            ? sourceNode.id.toString()
            : edge.fromWalletAddress,
          target: targetNode ? targetNode.id.toString() : edge.toWalletAddress,
          type: "smoothstep" as const,
          animated: true,
          label: edge.amount ? `${edge.amount} ETH` : "Transaction",
          labelStyle: { fill: "#fff", fontWeight: 600, fontSize: 12 },
          labelBgStyle: { fill: "#1e293b", fillOpacity: 0.8 },
          style: { stroke: "#10b981", strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#10b981",
          },
        } as Edge;
      });
    }
    return mockEdges;
  }, [graphData, mockEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(finalNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(finalEdges);

  // Update nodes and edges when data changes
  React.useEffect(() => {
    setNodes(finalNodes);
  }, [finalNodes, setNodes]);

  React.useEffect(() => {
    setEdges(finalEdges);
  }, [finalEdges, setEdges]);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <Card className="bg-slate-800/50 border-slate-700 h-[600px]">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <ArrowRight className="h-5 w-5" />
          <span>Transaction Flow Visualization</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[520px]">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-2 text-white">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading transaction flow...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-red-400">
              <p>Failed to load transaction flow</p>
              <p className="text-sm text-slate-400 mt-2">{error.message}</p>
            </div>
          </div>
        )}
        {!isLoading && !error && (
          <div className="w-full h-full bg-slate-900 rounded-b-lg">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              connectionLineType={ConnectionLineType.SmoothStep}
              fitView
              className="bg-slate-900"
            >
              <Controls className="bg-slate-800 border-slate-600" />
              <MiniMap
                className="bg-slate-800 border-slate-600"
                nodeColor={(node) => {
                  if (node.data?.isMain) return "#3b82f6";
                  return "#64748b";
                }}
              />
              <Background
                variant={BackgroundVariant.Dots}
                gap={20}
                size={1}
                color="#374151"
              />
              <Panel
                position="top-right"
                className="bg-slate-800/90 p-3 rounded-lg border border-slate-600"
              >
                <div className="text-white text-sm space-y-2">
                  <div className="font-semibold">Legend:</div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-xs">Incoming</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-xs">Outgoing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span className="text-xs">DeFi</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-xs">Unknown</span>
                  </div>
                </div>
              </Panel>
            </ReactFlow>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
