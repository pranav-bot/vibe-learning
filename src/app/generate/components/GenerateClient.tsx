'use client';

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { 
  BookOpen,
  Send,
} from "lucide-react";
import DifficultyDialog from "~/components/DifficultyDialog";

export default function GenerateClient() {
  const [topicName, setTopicName] = useState('');
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim()) return;
    
    // Show difficulty dialog instead of handling submission here
    setShowDifficultyDialog(true);
  };

  return (
    <div className="min-h-screen bg-background">
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

              {/* <div className="space-y-2">
                <label htmlFor="difficulty" className="text-sm font-medium text-left block">
                  Difficulty
                </label>
                <Select
                  value={difficulty}
                  onValueChange={(value: "beginner" | "intermediate" | "advanced") => setDifficulty(value)}
                >
                  <SelectTrigger id="difficulty" className="text-s py-3">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}
              
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
        </div>
      </main>

      {/* Difficulty Dialog */}
      <DifficultyDialog
        isOpen={showDifficultyDialog}
        onClose={() => {
          setShowDifficultyDialog(false);
          setTopicName(''); // Reset topic name when dialog is closed
          setDifficulty("beginner");
        }}
        courseTitle={topicName}
        initialDifficulty={difficulty}
      />
    </div>
  );
}
