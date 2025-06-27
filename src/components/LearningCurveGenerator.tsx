"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Loader2, Sparkles, TrendingUp } from "lucide-react";
import { api } from "~/trpc/react";
import { type LearningCurve } from "~/course-builder-ai/learning-curve";
import { LearningCurveDisplay } from "./LearningCurveDisplay";

interface LearningCurveGeneratorProps {
  className?: string;
}

export function LearningCurveGenerator({ className }: LearningCurveGeneratorProps) {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [generatedCurve, setGeneratedCurve] = useState<LearningCurve | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCurveMutation = api.curve.generate.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        setGeneratedCurve(result.data as LearningCurve);
      }
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error("Error generating learning curve:", error);
      setIsGenerating(false);
    },
  });

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    setGeneratedCurve(null);
    
    try {
      await generateCurveMutation.mutateAsync({
        topic: topic.trim(),
        difficulty,
      });
    } catch (error) {
      console.error("Failed to generate learning curve:", error);
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setTopic("");
    setDifficulty("beginner");
    setGeneratedCurve(null);
    setIsGenerating(false);
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Learning Curve Generator Form */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Learning Curve Generator
          </CardTitle>
          <CardDescription>
            Enter any topic and we&apos;ll create an optimized learning curve with modules, timelines, and impact analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="topic">What do you want to learn?</Label>
            <Input
              id="topic"
              placeholder="e.g., Machine Learning, React Development, Digital Marketing..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating}
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select
              value={difficulty}
              onValueChange={(value: "beginner" | "intermediate" | "advanced") => setDifficulty(value)}
              disabled={isGenerating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Beginner - New to the topic</span>
                  </div>
                </SelectItem>
                <SelectItem value="intermediate">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span>Intermediate - Some experience</span>
                  </div>
                </SelectItem>
                <SelectItem value="advanced">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span>Advanced - Deep expertise</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={!topic.trim() || isGenerating}
              className="flex-1"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Learning Curve...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Learning Curve
                </>
              )}
            </Button>
            
            {generatedCurve && (
              <Button
                onClick={handleReset}
                variant="outline"
                size="lg"
                disabled={isGenerating}
              >
                Reset
              </Button>
            )}
          </div>

          {generateCurveMutation.error && (
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <p className="text-red-700 text-sm">
                Error: {generateCurveMutation.error.message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Learning Curve Display */}
      {(isGenerating || generatedCurve) && (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold">
              {isGenerating ? `Generating Learning Path for "${topic}"...` : "Your Learning Curve"}
            </h2>
            {!isGenerating && generatedCurve && (
              <p className="text-muted-foreground mt-2">
                Optimized learning path for <span className="font-medium">{generatedCurve.topic}</span> at <span className="font-medium">{generatedCurve.difficulty}</span> level
                <br />
                <span className="text-sm">
                  {generatedCurve.totalEstimatedHours} hours total • {generatedCurve.coreModules.length} core modules
                </span>
              </p>
            )}
            {isGenerating && (
              <p className="text-muted-foreground mt-2">
                Creating an optimized learning path at <span className="font-medium">{difficulty}</span> level...
              </p>
            )}
          </div>

          <LearningCurveDisplay 
            learningCurve={generatedCurve ?? undefined} 
            isLoading={isGenerating} 
          />
        </div>
      )}
    </div>
  );
}

export default LearningCurveGenerator;
