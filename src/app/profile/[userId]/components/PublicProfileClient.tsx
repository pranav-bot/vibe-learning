'use client';

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { 
  Calendar,
  Layers,
  ExternalLink,
  ThumbsUp,
  User as UserIcon
} from "lucide-react";
import Link from "next/link";
import { api } from "~/trpc/react";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { cn } from "~/lib/utils";

interface PublicProfileClientProps {
  userId: string;
  user: User | null;
}

export default function PublicProfileClient({ userId, user }: PublicProfileClientProps) {
  const profileQuery = api.roadmap.getPublicUserRoadmaps.useQuery({ userId });
  const utils = api.useUtils();

  const toggleUpvoteMutation = api.roadmap.toggleUpvote.useMutation({
    onSuccess: async () => {
       await utils.roadmap.getPublicUserRoadmaps.invalidate({ userId });
    },
    onError: () => {
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

  if (profileQuery.isLoading) {
      return (
          <main className="container mx-auto px-6 py-12">
               <div className="flex flex-col items-center mb-12 space-y-4">
                  <Skeleton className="h-24 w-24 rounded-full" />
                  <Skeleton className="h-8 w-48" />
               </div>
               <div className="flex flex-col space-y-4 max-w-5xl mx-auto">
                   {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i} className="p-6">
                         <div className="space-y-3">
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-4 w-full" />
                         </div>
                      </Card>
                   ))}
               </div>
          </main>
      )
  }

  if (profileQuery.error) {
      return (
          <main className="container mx-auto px-6 py-12 text-center text-red-500">
              Error fetching profile: {profileQuery.error.message}
          </main>
      )
  }

  const { profile, data: roadmaps } = profileQuery.data;

  // Use username, fallback to 'Anonymous'
  const displayName = profile.username ?? 'Anonymous';

  return (
    <main className="container mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-12 text-center">
            <Avatar className="h-24 w-24 mb-4 ring-2 ring-primary ring-offset-2 ring-offset-background">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-2xl">
                    {displayName.charAt(0)}
                </AvatarFallback>
            </Avatar>
            <h1 className="text-3xl font-bold">{displayName}</h1>
            <p className="text-muted-foreground mt-2">
                {roadmaps.length} Public Roadmap{roadmaps.length !== 1 ? 's' : ''}
            </p>
        </div>

        {/* Roadmaps List */}
        <div className="flex flex-col space-y-4 max-w-5xl mx-auto">
          {roadmaps.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
                No public roadmaps found for this user.
            </div>
          ) : (
            roadmaps.map((roadmap) => (
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

                    <Link href={`/map?roadmapId=${roadmap.id}`} className="flex-1 md:flex-none">
                        <Button className="w-full md:w-auto" size="sm">
                            View Roadmap
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
              </div>
            </Card>
          )))}
        </div>
    </main>
  );
}
