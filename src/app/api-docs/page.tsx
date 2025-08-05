'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiSpec = async () => {
      try {
        const response = await fetch('/api/docs');
        if (!response.ok) {
          throw new Error('Failed to fetch API specification');
        }
        const apiSpec = await response.json();
        setSpec(apiSpec);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchApiSpec();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading API Documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Demo Tracer API Documentation</h1>
            <p className="mt-2 text-gray-600">
              Interactive API documentation for the Demo Tracer wallet tracking and analysis system.
            </p>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          {spec && (
            <div className="p-6">
              <SwaggerUI 
                spec={spec}
                deepLinking={true}
                displayOperationId={false}
                defaultModelsExpandDepth={1}
                defaultModelExpandDepth={1}
                defaultModelRendering="example"
                displayRequestDuration={true}
                docExpansion="list"
                filter={true}
                showExtensions={true}
                showCommonExtensions={true}
                tryItOutEnabled={true}
              />
            </div>
          )}
        </div>
      </div>
      
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-300">
              © 2024 Demo Tracer. Built with Next.js and Swagger UI.
            </p>
            <div className="mt-4 space-x-6">
              <Link href="/" className="text-blue-400 hover:text-blue-300">Home</Link>
              <Link href="/api-docs" className="text-blue-400 hover:text-blue-300">API Docs</Link>
              <a href="https://github.com" className="text-blue-400 hover:text-blue-300">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}