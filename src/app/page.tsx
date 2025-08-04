"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Demo API call function
const fetchData = async () => {
  const response = await fetch("https://jsonplaceholder.typicode.com/posts/1");
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

export default function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["demo-data"],
    queryFn: fetchData,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Demo Tracer</h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">
              Welcome to Demo Tracer
            </h2>
            <p className="text-xl text-muted-foreground">
              A Next.js project with shadcn/ui, TailwindCSS, React Query, and
              Dark Theme
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>🎨 shadcn/ui</CardTitle>
                <CardDescription>
                  Beautiful and accessible UI components built with Radix UI and
                  Tailwind CSS
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button className="w-full">Primary Button</Button>
                  <Button variant="outline" className="w-full">
                    Outline Button
                  </Button>
                  <Button variant="ghost" className="w-full">
                    Ghost Button
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🌙 Dark Theme</CardTitle>
                <CardDescription>
                  Toggle between light and dark modes with next-themes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Click the theme toggle button in the header to switch between
                  light and dark modes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🔄 React Query</CardTitle>
                <CardDescription>
                  Powerful data fetching and caching with TanStack Query
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {isLoading && <p className="text-sm">Loading data...</p>}
                  {error && (
                    <p className="text-sm text-destructive">
                      Error loading data
                    </p>
                  )}
                  {data && (
                    <div className="text-sm">
                      <p className="font-medium">Fetched Data:</p>
                      <p className="text-muted-foreground truncate">
                        {data.title}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tech Stack */}
          <Card>
            <CardHeader>
              <CardTitle>🛠️ Tech Stack</CardTitle>
              <CardDescription>
                Technologies used in this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="font-medium">Framework</p>
                  <p className="text-muted-foreground">Next.js 15</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">UI Library</p>
                  <p className="text-muted-foreground">shadcn/ui</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Styling</p>
                  <p className="text-muted-foreground">TailwindCSS</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">State Management</p>
                  <p className="text-muted-foreground">React Query</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Package Manager</p>
                  <p className="text-muted-foreground">pnpm</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Language</p>
                  <p className="text-muted-foreground">TypeScript</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Theme</p>
                  <p className="text-muted-foreground">next-themes</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Icons</p>
                  <p className="text-muted-foreground">Lucide React</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
