"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { ChevronDown, ChevronRight, Clock, Target, TrendingUp, PlayCircle } from "lucide-react";
import { type LearningCurve, type CoreModule, type SubModule } from "~/course-builder-ai/learning-curve";

// Helper function to generate SVG path with steepness-based curves
function generateCurvePath(modules: CoreModule[], totalImpact: number): string {
  if (modules.length < 2) return "";
  
  const sortedModules = modules.sort((a, b) => a.order - b.order);
  const points = sortedModules.map((module, index) => ({
    x: 50 + (index * 300) / Math.max(sortedModules.length - 1, 1),
    y: 160 - ((module.cumulativeImpact / totalImpact) * 120),
    steepness: module.steepness
  }));

  const firstPoint = points[0];
  if (!firstPoint) return "";
  
  let path = `M ${firstPoint.x} ${firstPoint.y}`;
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    
    if (!prev || !curr) continue;
    
    // Calculate control points based on steepness
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const steepnessFactor = (prev.steepness + curr.steepness) / 4; // Average steepness, normalized
    
    // Create more dramatic curves based on steepness
    const cp1x = prev.x + dx * (0.3 + steepnessFactor * 0.2);
    const cp1y = prev.y + dy * (0.1 + steepnessFactor * 0.3);
    const cp2x = curr.x - dx * (0.3 + steepnessFactor * 0.2);
    const cp2y = curr.y - dy * (0.1 + steepnessFactor * 0.3);
    
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
  }
  
  return path;
}

interface LearningCurveVisualizationProps {
  learningCurve: LearningCurve;
  isLoading?: boolean;
}

export function LearningCurveVisualization({ learningCurve, isLoading = false }: LearningCurveVisualizationProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [activePhase, setActivePhase] = useState<number>(0);

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const getSteepnessLabel = (steepness: number) => {
    if (steepness >= 2.5) return "Very High Impact";
    if (steepness >= 2.0) return "High Impact";
    if (steepness >= 1.5) return "Strong Progress";
    if (steepness >= 1.0) return "Steady Learning";
    if (steepness >= 0.5) return "Gradual Growth";
    return "Deep Understanding";
  };

  const getSteepnessColor = (steepness: number) => {
    if (steepness >= 2.5) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (steepness >= 2.0) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    if (steepness >= 1.5) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    if (steepness >= 1.0) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (steepness >= 0.5) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
  };

  const getModuleDescription = (module: CoreModule) => {
    const steepnessDescription = module.steepness >= 2.0 ? "rapid progression" : 
                                module.steepness >= 1.5 ? "steady advancement" :
                                module.steepness >= 1.0 ? "moderate learning pace" :
                                "gradual deep understanding";
    
    return `${module.description} Features ${steepnessDescription} with ${module.steepness.toFixed(1)} steepness factor.`;
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-8">
        <Card className="w-full">
          <CardHeader>
            <div className="animate-pulse space-y-2">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold">
          We create <span className="text-primary">optimized</span> learning
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Compared to traditional learning paths, steepness-optimized learning curves achieve{" "}
          <span className="font-bold text-foreground">faster mastery</span> through strategic progression.
        </p>
      </div>

      {/* Learning Journey Curve */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20"></div>
        <CardContent className="relative p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">The Learning Curve</h2>
            <p className="text-muted-foreground">
              Each core module has a unique steepness that optimizes learning progression and impact acquisition.
            </p>
          </div>

          {/* Curve Visualization */}
          <div className="relative mb-8">
            <div className="flex justify-between items-end h-40 mb-4">
              {learningCurve.coreModules
                .sort((a, b) => a.order - b.order)
                .map((module, index) => {
                  const height = ((module.cumulativeImpact / learningCurve.totalImpact) * 100);
                  const isActive = activePhase === index;
                  const steepnessIntensity = Math.min(module.steepness / 3.0, 1.0); // Normalize steepness to 0-1
                  
                  return (
                    <div
                      key={module.id}
                      className="flex-1 flex flex-col items-center cursor-pointer group"
                      onClick={() => setActivePhase(index)}
                    >
                      <div 
                        className={`w-full mx-2 rounded-t transition-all duration-300 relative ${
                          isActive 
                            ? 'bg-primary shadow-lg' 
                            : 'bg-muted hover:bg-muted-foreground/20 group-hover:bg-primary/50'
                        }`}
                        style={{ 
                          height: `${Math.max(height, 20)}%`,
                          background: isActive 
                            ? `linear-gradient(to top, hsl(var(--primary)), hsl(var(--primary) / ${0.6 + steepnessIntensity * 0.4}))` 
                            : undefined
                        }}
                      >
                        {/* Steepness indicator */}
                        <div 
                          className={`absolute top-2 right-2 text-xs font-mono ${
                            isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {module.steepness.toFixed(1)}
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        <div className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                          Module {index + 1}
                        </div>
                        <div className={`text-xs ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {getSteepnessLabel(module.steepness)}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            
            {/* Dynamic Curve Line with Steepness */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 160">
              {learningCurve.coreModules.length >= 2 && (
                <path
                  d={generateCurvePath(learningCurve.coreModules, learningCurve.totalImpact)}
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  className="text-primary/70"
                  strokeLinecap="round"
                />
              )}
              
              {/* Steepness indicator dots */}
              {learningCurve.coreModules
                .sort((a, b) => a.order - b.order)
                .map((module, index) => {
                  const x = 50 + (index * 300) / Math.max(learningCurve.coreModules.length - 1, 1);
                  const y = 160 - ((module.cumulativeImpact / learningCurve.totalImpact) * 120);
                  const radius = 2 + (module.steepness / 3.0) * 4; // Size based on steepness
                  
                  return (
                    <circle
                      key={module.id}
                      cx={x}
                      cy={y}
                      r={radius}
                      fill="currentColor"
                      className={`${activePhase === index ? 'text-primary' : 'text-primary/60'}`}
                    />
                  );
                })}
            </svg>
          </div>

          {/* Active Phase Description */}
          {learningCurve.coreModules[activePhase] && (
            <div className="text-center space-y-2 p-6 bg-card rounded-lg border">
              <h3 className="text-xl font-bold">
                {String(activePhase + 1).padStart(3, '0')} {learningCurve.coreModules[activePhase].title}
              </h3>
              <p className="text-muted-foreground">
                {getModuleDescription(learningCurve.coreModules[activePhase])}
              </p>
              <div className="flex justify-center items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {learningCurve.coreModules[activePhase].totalTimeToLearn}h
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  {learningCurve.coreModules[activePhase].totalImpact} total impact
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  {learningCurve.coreModules[activePhase].cumulativeImpact} cumulative
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {learningCurve.totalEstimatedHours}
            </div>
            <div className="text-sm text-muted-foreground">Total Hours</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {learningCurve.totalImpact}
            </div>
            <div className="text-sm text-muted-foreground">Impact Score</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {learningCurve.coreModules.length}
            </div>
            <div className="text-sm text-muted-foreground">Core Modules</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Modules */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-center">Core Learning Modules</h2>
        
        {learningCurve.coreModules
          .sort((a, b) => a.order - b.order)
          .map((module, index) => (
            <CoreModuleCard
              key={module.id}
              module={module}
              moduleNumber={index + 1}
              isExpanded={expandedModules.has(module.id)}
              onToggle={() => toggleModule(module.id)}
              getSteepnessColor={getSteepnessColor}
            />
          ))}
      </div>
    </div>
  );
}

interface CoreModuleCardProps {
  module: CoreModule;
  moduleNumber: number;
  isExpanded: boolean;
  onToggle: () => void;
  getSteepnessColor: (steepness: number) => string;
}

function CoreModuleCard({ 
  module, 
  moduleNumber, 
  isExpanded, 
  onToggle, 
  getSteepnessColor 
}: CoreModuleCardProps) {
  const getSteepnessDescription = (steepness: number) => {
    if (steepness >= 2.5) return "Very High Impact";
    if (steepness >= 2.0) return "High Impact";
    if (steepness >= 1.5) return "Strong Progress";
    if (steepness >= 1.0) return "Steady Learning";
    return "Gradual Growth";
  };

  return (
    <Card className="overflow-hidden border-l-4 border-l-primary">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-2xl font-mono font-bold text-primary">
                {String(moduleNumber).padStart(2, '0')}
              </div>
              <Badge className={getSteepnessColor(module.steepness)}>
                Steepness: {module.steepness.toFixed(1)}
              </Badge>
              <Badge variant="outline">
                {getSteepnessDescription(module.steepness)}
              </Badge>
            </div>
            <CardTitle className="text-2xl mb-2">{module.title}</CardTitle>
            <CardDescription className="text-base">
              {module.description}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="ml-4 flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{module.totalTimeToLearn} hours</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span>{module.totalImpact} total impact</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>{module.cumulativeImpact} cumulative impact</span>
          </div>
          <div className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            <span>Steepness: {module.steepness.toFixed(1)}</span>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="grid gap-4 md:grid-cols-2">
            {module.subModules.map((subModule) => (
              <SubModuleCard
                key={subModule.id}
                subModule={subModule}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

interface SubModuleCardProps {
  subModule: SubModule;
}

function SubModuleCard({ subModule }: SubModuleCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-base">{subModule.title}</h4>
            <Badge variant="outline">
              Impact: {subModule.impact}/10
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {subModule.description}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{subModule.timeToLearn}h</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              <span>{subModule.impact}/10</span>
            </div>
          </div>

          {subModule.learningOutcomes.length > 0 && (
            <div>
              <h5 className="font-medium text-xs mb-1 text-muted-foreground uppercase tracking-wide">
                Key Outcomes
              </h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                {subModule.learningOutcomes.slice(0, 2).map((outcome, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span className="line-clamp-1">{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default LearningCurveVisualization;
