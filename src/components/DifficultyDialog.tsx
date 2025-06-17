"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import { Badge } from "~/components/ui/badge";

interface DifficultyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
}

const DIFFICULTY_LEVELS = [
  { value: 0, label: "beginner", display: "Beginner", description: "New to this topic" },
  { value: 1, label: "intermediate", display: "Intermediate", description: "Some experience" },
  { value: 2, label: "advanced", display: "Advanced", description: "Experienced learner" }
] as const;

export default function DifficultyDialog({ isOpen, onClose, courseTitle }: DifficultyDialogProps) {
  const [difficultyValue, setDifficultyValue] = useState([0]);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  const currentDifficulty = DIFFICULTY_LEVELS[difficultyValue[0] ?? 0]!;

  // Listen for route changes to close dialog when navigation completes
  useEffect(() => {
    if (isNavigating) {
      const handleRouteChange = () => {
        // Small delay to ensure the new page has loaded
        setTimeout(() => {
          setIsNavigating(false);
          onClose();
        }, 500);
      };

      // Since we can't directly listen to Next.js router events in app router,
      // we'll use a timeout as fallback
      const timeout = setTimeout(handleRouteChange, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [isNavigating, onClose]);

  const handleGo = () => {
    setIsNavigating(true);
    
    // Navigate to map page with query parameters
    const params = new URLSearchParams({
      topic: courseTitle,
      difficulty: currentDifficulty.label,
      autoGenerate: "true"
    });
    
    router.push(`/map?${params.toString()}`);
  };

  // Reset navigation state when dialog closes
  const handleClose = () => {
    setIsNavigating(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Your Learning Level</DialogTitle>
          <DialogDescription>
            Select your current knowledge level for <strong>{courseTitle}</strong> to get a personalized learning roadmap.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Difficulty Slider */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Difficulty Level</Label>
            <div className="px-2">
              <Slider
                value={difficultyValue}
                onValueChange={setDifficultyValue}
                max={2}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
            
            {/* Difficulty Labels */}
            <div className="flex justify-between text-xs text-muted-foreground px-2">
              <span>Beginner</span>
              <span>Intermediate</span>
              <span>Advanced</span>
            </div>
          </div>

          {/* Current Selection Display */}
          <div className="text-center space-y-2">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {currentDifficulty.display}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {currentDifficulty.description}
            </p>
          </div>

          {/* Level Descriptions */}
          <div className="space-y-2 text-sm">
            <div className={`p-3 rounded-lg border ${
              difficultyValue[0] === 0 ? 'bg-primary/10 border-primary' : 'bg-muted/50'
            }`}>
              <div className="font-medium">Beginner</div>
              <div className="text-muted-foreground">Start from the basics with foundational concepts</div>
            </div>
            <div className={`p-3 rounded-lg border ${
              difficultyValue[0] === 1 ? 'bg-primary/10 border-primary' : 'bg-muted/50'
            }`}>
              <div className="font-medium">Intermediate</div>
              <div className="text-muted-foreground">Build on existing knowledge with practical applications</div>
            </div>
            <div className={`p-3 rounded-lg border ${
              difficultyValue[0] === 2 ? 'bg-primary/10 border-primary' : 'bg-muted/50'
            }`}>
              <div className="font-medium">Advanced</div>
              <div className="text-muted-foreground">Deep dive into complex topics and advanced techniques</div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClose} disabled={isNavigating}>
            Cancel
          </Button>
          <Button onClick={handleGo} className="px-8" disabled={isNavigating}>
            {isNavigating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Loading Roadmap...
              </>
            ) : (
              "Generate Roadmap"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
