"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { type LearningCurve } from "~/course-builder-ai/learning-curve";

interface LearningCurveDisplayProps {
  learningCurve?: LearningCurve;
  isLoading?: boolean;
}

// Placeholder data for demonstration
const placeholderData = {
  topic: "Learning Journey",
  difficulty: "intermediate" as const,
  totalEstimatedHours: 100,
  totalImpact: 100,
  coreModules: [
    {
      id: "module-1",
      title: "Foundation",
      description: "Building the basics and establishing understanding",
      totalTimeToLearn: 15,
      totalImpact: 20,
      cumulativeTime: 15,
      cumulativeImpact: 20,
      order: 1,
      steepness: 1.3,
      subModules: []
    },
    {
      id: "module-2", 
      title: "Growth",
      description: "Rapid skill development and knowledge expansion",
      totalTimeToLearn: 25,
      totalImpact: 35,
      cumulativeTime: 40,
      cumulativeImpact: 55,
      order: 2,
      steepness: 1.4,
      subModules: []
    },
    {
      id: "module-3",
      title: "Maturity",
      description: "Deepening understanding and practical mastery",
      totalTimeToLearn: 35,
      totalImpact: 25,
      cumulativeTime: 75,
      cumulativeImpact: 80,
      order: 3,
      steepness: 0.7,
      subModules: []
    },
    {
      id: "module-4",
      title: "Decline",
      description: "Maintenance phase with diminishing returns",
      totalTimeToLearn: 25,
      totalImpact: 20,
      cumulativeTime: 100,
      cumulativeImpact: 100,
      order: 4,
      steepness: 0.8,
      subModules: []
    }
  ]
};

export function LearningCurveDisplay({ learningCurve, isLoading = false }: LearningCurveDisplayProps) {
  const curveRef = useRef<SVGPathElement>(null);
  const orangeCurveRef = useRef<SVGPathElement>(null);
  const pointsRef = useRef<(SVGCircleElement | null)[]>([]);
  const [animationCompleted, setAnimationCompleted] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [curveProgress, setCurveProgress] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const subtopicsRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Use actual learning curve data or fallback to placeholder for demo
  const displayData = learningCurve ?? placeholderData;

  // Constants for curve positioning and centering
  const svgWidth = 1200;
  const svgHeight = 400;
  const horizontalPadding = 120;
  const verticalPadding = 80;
  const availableWidth = svgWidth - 2 * horizontalPadding;
  const availableHeight = svgHeight - 2 * verticalPadding;

  // Animation effect for the curve
  useEffect(() => {
    if (!isLoading && !animationCompleted) {
      animateCurve();
      setAnimationCompleted(true);
    }
  }, [isLoading, animationCompleted]);

  // Animate card hover effects
  const animateCardHover = (index: number, isEntering: boolean) => {
    const card = cardRefs.current[index];
    const subtopics = subtopicsRefs.current[index];
    
    if (!card) return;

    if (isEntering) {
      // Card hover enter animation
      gsap.to(card, {
        scale: 1.05,
        y: -8,
        duration: 0.3,
        ease: "power2.out"
      });

      // Subtopics reveal animation
      if (subtopics) {
        gsap.set(subtopics, { 
          height: "auto",
          opacity: 0,
          y: -20
        });
        
        gsap.to(subtopics, {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "power2.out",
          delay: 0.1
        });

        // Animate each subtopic item
        const subtopicItems = subtopics.querySelectorAll('.subtopic-item');
        gsap.fromTo(subtopicItems, 
          { 
            opacity: 0, 
            x: -20,
            scale: 0.9
          },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 0.3,
            stagger: 0.05,
            ease: "back.out(1.7)",
            delay: 0.2
          }
        );
      }
    } else {
      // Card hover exit animation
      gsap.to(card, {
        scale: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out"
      });

      // Subtopics hide animation
      if (subtopics) {
        gsap.to(subtopics, {
          opacity: 0,
          y: -10,
          duration: 0.2,
          ease: "power2.in",
          onComplete: () => {
            gsap.set(subtopics, { height: 0 });
          }
        });
      }
    }
  };

  const animateCurve = () => {
    // Animate title entrance with elastic effect
    if (titleRef.current) {
      gsap.fromTo(titleRef.current, 
        { 
          opacity: 0, 
          scale: 0.8,
          y: 50 
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1.2,
          ease: "elastic.out(1, 0.5)",
          delay: 0.3
        }
      );
    }

    // Animate main curve path drawing
    if (curveRef.current) {
      const pathLength = curveRef.current.getTotalLength();
      gsap.set(curveRef.current, { 
        strokeDasharray: pathLength,
        strokeDashoffset: pathLength 
      });
      
      gsap.to(curveRef.current, {
        strokeDashoffset: 0,
        duration: 2.5,
        ease: "power2.inOut",
        delay: 1
      });
    }

    // Animate module points with stagger effect
    pointsRef.current.forEach((point, index) => {
      if (point) {
        gsap.fromTo(point, 
          { 
            scale: 0, 
            opacity: 0,
            rotation: -180 
          },
          {
            scale: 1,
            opacity: 1,
            rotation: 0,
            duration: 0.8,
            delay: 1.5 + index * 0.2,
            ease: "back.out(2)",
          }
        );
      }
    });
  };

  // Generate curve data from modules
  const generateCurveData = () => {
    return displayData.coreModules.map((module) => ({
      x: module.cumulativeImpact,
      y: module.cumulativeTime,
      moduleTitle: module.title,
      impact: module.totalImpact,
      time: module.totalTimeToLearn
    }));
  };

  // Create SVG path based on module data
  const createCurvePath = () => {
    const curveData = generateCurveData();
    
    const maxImpact = Math.max(...curveData.map(d => d.x));
    const maxTime = Math.max(...curveData.map(d => d.y));
    const minImpact = Math.min(...curveData.map(d => d.x));
    const minTime = Math.min(...curveData.map(d => d.y));
    
    // Center the curve by scaling to fit available space and centering
    const scaleX = (value: number) => {
      const normalizedValue = (value - minImpact) / (maxImpact - minImpact);
      return horizontalPadding + normalizedValue * availableWidth;
    };
    
    const scaleY = (value: number) => {
      const normalizedValue = (value - minTime) / (maxTime - minTime);
      return svgHeight - verticalPadding - normalizedValue * availableHeight;
    };
    
    // Map data points to SVG coordinates
    const points = curveData.map((point) => ({
      ...point,
      scaledX: scaleX(point.x),
      scaledY: scaleY(point.y)
    }));

    // Generate smooth curve using cubic bezier curves
    let pathData = '';
    if (points.length > 0) {
      pathData = `M ${points[0]!.scaledX} ${points[0]!.scaledY}`;
      
      for (let i = 1; i < points.length; i++) {
        const current = points[i]!;
        const previous = points[i - 1]!;
        const next = points[i + 1];
        
        // Calculate control points for smooth curve
        const tension = 0.4;
        const cp1x = previous.scaledX + (current.scaledX - previous.scaledX) * tension;
        const cp1y = previous.scaledY;
        const cp2x = current.scaledX - (next ? (next.scaledX - current.scaledX) * tension : 0);
        const cp2y = current.scaledY;
        
        pathData += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${current.scaledX} ${current.scaledY}`;
      }
    }

    return { pathData, points };
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse space-y-2">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="animate-pulse space-y-4 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { pathData, points } = createCurvePath();

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Learning Curve Visualization - Exact Replica */}
      <div className="w-full bg-transparent rounded-2xl p-8 relative overflow-hidden">

        {/* Large Curve Title */}
        <div className="text-center mb-12">
          <h1 
            ref={titleRef}
            className="text-6xl md:text-8xl font-bold text-foreground leading-tight opacity-0"
          >
            {displayData.topic}
            <br />
            Learning Curve
          </h1>
        </div>

        {/* SVG Curve Visualization */}
        <div className="relative">
          <svg 
            ref={svgRef}
            width="100%" 
            height="400" 
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full"
          >
            <defs>
              {/* Gray curve background gradient - thicker for background effect */}
              <linearGradient id="curveBackground" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#374151" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#4b5563" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#6b7280" stopOpacity="0.6" />
              </linearGradient>

              {/* Gray curve main line */}
              <linearGradient id="grayCurve" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6b7280" />
                <stop offset="50%" stopColor="#9ca3af" />
                <stop offset="100%" stopColor="#d1d5db" />
              </linearGradient>
              
              {/* Orange highlight gradient with glow */}
              <linearGradient id="orangeHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>

              {/* Glow filter for orange curve */}
              <filter id="orangeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              {/* Shadow filter */}
              <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="8" stdDeviation="8" floodOpacity="0.15" floodColor="#000000"/>
              </filter>
            </defs>

            {/* Invisible wider path for mouse detection */}
            <path
              d={pathData}
              fill="none"
              stroke="transparent"
              strokeWidth="80"
              strokeLinecap="round"
              className="cursor-none"
              onMouseMove={(e) => {
                const rect = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * svgWidth;
                const y = ((e.clientY - rect.top) / rect.height) * svgHeight;
                
                setMousePosition({ x, y });
                
                // Calculate progress along the curve (0 to 1) - adjusted for proper centering
                const progress = Math.max(0, Math.min(1, (x - horizontalPadding) / availableWidth));
                setCurveProgress(progress);
                
                // Update orange curve based on mouse position
                if (orangeCurveRef.current && curveRef.current) {
                  const pathLength = curveRef.current.getTotalLength();
                  const currentLength = pathLength * progress;
                  
                  gsap.to(orangeCurveRef.current, {
                    strokeDasharray: `${currentLength} ${pathLength}`,
                    duration: 0.1,
                    ease: "none"
                  });
                }
              }}
              onMouseLeave={() => {
                setMousePosition(null);
                // Animate orange curve away
                if (orangeCurveRef.current) {
                  gsap.to(orangeCurveRef.current, {
                    strokeDasharray: "0 1000",
                    duration: 0.5,
                    ease: "power2.out"
                  });
                }
              }}
              onMouseEnter={() => {
                // Initialize orange curve
                if (orangeCurveRef.current) {
                  gsap.set(orangeCurveRef.current, {
                    strokeDasharray: "0 1000"
                  });
                }
              }}
            />

            {/* Grey background path - thicker to create background effect along curve only */}
            <path
              d={pathData}
              fill="none"
              stroke="url(#curveBackground)"
              strokeWidth="60"
              strokeLinecap="round"
              opacity="0.4"
              className="pointer-events-none"
            />

            {/* Main gray curve path */}
            <path
              ref={curveRef}
              d={pathData}
              fill="none"
              stroke="url(#grayCurve)"
              strokeWidth="28"
              strokeLinecap="round"
              opacity="0.8"
              filter="url(#dropShadow)"
              className="pointer-events-none"
            />

            {/* Orange curve that follows mouse */}
            <path
              ref={orangeCurveRef}
              d={pathData}
              fill="none"
              stroke="url(#orangeHighlight)"
              strokeWidth="36"
              strokeLinecap="round"
              strokeDasharray="0 1000"
              filter="url(#orangeGlow)"
              className="transition-all duration-100 pointer-events-none"
            />

            {/* Mouse cursor glow effect */}
            {mousePosition && (
              <circle
                cx={mousePosition.x}
                cy={mousePosition.y}
                r="20"
                fill="url(#orangeHighlight)"
                opacity="0.3"
                className="pointer-events-none"
                style={{
                  filter: "blur(8px)"
                }}
              />
            )}

            {/* Custom cursor */}
            {mousePosition && (
              <circle
                cx={mousePosition.x}
                cy={mousePosition.y}
                r="8"
                fill="#f97316"
                className="pointer-events-none"
              />
            )}

            {/* Module Points and Vertical Lines */}
            {displayData.coreModules.map((module, index) => {
              const pos = points[index] ?? { scaledX: 100 + index * 200, scaledY: 200 };
              
              // Check if this point is near the orange curve progress
              const pointProgress = (pos.scaledX - horizontalPadding) / availableWidth;
              const isActivated = curveProgress >= pointProgress - 0.05 && mousePosition;
              
              return (
                <g key={module.id}>
                  {/* Vertical line from curve to label */}
                  <line
                    x1={pos.scaledX}
                    y1={pos.scaledY}
                    x2={pos.scaledX}
                    y2={380}
                    stroke={isActivated ? "#f97316" : "#6b7280"}
                    strokeWidth="2"
                    opacity={isActivated ? "0.8" : "0.6"}
                    className="transition-all duration-300"
                  />
                  
                  {/* Module point on curve */}
                  <circle
                    ref={(el) => {
                      pointsRef.current[index] = el;
                    }}
                    cx={pos.scaledX}
                    cy={pos.scaledY}
                    r={isActivated ? "8" : "6"}
                    fill={isActivated ? "#f97316" : "#ffffff"}
                    stroke={isActivated ? "#f97316" : "#6b7280"}
                    strokeWidth="2"
                    className="transition-all duration-300"
                    filter={isActivated ? "url(#orangeGlow)" : "none"}
                  />
                  
                  {/* Module number and title below the line */}
                  <text
                    x={pos.scaledX}
                    y={395}
                    textAnchor="middle"
                    className={`text-xs font-bold ${isActivated ? 'fill-orange-400' : 'fill-orange-400'} transition-all duration-300`}
                  >
                    {String(index + 1).padStart(3, '0')}
                  </text>
                  <text
                    x={pos.scaledX}
                    y={410}
                    textAnchor="middle"
                    className={`text-sm font-medium ${isActivated ? 'fill-orange-400' : 'fill-foreground'} transition-all duration-300`}
                  >
                    {module.title}
                  </text>
                  
                  {/* Activation pulse effect */}
                  {isActivated && (
                    <circle
                      cx={pos.scaledX}
                      cy={pos.scaledY}
                      r="15"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="2"
                      opacity="0.4"
                      className="animate-pulse"
                    />
                  )}
                </g>
              );
            })}

            {/* Progress indicator */}
            {mousePosition && (
              <text
                x={mousePosition.x}
                y={mousePosition.y - 30}
                textAnchor="middle"
                className="text-sm font-bold fill-orange-400 pointer-events-none"
              >
                {Math.round(curveProgress * 100)}%
              </text>
            )}
          </svg>
        </div>

        {/* Core Module Cards Below Curve */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-16">
          {displayData.coreModules.map((module, index) => {
            return (
              <div 
                key={module.id} 
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                className="text-foreground cursor-pointer transition-all duration-300 hover:shadow-lg rounded-lg p-4 border border-transparent hover:border-orange-200 bg-card"
                onMouseEnter={() => {
                  animateCardHover(index, true);
                }}
                onMouseLeave={() => {
                  animateCardHover(index, false);
                }}
              >
                <div className="mb-4">
                  <div className="text-sm font-bold text-orange-400 mb-1">
                    {String(index + 1).padStart(3, '0')}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {module.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {module.description}
                  </p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>Time: {module.totalTimeToLearn}h</div>
                    <div>Impact: {module.totalImpact}</div>
                    <div>Steepness: {module.steepness.toFixed(1)}</div>
                  </div>
                </div>

                {/* Subtopics Section - Initially Hidden */}
                {module.subModules && module.subModules.length > 0 && (
                  <div 
                    ref={(el) => {
                      subtopicsRefs.current[index] = el;
                    }}
                    className="overflow-hidden"
                    style={{ height: 0, opacity: 0 }}
                  >
                    <div className="border-t border-orange-200 pt-3 mt-3">
                      <h4 className="text-sm font-semibold text-orange-400 mb-2">
                        Learning Outcomes:
                      </h4>
                      <div className="space-y-2">
                        {module.subModules.map((subModule, _subIndex) => (
                          <div 
                            key={subModule.id} 
                            className="subtopic-item bg-orange-50 dark:bg-orange-900/20 rounded-md p-2 border-l-2 border-orange-400"
                          >
                            <div className="text-xs font-medium text-foreground mb-1">
                              {subModule.title}
                            </div>
                            <div className="text-xs text-muted-foreground mb-1">
                              {subModule.description}
                            </div>
                            <div className="flex justify-between text-xs text-orange-600 dark:text-orange-400">
                              <span>{subModule.timeToLearn}h</span>
                              <span>Impact: {subModule.impact}/10</span>
                            </div>
                            {subModule.learningOutcomes && subModule.learningOutcomes.length > 0 && (
                              <div className="mt-1">
                                <div className="text-xs font-medium text-muted-foreground mb-1">Outcomes:</div>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                  {subModule.learningOutcomes.slice(0, 2).map((outcome, outcomeIndex) => (
                                    <li key={outcomeIndex} className="flex items-start">
                                      <span className="text-orange-400 mr-1">•</span>
                                      <span>{outcome}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default LearningCurveDisplay;
