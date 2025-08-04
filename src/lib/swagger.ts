import { createSwaggerSpec } from 'next-swagger-doc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Demo Tracer API',
    version: '1.0.0',
    description: 'API documentation for Demo Tracer - Wallet tracking and analysis system',
    contact: {
      name: 'API Support',
      email: 'support@demo-tracer.com'
    }
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://your-domain.com/api/v1'
        : 'http://localhost:3000/api/v1',
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
    }
  ],
  components: {
    schemas: {
      Wallet: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'Wallet address'
          },
          network: {
            type: 'string',
            description: 'Blockchain network'
          },
          chain: {
            type: 'string',
            description: 'Blockchain chain'
          },
          ownerName: {
            type: 'string',
            nullable: true,
            description: 'Owner name if available'
          },
          searchCount: {
            type: 'integer',
            description: 'Number of times searched'
          },
          riskScore: {
            type: 'number',
            description: 'Risk score (0-100)'
          },
          safetyLevel: {
            type: 'string',
            enum: ['SAFE', 'LOW_RISK', 'MEDIUM_RISK', 'HIGH_RISK', 'CRITICAL'],
            description: 'Safety level based on risk score'
          },
          tags: {
            type: 'array',
            items: { $ref: '#/components/schemas/WalletTag' }
          },
          scamInfo: {
            $ref: '#/components/schemas/ScamInfo',
            nullable: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      WalletTag: {
        type: 'object',
        properties: {
          id: {
            type: 'integer'
          },
          walletAddress: {
            type: 'string'
          },
          tagType: {
            type: 'string',
            enum: ['EXCHANGE', 'DEFI', 'SCAM', 'MIXER', 'GAMBLING', 'MINING', 'BRIDGE', 'NFT', 'LENDING', 'OTHER']
          },
          description: {
            type: 'string',
            nullable: true
          },
          addedBy: {
            type: 'string'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      ScamInfo: {
        type: 'object',
        properties: {
          walletAddress: {
            type: 'string'
          },
          scamType: {
            type: 'string'
          },
          description: {
            type: 'string'
          },
          reportedBy: {
            type: 'string'
          },
          reportedAt: {
            type: 'string',
            format: 'date-time'
          },
          verified: {
            type: 'boolean'
          }
        }
      },
      Graph: {
        type: 'object',
        properties: {
          id: {
            type: 'integer'
          },
          rootWalletAddress: {
            type: 'string'
          },
          name: {
            type: 'string',
            nullable: true
          },
          description: {
            type: 'string',
            nullable: true
          },
          createdBy: {
            type: 'string'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          },
          nodes: {
            type: 'array',
            items: { $ref: '#/components/schemas/GraphNode' }
          },
          edges: {
            type: 'array',
            items: { $ref: '#/components/schemas/GraphEdge' }
          },
          stats: {
            $ref: '#/components/schemas/GraphStats'
          }
        }
      },
      GraphNode: {
        type: 'object',
        properties: {
          id: {
            type: 'integer'
          },
          graphId: {
            type: 'integer'
          },
          walletAddress: {
            type: 'string'
          },
          nodeType: {
            type: 'string',
            enum: ['ROOT', 'CONNECTED', 'SUSPICIOUS']
          },
          walletChain: {
            type: 'string'
          },
          walletOwnerName: {
            type: 'string',
            nullable: true
          },
          riskScore: {
            type: 'number'
          },
          tags: {
            type: 'array',
            items: { $ref: '#/components/schemas/WalletTag' }
          }
        }
      },
      GraphEdge: {
        type: 'object',
        properties: {
          id: {
            type: 'integer'
          },
          graphId: {
            type: 'integer'
          },
          transactionHash: {
            type: 'string'
          },
          fromWalletAddress: {
            type: 'string'
          },
          toWalletAddress: {
            type: 'string'
          },
          amount: {
            type: 'string'
          },
          timestamp: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      GraphStats: {
        type: 'object',
        properties: {
          totalNodes: {
            type: 'integer'
          },
          totalEdges: {
            type: 'integer'
          },
          nodeTypes: {
            type: 'object',
            additionalProperties: {
              type: 'integer'
            }
          },
          tagDistribution: {
            type: 'object',
            additionalProperties: {
              type: 'integer'
            }
          },
          averageRiskScore: {
            type: 'number'
          },
          highRiskNodes: {
            type: 'integer'
          }
        }
      },
      Stats: {
        type: 'object',
        properties: {
          overview: {
            type: 'object',
            properties: {
              totalWallets: {
                type: 'integer'
              },
              totalTags: {
                type: 'integer'
              },
              totalGraphs: {
                type: 'integer'
              },
              totalScamReports: {
                type: 'integer'
              }
            }
          },
          distribution: {
            type: 'object',
            properties: {
              networks: {
                type: 'object',
                additionalProperties: {
                  type: 'integer'
                }
              },
              tagTypes: {
                type: 'object',
                additionalProperties: {
                  type: 'integer'
                }
              },
              riskLevels: {
                type: 'object',
                additionalProperties: {
                  type: 'integer'
                }
              }
            }
          },
          activity: {
            type: 'object',
            properties: {
              last24Hours: {
                type: 'object',
                properties: {
                  newWallets: {
                    type: 'integer'
                  },
                  newTags: {
                    type: 'integer'
                  },
                  newGraphs: {
                    type: 'integer'
                  }
                }
              },
              topSearchedWallets: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    address: {
                      type: 'string'
                    },
                    searchCount: {
                      type: 'integer'
                    }
                  }
                }
              }
            }
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string'
          },
          code: {
            type: 'string'
          },
          details: {
            type: 'object'
          }
        }
      }
    },
    parameters: {
      LimitParam: {
        name: 'limit',
        in: 'query',
        description: 'Number of items to return (max 100)',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 20
        }
      },
      OffsetParam: {
        name: 'offset',
        in: 'query',
        description: 'Number of items to skip',
        schema: {
          type: 'integer',
          minimum: 0,
          default: 0
        }
      },
      NetworkParam: {
        name: 'network',
        in: 'query',
        description: 'Filter by blockchain network',
        schema: {
          type: 'string'
        }
      }
    }
  },
  tags: [
    {
      name: 'Address',
      description: 'Wallet address operations'
    },
    {
      name: 'Tags',
      description: 'Wallet tag operations'
    },
    {
      name: 'Graph',
      description: 'Graph operations'
    },
    {
      name: 'Stats',
      description: 'Statistics and analytics'
    }
  ]
};

export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    definition: swaggerDefinition,
    apiFolder: 'src/app/(api)/api/v1',
  });
  return spec;
};