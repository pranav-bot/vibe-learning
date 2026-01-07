'use client';

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { 
  ArrowLeft,
  Calendar,
  Layers,
  ExternalLink,
  Flame,
  ThumbsUp,
  User as UserIcon
} from "lucide-react";
import Link from "next/link";
import ThemeToggle from "~/components/ThemeToggle";
import LoginButton from "~/components/LoginLogOutButton";
import { api } from "~/trpc/react";
import { ProfileButton } from "~/components/ProfileButton";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { cn } from "~/lib/utils";

interface TrendingClientProps {
  user: User | null;
}

export default function TrendingClient({ user }: TrendingClientProps) {
  const trendingQuery = api.roadmap.getTrending.useQuery({ limit: 20 });
  const utils = api.useUtils();

  const toggleUpvoteMutation = api.roadmap.toggleUpvote.useMutation({
    onSuccess: async (data, variables) => {
       // Optimistically update the cache or invalidate
       await utils.roadmap.getTrending.invalidate();
    },
    onError: (error) => {
        toast.error("Please login to upvote");
    }
  });

  const handleUpvote = (id: string) => {
      if (!user) {
          toast.error("Please login to upvote");
          return;
      }
      toggleUpvoteMutation.mutate({ roadmapId: id });
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
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/library" className="text-sm font-medium hover:text-primary">
              My Roadmaps
            </Link>
             <Link href="/trending" className="text-sm font-medium hover:text-primary text-primary">
              Trending
            </Link>
            <ThemeToggle />
            {user && <ProfileButton />}
            <LoginButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="mb-12 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
                <Flame className="h-8 w-8 text-orange-500" />
                <h1 className="text-4xl font-bold">Trending Roadmaps</h1>
            </div>
          <p className="text-muted-foreground text-lg">
            Discover popular learning paths created by the community
          </p>
        </div>

        {/* Trending Roadmaps List */}
        <div className="flex flex-col space-y-4 max-w-5xl mx-auto">
          {trendingQuery.isLoading ? (
            // Loading Skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <div className="space-y-3 w-full">
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </Card>
            ))
          ) : trendingQuery.data?.data.map((roadmap) => (
            <Card key={roadmap.id} className="p-6 hover:shadow-lg transition-all">
              <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-xl truncate" title={roadmap.title}>
                      {roadmap.title}
                    </h3>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {roadmap.difficulty}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-1" title={roadmap.description}>
                    {roadmap.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                            <AvatarImage src={roadmap.creator?.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[10px]">
                                {roadmap.creator?.full_name?.charAt(0) ?? <UserIcon className="h-3 w-3" />}
                            </AvatarFallback>
                        </Avatar>
                        <span>{roadmap.creator?.full_name ?? 'Anonymous'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(roadmap.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {roadmap.topicCount} topics
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 w-full md:w-auto mt-2 md:mt-0">
                    <Button 
                        variant={roadmap.isUpvoted ? "default" : "outline"}
                        size="sm"
                        className={cn(
                            "flex items-center gap-2 transition-all min-w-[80px]",
                            roadmap.isUpvoted && "bg-primary text-primary-foreground"
                        )}
                        onClick={(e) => {
                            e.preventDefault();
                            handleUpvote(roadmap.id);
                        }}
                        disabled={toggleUpvoteMutation.isPending && toggleUpvoteMutation.variables?.roadmapId === roadmap.id}
                    >
                        <ThumbsUp className={cn("h-4 w-4", roadmap.isUpvoted && "fill-current")} />
                        <span>{roadmap.upvoteCount}</span>
                    </Button>

                    <Link href={`/map?id=${roadmap.id}`} className="flex-1 md:flex-none">
                        <Button className="w-full md:w-auto" size="sm">
                            View Roadmap
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
              </div>
            </Card>
          ))}

          {!trendingQuery.isLoading && trendingQuery.data?.data.length === 0 && (
              <div className="text-center py-12">
                  <p className="text-muted-foreground">No trending roadmaps found yet. Be the first to share one!</p>
              </div>
          )}
        </div>
      </main>
    </div>
  );
}
