'use client';

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { 
  BookOpen,
  ArrowLeft,
  Calendar,
  Layers,
  ExternalLink,
  Globe,
  Lock
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import ThemeToggle from "~/components/ThemeToggle";
import LoginButton from "~/components/LoginLogOutButton";
import { api } from "~/trpc/react";
import { ProfileButton } from "~/components/ProfileButton";

import { toast } from "sonner";


export default function LibraryClient() {
  const utils = api.useUtils();

  // Fetch user's previously generated roadmaps
  const userRoadmapsQuery = api.roadmap.getUserRoadmaps.useQuery({});
  
  // Visibility toggle mutation
  const toggleVisibilityMutation = api.roadmap.toggleVisibility.useMutation({
    onSuccess: async (data) => {
      toast.success(`Roadmap is now ${data.data.isPublic ? 'Public' : 'Private'}`);
      await utils.roadmap.getUserRoadmaps.invalidate();
    },
    onError: (error) => {
      console.error("Error toggling visibility:", error);
      toast.error("Failed to update visibility");
    }
  });

  const handleToggleVisibility = (id: string, currentStatus: boolean) => {
    toggleVisibilityMutation.mutate({
      id,
      isPublic: !currentStatus
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5" />
              <div className="h-8 w-8 rounded-lg bg-foreground"></div>
              <span className="text-xl font-bold">Vibe Learning</span>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/generate" className="text-muted-foreground font-medium hover:text-foreground">
                Create
              </Link>
              <Link href="/library" className="text-foreground font-medium">
                My Roadmaps
              </Link>
              <Link href="/trending" className="text-muted-foreground font-medium hover:text-foreground">
                  Trending
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <ProfileButton />
            <LoginButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">My Roadmaps</h1>
             </div>
             <Button asChild>
                <Link href="/generate">
                    Create New
                </Link>
             </Button>
          </div>

          {/* Previously Generated Roadmaps */}
          {userRoadmapsQuery.data?.data && userRoadmapsQuery.data.data.length > 0 ? (
            <div>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                  <TabsTrigger value="all">All Roadmaps</TabsTrigger>
                  <TabsTrigger value="public">Public</TabsTrigger>
                  <TabsTrigger value="private">Private</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userRoadmapsQuery.data.data.map((roadmap) => (
                        <RoadmapCard 
                          key={roadmap.id} 
                          roadmap={roadmap} 
                          onToggleVisibility={handleToggleVisibility}
                          isToggling={toggleVisibilityMutation.isPending && toggleVisibilityMutation.variables?.id === roadmap.id}
                        />
                      ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="public">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userRoadmapsQuery.data.data
                        .filter(r => r.isPublic)
                        .map((roadmap) => (
                          <RoadmapCard 
                            key={roadmap.id} 
                            roadmap={roadmap} 
                            onToggleVisibility={handleToggleVisibility} 
                            isToggling={toggleVisibilityMutation.isPending && toggleVisibilityMutation.variables?.id === roadmap.id}
                          />
                        ))}
                    </div>
                      {userRoadmapsQuery.data.data.filter(r => r.isPublic).length === 0 && (
                        <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg">
                          No public roadmaps found.
                        </div>
                      )}
                </TabsContent>
                
                <TabsContent value="private">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {userRoadmapsQuery.data.data
                        .filter(r => !r.isPublic)
                        .map((roadmap) => (
                          <RoadmapCard 
                            key={roadmap.id} 
                            roadmap={roadmap} 
                            onToggleVisibility={handleToggleVisibility} 
                            isToggling={toggleVisibilityMutation.isPending && toggleVisibilityMutation.variables?.id === roadmap.id}
                          />
                        ))}
                    </div>
                      {userRoadmapsQuery.data.data.filter(r => !r.isPublic).length === 0 && (
                        <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg">
                          No private roadmaps found.
                        </div>
                      )}
                </TabsContent>
              </Tabs>
            </div>
          ) : !userRoadmapsQuery.isLoading && (
              <div className="text-center py-20 bg-muted/30 rounded-xl border-dashed border-2">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No roadmaps yet</h3>
                  <p className="text-muted-foreground mb-6">Start your learning journey by creating your first roadmap.</p>
                  <Button asChild size="lg">
                    <Link href="/generate">Create Roadmap</Link>
                  </Button>
              </div>
          )}

          {/* Loading state for roadmaps */}
          {userRoadmapsQuery.isLoading && (
            <div className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="p-6 min-h-[200px]">
                      <Skeleton className="h-5 w-3/4 mb-3" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-6" />
                      <div className="flex justify-between items-center mt-auto">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </Card>
                  ))}
                </div>
            </div>
          )}
        </div>
      </main>

      {/* Difficulty Dialog removed */}
    </div>
  );
}


function RoadmapCard({ 
  roadmap, 
  onToggleVisibility, 
  isToggling 
}: { 
  roadmap: any; 
  onToggleVisibility: (id: string, currentStatus: boolean) => void;
  isToggling: boolean;
}) {
  return (
    <Card className="p-6 hover:shadow-md transition-shadow min-h-[200px] flex flex-col justify-between">
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg line-clamp-1" title={roadmap.title}>{roadmap.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2" title={roadmap.description}>
            {roadmap.description}
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {new Date(roadmap.createdAt).toLocaleDateString()}
          <span>•</span>
          <Layers className="h-3 w-3" />
          {roadmap.topicCount} topics
        </div>
      </div>
        
      <div className="flex flex-col gap-3 pt-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Switch
                    checked={roadmap.isPublic}
                    onCheckedChange={() => onToggleVisibility(roadmap.id, roadmap.isPublic)}
                    disabled={isToggling}
                    id={`visibility-${roadmap.id}`}
                />
                <Label htmlFor={`visibility-${roadmap.id}`} className="text-xs font-medium cursor-pointer flex items-center gap-1.5">
                    {isToggling ? (
                        <span className="text-muted-foreground">Updating...</span>
                    ) : roadmap.isPublic ? (
                        <>
                            <Globe className="h-3 w-3 text-primary" />
                            <span className="text-primary">Public</span>
                        </>
                    ) : (
                        <>
                            <Lock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Private</span>
                        </>
                    )}
                </Label>
            </div>
            <Badge variant="secondary" className="text-xs">
                {roadmap.difficulty}
            </Badge>
        </div>

        <Link href={`/map?roadmapId=${roadmap.id}`} className="w-full">
          <Button size="sm" variant="outline" className="w-full flex items-center justify-center gap-1">
            <ExternalLink className="h-3 w-3" />
            View Roadmap
          </Button>
        </Link>
      </div>
    </Card>
  );
}
