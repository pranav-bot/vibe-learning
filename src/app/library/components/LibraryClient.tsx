'use client';

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { 
  BookOpen,
  ArrowLeft,
  Send
} from "lucide-react";
import Link from "next/link";
import ThemeToggle from "~/components/ThemeToggle";
import LoginButton from "~/components/LoginLogOutButton";
import DifficultyDialog from "~/components/DifficultyDialog";

export default function LibraryClient() {
  const [topicName, setTopicName] = useState('');
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);

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
            </form>
          </Card>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
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
