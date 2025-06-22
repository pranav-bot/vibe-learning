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
    const newScale = Math.min(Math.max(scale * scaleAmount, 0.1), 5);
    
    // Calculate zoom towards the mindmap center (5000, 5000)
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Transform mouse position to canvas coordinates
    const canvasMouseX = (mouseX - position.x) / scale;
    const canvasMouseY = (mouseY - position.y) / scale;
    
    // Calculate new position to zoom towards mindmap center
    const mindmapCenterX = 5000;
    const mindmapCenterY = 5000;
    
    // Adjust position to zoom towards mindmap center
    const newX = position.x - (mindmapCenterX - canvasMouseX) * (newScale - scale);
    const newY = position.y - (mindmapCenterY - canvasMouseY) * (newScale - scale);
    
    setPosition({ x: newX, y: newY });
    setScale(newScale);
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
    // Base radii for each level - these will be adjusted for collision avoidance
    const levelRadii = [0, 250, 400, 600, 800];
    const minNodeSpacing = 60; // Minimum space between node edges
    // Position the mindmap at the center of the large canvas so it appears centered in the viewport
    const centerX = 5000; // Half of the 10000px canvas width
    const centerY = 5000; // Half of the 10000px canvas height

    // Helper function to calculate node size (same logic as getNodeSize but accessible here)
    const calculateNodeSize = (title: string, level: number, isRoot = false): { width: number; height: number } => {
      const baseWidth = isRoot ? 160 : level === 0 ? 140 : level === 1 ? 120 : level === 2 ? 100 : 90;
      const baseHeight = isRoot ? 60 : level === 0 ? 50 : level === 1 ? 45 : level === 2 ? 40 : 35;
      const titleLength = title.length;
      const minWidth = baseWidth;
      const textWidth = Math.max(minWidth, titleLength * 8 + 20);
      return {
        width: Math.min(textWidth, baseWidth * 1.5),
        height: baseHeight
      };
    };

    // Helper function to check if two rectangular nodes collide
    const nodesCollide = (pos1: Position, size1: { width: number; height: number }, 
                         pos2: Position, size2: { width: number; height: number }): boolean => {
      const margin = minNodeSpacing / 2;
      return Math.abs(pos1.x - pos2.x) < (size1.width + size2.width) / 2 + margin &&
             Math.abs(pos1.y - pos2.y) < (size1.height + size2.height) / 2 + margin;
    };

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
            // Root topics - arrange in circle around center with collision avoidance
            const baseRadius = levelRadii[1] ?? 300;
            let attempts = 0;
            let radius = baseRadius;
            
            do {
              const angle = (topicIndex / topicsAtLevel.length) * 2 * Math.PI;
              position = {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
              };
              
              // Check for collisions with existing nodes
              const nodeSize = calculateNodeSize(topic.title, topic.level);
              const hasCollision = nodes.some(existingNode => {
                const existingSize = calculateNodeSize(existingNode.title, existingNode.level ?? existingNode.depth, existingNode.id === 'root');
                return nodesCollide(position, nodeSize, existingNode.position, existingSize);
              });
              
              if (!hasCollision) break;
              
              // Increase radius to avoid collision
              radius += 40;
              attempts++;
            } while (attempts < 10);
            
          } else {
            // Child topics - position relative to parent with collision avoidance
            const parent = nodes.find(n => n.id === topic.parentId);
            if (parent) {
              // Find siblings (other children of the same parent)
              const siblings = topicsAtLevel.filter(t => t.parentId === topic.parentId);
              const siblingIndex = siblings.findIndex(s => s.id === topic.id);
              const numSiblings = siblings.length;
              
              // Calculate position based on parent position and sibling arrangement
              const parentAngle = Math.atan2(parent.position.y - centerY, parent.position.x - centerX);
              const angleSpread = Math.PI; // 180 degrees spread for better spacing
              const startAngle = parentAngle - angleSpread / 2;
              const angleStep = numSiblings > 1 ? angleSpread / (numSiblings - 1) : 0;
              const childAngle = startAngle + (angleStep * siblingIndex);
              
              let attempts = 0;
              let radius = levelRadii[Math.min(level + 1, levelRadii.length - 1)] ?? (350 + level * 150);
              
              do {
                position = {
                  x: centerX + radius * Math.cos(childAngle),
                  y: centerY + radius * Math.sin(childAngle)
                };
                
                // Check for collisions with existing nodes
                const nodeSize = calculateNodeSize(topic.title, topic.level);
                const hasCollision = nodes.some(existingNode => {
                  const existingSize = calculateNodeSize(existingNode.title, existingNode.level ?? existingNode.depth, existingNode.id === 'root');
                  return nodesCollide(position, nodeSize, existingNode.position, existingSize);
                });
                
                if (!hasCollision) break;
                
                // Increase radius to avoid collision
                radius += 40;
                attempts++;
              } while (attempts < 10);
              
            } else {
              // Fallback positioning if parent not found with collision avoidance
              let attempts = 0;
              let radius = levelRadii[Math.min(level + 1, levelRadii.length - 1)] ?? (350 + level * 150);
              
              do {
                const angle = (topicIndex / topicsAtLevel.length) * 2 * Math.PI;
                position = {
                  x: centerX + radius * Math.cos(angle),
                  y: centerY + radius * Math.sin(angle)
                };
                
                // Check for collisions
                const nodeSize = calculateNodeSize(topic.title, topic.level);
                const hasCollision = nodes.some(existingNode => {
                  const existingSize = calculateNodeSize(existingNode.title, existingNode.level ?? existingNode.depth, existingNode.id === 'root');
                  return nodesCollide(position, nodeSize, existingNode.position, existingSize);
                });
                
                if (!hasCollision) break;
                
                radius += 40;
                attempts++;
              } while (attempts < 10);
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

  const getNodeSize = (node: TopicNode): { width: number; height: number } => {
    const isRoot = node.id === 'root';
    const level = node.level ?? node.depth;
    
    // Calculate size based on text content and level
    const baseWidth = isRoot ? 160 : level === 0 ? 140 : level === 1 ? 120 : level === 2 ? 100 : 90;
    const baseHeight = isRoot ? 60 : level === 0 ? 50 : level === 1 ? 45 : level === 2 ? 40 : 35;
    
    // Adjust width based on text length
    const titleLength = node.title.length;
    const minWidth = baseWidth;
    const textWidth = Math.max(minWidth, titleLength * 8 + 20); // Approximate character width
    
    return {
      width: Math.min(textWidth, baseWidth * 1.5), // Cap the maximum width
      height: baseHeight
    };
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
      const nodeSize = getNodeSize(node);
      const color = getNodeColor(node);
      const isSelected = selectedTopic?.id === node.id;
      const isRoot = node.id === 'root';
      const level = node.level ?? node.depth;
      
      // Better text handling for rectangles
      const fontSize = isRoot ? 14 : nodeSize.width > 120 ? 12 : nodeSize.width > 100 ? 11 : 10;
      
      return (
        <div
          key={node.id}
          className="absolute group transition-all duration-300"
          style={{
            left: node.position.x - nodeSize.width / 2,
            top: node.position.y - nodeSize.height / 2,
            width: nodeSize.width,
            height: nodeSize.height,
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
              width: nodeSize.width,
              height: nodeSize.height,
              borderRadius: '8px',
              backgroundColor: 'rgba(0,0,0,0.15)',
            }}
          />
          
          {/* Main node rectangle */}
          <div
            className="absolute flex items-center justify-center text-white font-medium transition-all duration-300 group-hover:scale-105"
            style={{
              width: nodeSize.width,
              height: nodeSize.height,
              borderRadius: '8px',
              background: `linear-gradient(135deg, ${color}, ${color}dd)`,
              border: `${isSelected ? 3 : 2}px solid ${isSelected ? '#f3f4f6' : 'white'}`,
              fontSize: `${fontSize}px`,
              textAlign: 'center',
              lineHeight: '1.3',
              padding: '6px 8px',
              boxSizing: 'border-box',
              transformOrigin: 'center',
              wordBreak: 'break-word',
              hyphens: 'auto',
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              {node.title}
            </div>
          </div>
          
          {/* Level indicator for non-root nodes */}
          {!isRoot && (
            <div
              className="absolute flex items-center justify-center text-xs font-bold transition-all duration-300"
              style={{
                right: -6,
                top: -6,
                width: 18,
                height: 18,
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.95)',
                border: `2px solid ${color}`,
                color: color,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
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
                left: -120 + nodeSize.width / 2,
                top: -80,
                width: 260,
                minHeight: 70,
              }}
            >
              <div className="bg-gray-900 text-white text-sm px-4 py-3 rounded-lg shadow-xl border border-gray-700">
                <div className="font-semibold text-white mb-1">{node.title}</div>
                <div className="text-xs text-gray-300 mb-1">Level {level} • {node.children?.length ?? 0} subtopics</div>
                {node.summary && (
                  <div className="text-xs text-gray-400 line-clamp-3">
                    {node.summary.length > 120 ? `${node.summary.substring(0, 120)}...` : node.summary}
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
            <div className="text-xs font-medium text-gray-200">Roadmap Levels</div>
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
