"use client";

import { useState, useEffect, useRef } from "react";
import type { ReactElement } from "react";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { RotateCcw, ZoomIn, ZoomOut, Hand, MousePointer } from "lucide-react";
import type { Roadmap, Topic } from "~/course-builder-ai/roadmap";

interface CustomMindmapProps {
  roadmap: Roadmap;
  onTopicSelect: (topic: Topic) => void;
  selectedTopic?: Topic | null;
}

interface Position {
  x: number;
  y: number;
}

interface TopicNode extends Topic {
  position: Position;
  depth: number;
}

export default function CustomMindmap({ roadmap, onTopicSelect, selectedTopic }: CustomMindmapProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<TopicNode[]>([]);
  // Initialize canvas position to center the mindmap content (which is at 5000,5000) in the viewport
  const [position, setPosition] = useState({ x: -5000, y: -5000 });
  const [scale, setScale] = useState(1);
  const [toolMode, setToolMode] = useState<'select' | 'hand'>('select');
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!roadmap) return;
    
    const calculatedNodes = calculateNodePositions(roadmap);
    setNodes(calculatedNodes);
    
    // Center the canvas on the content initially
    if (calculatedNodes.length > 0) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      // Since mindmap is positioned at 5000,5000, we need to offset by -5000 to center it
      setPosition({ x: centerX - 5000, y: centerY - 5000 });
    }
  }, [roadmap]);

  // Canvas event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (toolMode === 'hand' || (toolMode === 'select' && (e.target as Element).classList.contains('canvas-background'))) {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleAmount = e.deltaY > 0 ? 0.95 : 1.05;
    setScale(prev => Math.min(Math.max(prev * scaleAmount, 0.1), 5));
  };

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Control functions
  const resetView = () => {
    if (nodes.length > 0) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      // Since mindmap is positioned at 5000,5000, we need to offset by -5000 to center it
      setPosition({ x: centerX - 5000, y: centerY - 5000 });
      setScale(1);
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev * 1.25, 5));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev * 0.8, 0.1));
  };

  const calculateNodePositions = (roadmap: Roadmap): TopicNode[] => {
    const nodes: TopicNode[] = [];
    const levelRadius = [0, 250, 400, 550, 700]; // Distance from center for each level
    // Position the mindmap at the center of the large canvas so it appears centered in the viewport
    const centerX = 5000; // Half of the 10000px canvas width
    const centerY = 5000; // Half of the 10000px canvas height

    // Create root node
    const rootNode: TopicNode = {
      id: 'root',
      title: roadmap.title,
      summary: roadmap.description,
      level: -1,
      parentId: undefined,
      children: roadmap.rootTopics,
      position: { x: centerX, y: centerY },
      depth: 0
    };
    nodes.push(rootNode);

    // Create a map for quick topic lookup (for future enhancements)
    // const topicMap = new Map(roadmap.topics.map(topic => [topic.id, topic]));

    // Process all topics by their actual level from the roadmap
    const processTopicsByLevel = () => {
      // Group topics by their level
      const topicsByLevel = new Map<number, Topic[]>();
      roadmap.topics.forEach(topic => {
        if (!topicsByLevel.has(topic.level)) {
          topicsByLevel.set(topic.level, []);
        }
        topicsByLevel.get(topic.level)!.push(topic);
      });

      // Process each level in order
      const maxLevel = Math.max(...roadmap.topics.map(t => t.level));
      
      for (let level = 0; level <= maxLevel; level++) {
        const topicsAtLevel = topicsByLevel.get(level) ?? [];
        
        topicsAtLevel.forEach((topic, topicIndex) => {
          let position: Position;
          
          if (level === 0) {
            // Root topics - arrange in circle around center
            const angle = (topicIndex / topicsAtLevel.length) * 2 * Math.PI;
            const radius = levelRadius[1] ?? 250;
            position = {
              x: centerX + radius * Math.cos(angle),
              y: centerY + radius * Math.sin(angle)
            };
          } else {
            // Child topics - position relative to parent
            const parent = nodes.find(n => n.id === topic.parentId);
            if (parent) {
              // Find siblings (other children of the same parent)
              const siblings = topicsAtLevel.filter(t => t.parentId === topic.parentId);
              const siblingIndex = siblings.findIndex(s => s.id === topic.id);
              const numSiblings = siblings.length;
              
              // Calculate position based on parent position and sibling arrangement
              const parentAngle = Math.atan2(parent.position.y - centerY, parent.position.x - centerX);
              const angleSpread = Math.PI / 3; // 60 degrees spread for children
              const startAngle = parentAngle - angleSpread / 2;
              const angleStep = numSiblings > 1 ? angleSpread / (numSiblings - 1) : 0;
              const childAngle = startAngle + (angleStep * siblingIndex);
              
              const radius = levelRadius[Math.min(level + 1, levelRadius.length - 1)] ?? (300 + level * 150);
              position = {
                x: centerX + radius * Math.cos(childAngle),
                y: centerY + radius * Math.sin(childAngle)
              };
            } else {
              // Fallback positioning if parent not found
              const angle = (topicIndex / topicsAtLevel.length) * 2 * Math.PI;
              const radius = levelRadius[Math.min(level + 1, levelRadius.length - 1)] ?? (300 + level * 150);
              position = {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
              };
            }
          }
          
          const topicNode: TopicNode = {
            ...topic,
            position,
            depth: level + 1 // Adjust depth to account for root node
          };
          
          nodes.push(topicNode);
        });
      }
    };

    processTopicsByLevel();
    return nodes;
  };

  const getNodeColor = (node: TopicNode): string => {
    if (node.id === 'root') return '#3b82f6'; // blue-500
    
    // Use different colors based on actual level from roadmap
    const level = node.level ?? node.depth;
    const colors = [
      '#ef4444', // red-500 - Level 0 (Foundation topics)
      '#f59e0b', // amber-500 - Level 1 (Core skills)
      '#10b981', // emerald-500 - Level 2 (Advanced topics)
      '#8b5cf6', // violet-500 - Level 3+
      '#ec4899', // pink-500
      '#06b6d4', // cyan-500
    ];
    
    return colors[level] ?? colors[colors.length - 1] ?? '#6b7280';
  };

  const getNodeSize = (node: TopicNode): number => {
    if (node.id === 'root') return 90; // Larger root node
    
    // Size based on actual level from roadmap
    const level = node.level ?? node.depth;
    if (level === 0) return 70; // Foundation topics
    if (level === 1) return 55; // Core skills
    if (level === 2) return 45; // Advanced topics
    return 35; // Specialized topics
  };

  const renderConnections = () => {
    const connections: ReactElement[] = [];
    
    // Add connections from root to root topics
    roadmap.rootTopics.forEach(rootTopicId => {
      const rootTopicNode = nodes.find(n => n.id === rootTopicId);
      const rootNode = nodes.find(n => n.id === 'root');
      if (rootTopicNode && rootNode) {
        const isHighlighted = selectedTopic?.id === 'root' || selectedTopic?.id === rootTopicId;
        const x1 = rootNode.position.x;
        const y1 = rootNode.position.y;
        const x2 = rootTopicNode.position.x;
        const y2 = rootTopicNode.position.y;
        
        connections.push(
          <div
            key={`root-${rootTopicId}`}
            className="absolute pointer-events-none transition-all duration-300"
            style={{
              left: Math.min(x1, x2),
              top: Math.min(y1, y2),
              width: Math.abs(x2 - x1),
              height: Math.abs(y2 - y1),
            }}
          >
            <svg
              width="100%"
              height="100%"
              style={{ overflow: 'visible' }}
            >
              <line
                x1={x1 < x2 ? 0 : Math.abs(x2 - x1)}
                y1={y1 < y2 ? 0 : Math.abs(y2 - y1)}
                x2={x1 < x2 ? Math.abs(x2 - x1) : 0}
                y2={y1 < y2 ? Math.abs(y2 - y1) : 0}
                stroke={isHighlighted ? "#60a5fa" : "#9ca3af"}
                strokeWidth={isHighlighted ? 4 : 3}
                strokeOpacity={isHighlighted ? 0.9 : 0.7}
              />
            </svg>
          </div>
        );
      }
    });
    
    // Add connections based on parent-child relationships
    roadmap.topics.forEach(topic => {
      if (topic.parentId) {
        const parentNode = nodes.find(n => n.id === topic.parentId);
        const childNode = nodes.find(n => n.id === topic.id);
        
        if (parentNode && childNode) {
          const isHighlighted = selectedTopic?.id === topic.parentId || selectedTopic?.id === topic.id;
          const x1 = parentNode.position.x;
          const y1 = parentNode.position.y;
          const x2 = childNode.position.x;
          const y2 = childNode.position.y;
          
          connections.push(
            <div
              key={`${topic.parentId}-${topic.id}`}
              className="absolute pointer-events-none transition-all duration-300"
              style={{
                left: Math.min(x1, x2),
                top: Math.min(y1, y2),
                width: Math.abs(x2 - x1),
                height: Math.abs(y2 - y1),
              }}
            >
              <svg
                width="100%"
                height="100%"
                style={{ overflow: 'visible' }}
              >
                <line
                  x1={x1 < x2 ? 0 : Math.abs(x2 - x1)}
                  y1={y1 < y2 ? 0 : Math.abs(y2 - y1)}
                  x2={x1 < x2 ? Math.abs(x2 - x1) : 0}
                  y2={y1 < y2 ? Math.abs(y2 - y1) : 0}
                  stroke={isHighlighted ? "#60a5fa" : "#9ca3af"}
                  strokeWidth={isHighlighted ? 3 : 2}
                  strokeOpacity={isHighlighted ? 0.8 : 0.6}
                  strokeDasharray={topic.level > 1 ? "5,5" : "none"}
                />
              </svg>
            </div>
          );
        }
      }
    });
    
    return connections;
  };

  const renderNodes = () => {
    return nodes.map(node => {
      const size = getNodeSize(node);
      const color = getNodeColor(node);
      const isSelected = selectedTopic?.id === node.id;
      const isRoot = node.id === 'root';
      const level = node.level ?? node.depth;
      
      // Better text handling for long titles
      const maxLength = size > 60 ? 25 : size > 50 ? 20 : 15;
      const displayTitle = node.title.length > maxLength ? `${node.title.substring(0, maxLength - 3)}...` : node.title;
      const fontSize = isRoot ? 16 : size > 60 ? 14 : size > 50 ? 12 : size > 40 ? 10 : 9;
      
      return (
        <div
          key={node.id}
          className="absolute group transition-all duration-300"
          style={{
            left: node.position.x - size / 2,
            top: node.position.y - size / 2,
            width: size,
            height: size,
            cursor: toolMode === 'select' ? 'pointer' : toolMode === 'hand' ? 'grab' : 'default'
          }}
          onClick={(e) => {
            if (toolMode === 'select') {
              e.stopPropagation();
              onTopicSelect(node);
            }
          }}
        >
          {/* Drop shadow */}
          <div
            className="absolute transition-all duration-300"
            style={{
              left: 3,
              top: 3,
              width: size,
              height: size,
              borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.15)',
            }}
          />
          
          {/* Main node circle */}
          <div
            className="absolute flex items-center justify-center text-white font-bold transition-all duration-300 group-hover:scale-110"
            style={{
              width: size,
              height: size,
              borderRadius: '50%',
              background: `radial-gradient(circle at 30% 30%, ${color}, ${color}cc)`,
              border: `${isSelected ? 4 : 2}px solid ${isSelected ? '#f3f4f6' : 'white'}`,
              fontSize: `${fontSize}px`,
              textAlign: 'center',
              lineHeight: '1.2',
              padding: '4px',
              boxSizing: 'border-box',
              transformOrigin: 'center',
            }}
          >
            {displayTitle}
          </div>
          
          {/* Level indicator for non-root nodes */}
          {!isRoot && (
            <div
              className="absolute flex items-center justify-center text-xs font-bold transition-all duration-300"
              style={{
                right: 0,
                top: 0,
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.9)',
                border: `2px solid ${color}`,
                color: color,
              }}
            >
              {level}
            </div>
          )}
          
          {/* Tooltip */}
          {toolMode === 'select' && (
            <div
              className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50"
              style={{
                left: -120 + size / 2,
                top: -70,
                width: 240,
                height: 60,
              }}
            >
              <div className="bg-gray-900 text-white text-sm px-4 py-3 rounded-lg shadow-xl border border-gray-700">
                <div className="font-semibold text-white mb-1">{node.title}</div>
                <div className="text-xs text-gray-300 mb-1">Level {level} • {node.children?.length ?? 0} subtopics</div>
                {node.summary && (
                  <div className="text-xs text-gray-400 line-clamp-2">
                    {node.summary.length > 80 ? `${node.summary.substring(0, 80)}...` : node.summary}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="w-full h-full bg-black overflow-hidden relative">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.2),transparent_50%)]"></div>
      </div>
      
      {/* Legend */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="p-3 shadow-lg bg-gray-900/95 border-gray-700 backdrop-blur-sm">
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-200">Learning Path Levels</div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-xs text-gray-300">Main Topic</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-300">Level 0 - Foundation</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-xs text-gray-300">Level 1 - Core Skills</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-gray-300">Level 2 - Advanced</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-violet-500"></div>
              <span className="text-xs text-gray-300">Level 3+ - Specialized</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Control Panel */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <Badge variant="outline" className="bg-gray-900/95 border-gray-700 text-gray-200 backdrop-blur-sm">
          {roadmap.difficulty}
        </Badge>
        <Card className="p-2 shadow-lg bg-gray-900/95 border-gray-700 backdrop-blur-sm">
          <div className="flex flex-col space-y-1">
            {/* Tool Mode Toggle */}
            <div className="flex space-x-1 mb-2 p-1 bg-gray-800/50 rounded">
              <Button
                variant={toolMode === 'select' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setToolMode('select')}
                className="h-6 w-6 p-0 text-xs"
                title="Select Tool"
              >
                <MousePointer className="h-3 w-3" />
              </Button>
              <Button
                variant={toolMode === 'hand' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setToolMode('hand')}
                className="h-6 w-6 p-0 text-xs"
                title="Hand Tool (Drag to Pan)"
              >
                <Hand className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Zoom Controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetView}
              className="h-8 w-8 p-0 hover:bg-gray-700 text-gray-300"
              title="Reset View"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomIn}
              className="h-8 w-8 p-0 hover:bg-gray-700 text-gray-300"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomOut}
              className="h-8 w-8 p-0 hover:bg-gray-700 text-gray-300"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Infinite Canvas */}
      <div
        className="canvas-background absolute inset-0"
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        style={{
          cursor: isDragging.current ? 'grabbing' : toolMode === 'hand' ? 'grab' : 'default',
          overflow: 'hidden',
        }}
      >
        <div
          ref={canvasRef}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            position: 'relative',
            width: '10000px',
            height: '10000px',
            backgroundImage: `
              linear-gradient(rgba(107, 114, 128, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(107, 114, 128, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            backgroundPosition: '0 0, 0 0',
          }}
        >
          {/* Render connections */}
          {renderConnections()}
          
          {/* Render nodes */}
          {renderNodes()}
        </div>
      </div>

      {/* Instructions and Stats */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="p-3 shadow-lg bg-gray-900/95 border-gray-700 backdrop-blur-sm">
          <div className="space-y-1">
            <div className="text-xs text-gray-300">
              {toolMode === 'select' ? 'Click nodes to see details • Use hand tool to drag canvas' : 'Drag to pan the canvas • Switch to select tool to click nodes'} • Scroll to zoom
            </div>
            <div className="text-xs text-gray-400">
              Foundation: {roadmap.topics.filter(t => t.level === 0).length} • 
              Core: {roadmap.topics.filter(t => t.level === 1).length} • 
              Advanced: {roadmap.topics.filter(t => t.level >= 2).length} topics
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
