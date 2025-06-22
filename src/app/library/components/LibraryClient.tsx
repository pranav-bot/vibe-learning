'use client';

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { 
  BookOpen,
  ArrowLeft,
  Send,
  Calendar,
  Layers,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import ThemeToggle from "~/components/ThemeToggle";
import LoginButton from "~/components/LoginLogOutButton";
import DifficultyDialog from "~/components/DifficultyDialog";
import { api } from "~/trpc/react";

export default function LibraryClient() {
  const [topicName, setTopicName] = useState('');
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);

  // Fetch user's previously generated roadmaps
  const userRoadmapsQuery = api.roadmap.getUserRoadmaps.useQuery({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim()) return;
    
    // Show difficulty dialog instead of handling submission here
    setShowDifficultyDialog(true);
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
              <Link href="/library" className="text-foreground font-medium">
                Library
              </Link>
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <LoginButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <BookOpen className="h-16 w-16 mx-auto text-primary mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              What Would You Like to Learn?
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Enter any topic and we&apos;ll create a personalized learning experience for you
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="topic" className="text-sm font-medium text-left block">
                  Topic Name
                </label>
                <Input
                  id="topic"
                  type="text"
                  placeholder="e.g., Machine Learning, React Development, Photography..."
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  className="text-lg py-3"
                />
              </div>
              
              <Button 
                type="submit" 
                size="lg" 
                className="w-full flex items-center gap-2"
                disabled={!topicName.trim()}
              >
                <Send className="h-5 w-5" />
                Start Learning
              </Button>

              {/* Popular topics moved inside the card */}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  Popular topics to get you started:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    'Machine Learning',
                    'Web Development',
                    'Data Science',
                    'Digital Marketing',
                    'Photography',
                    'Python Programming',
                    'UI/UX Design',
                    'Blockchain'
                  ].map((topic) => (
                    <Button
                      key={topic}
                      variant="outline"
                      size="sm"
                      onClick={() => setTopicName(topic)}
                      className="text-xs"
                    >
                      {topic}
                    </Button>
                  ))}
                </div>
              </div>
            </form>
          </Card>

          {/* Previously Generated Roadmaps */}
          {userRoadmapsQuery.data?.data && userRoadmapsQuery.data.data.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Your Roadmaps</h2>
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-2">
                  {userRoadmapsQuery.data.data.map((roadmap) => (
                    <Card key={roadmap.id} className="p-6 hover:shadow-md transition-shadow min-h-[200px]">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-2">{roadmap.title}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">{roadmap.description}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(roadmap.createdAt).toLocaleDateString()}
                          <span>•</span>
                          <Layers className="h-3 w-3" />
                          {roadmap.topicCount} topics
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <Badge variant="secondary" className="text-xs">
                            {roadmap.difficulty}
                          </Badge>
                          <Link href={`/map?roadmapId=${roadmap.id}`}>
                            <Button size="sm" variant="outline" className="flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Loading state for roadmaps */}
          {userRoadmapsQuery.isLoading && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Your Roadmaps</h2>
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-2">
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
            </div>
          )}
        </div>
      </main>

      {/* Difficulty Dialog */}
      <DifficultyDialog
        isOpen={showDifficultyDialog}
        onClose={() => {
          setShowDifficultyDialog(false);
          setTopicName(''); // Reset topic name when dialog is closed
        }}
        courseTitle={topicName}
      />
    </div>
  );
}
