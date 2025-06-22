"use client";

import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

interface RoadmapLoadingProps {
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export default function RoadmapLoading({ topic, difficulty }: RoadmapLoadingProps) {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <h1 className="text-3xl font-bold">Generating Your Learning Roadmap</h1>
        </div>
        <div className="flex items-center justify-center space-x-4">
          <Badge variant="outline" className="text-lg px-4 py-2">
            {topic}
          </Badge>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Badge>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          We&apos;re analyzing your learning preferences and creating a personalized roadmap with interactive mindmap visualization. This may take a few moments...
        </p>
      </div>

      {/* Loading Animation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mindmap Placeholder */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-muted animate-pulse rounded w-64"></div>
                  <div className="h-6 bg-muted animate-pulse rounded w-20"></div>
                </div>
                <div className="h-4 bg-muted animate-pulse rounded w-96"></div>
                
                {/* Mindmap Loading Animation */}
                <div className="h-[600px] border rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="relative">
                      {/* Central node */}
                      <div className="w-24 h-24 bg-primary/20 rounded-full animate-pulse mx-auto"></div>
                      
                      {/* Branch nodes */}
                      <div className="absolute -top-8 -left-16 w-16 h-16 bg-secondary/20 rounded-full animate-pulse delay-300"></div>
                      <div className="absolute -top-8 -right-16 w-16 h-16 bg-secondary/20 rounded-full animate-pulse delay-500"></div>
                      <div className="absolute -bottom-8 -left-16 w-16 h-16 bg-secondary/20 rounded-full animate-pulse delay-700"></div>
                      <div className="absolute -bottom-8 -right-16 w-16 h-16 bg-secondary/20 rounded-full animate-pulse delay-1000"></div>
                      
                      {/* Connecting lines */}
                      <div className="absolute top-1/2 left-1/2 w-20 h-0.5 bg-muted animate-pulse transform -translate-x-full -translate-y-1/2 rotate-45"></div>
                      <div className="absolute top-1/2 left-1/2 w-20 h-0.5 bg-muted animate-pulse transform -translate-y-1/2 -rotate-45"></div>
                      <div className="absolute top-1/2 left-1/2 w-20 h-0.5 bg-muted animate-pulse transform -translate-x-full -translate-y-1/2 -rotate-45"></div>
                      <div className="absolute top-1/2 left-1/2 w-20 h-0.5 bg-muted animate-pulse transform -translate-y-1/2 rotate-45"></div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Building mindmap structure...</p>
                      <p className="text-xs text-muted-foreground">Creating hierarchical roadmap structure</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Placeholder */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-6 bg-muted animate-pulse rounded w-32"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-6 bg-muted animate-pulse rounded w-40"></div>
                <div className="space-y-2">
                  <div className="h-8 bg-muted animate-pulse rounded"></div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-2 p-3 border rounded-lg">
                        <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                        <div className="h-3 bg-muted animate-pulse rounded w-full"></div>
                        <div className="h-3 bg-muted animate-pulse rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span className="text-sm font-medium">Analyzing Topic</span>
            </div>
            <div className="w-8 h-0.5 bg-muted"></div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-primary rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Generating Structure</span>
            </div>
            <div className="w-8 h-0.5 bg-muted"></div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-muted rounded-full"></div>
              <span className="text-sm text-muted-foreground">Creating Mindmap</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
