"use client";

import { useState, useEffect, useRef } from "react";
import type { ReactElement } from "react";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
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
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<TopicNode[]>([]);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 600 });

  useEffect(() => {
    if (!roadmap) return;
    
    const calculatedNodes = calculateNodePositions(roadmap);
    setNodes(calculatedNodes);
    
    // Calculate viewBox to fit all nodes
    if (calculatedNodes.length > 0) {
      const padding = 150;
      const minX = Math.min(...calculatedNodes.map(n => n.position.x)) - padding;
      const maxX = Math.max(...calculatedNodes.map(n => n.position.x)) + padding;
      const minY = Math.min(...calculatedNodes.map(n => n.position.y)) - padding;
      const maxY = Math.max(...calculatedNodes.map(n => n.position.y)) + padding;
      
      setViewBox({
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      });
    }
  }, [roadmap]);

  const calculateNodePositions = (roadmap: Roadmap): TopicNode[] => {
    const nodes: TopicNode[] = [];
    const levelRadius = [0, 250, 400, 550, 700]; // Distance from center for each level
    const centerX = 0;
    const centerY = 0;

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

  const renderConnections = (): ReactElement[] => {
    const connections: ReactElement[] = [];
    
    // Add connections from root to root topics
    roadmap.rootTopics.forEach(rootTopicId => {
      const rootTopicNode = nodes.find(n => n.id === rootTopicId);
      const rootNode = nodes.find(n => n.id === 'root');
      if (rootTopicNode && rootNode) {
        const isHighlighted = selectedTopic?.id === 'root' || selectedTopic?.id === rootTopicId;
        connections.push(
          <line
            key={`root-${rootTopicId}`}
            x1={rootNode.position.x}
            y1={rootNode.position.y}
            x2={rootTopicNode.position.x}
            y2={rootTopicNode.position.y}
            stroke={isHighlighted ? "#3b82f6" : "#6b7280"}
            strokeWidth={isHighlighted ? 4 : 3}
            strokeOpacity={isHighlighted ? 0.9 : 0.7}
            className="transition-all duration-300"
          />
        );
      }
    });
    
    // Add connections based on parent-child relationships from the roadmap data
    roadmap.topics.forEach(topic => {
      if (topic.parentId) {
        const parentNode = nodes.find(n => n.id === topic.parentId);
        const childNode = nodes.find(n => n.id === topic.id);
        
        if (parentNode && childNode) {
          const isHighlighted = selectedTopic?.id === topic.parentId || selectedTopic?.id === topic.id;
          const strokeDashArray = topic.level > 1 ? "5,5" : "none";
          
          connections.push(
            <line
              key={`${topic.parentId}-${topic.id}`}
              x1={parentNode.position.x}
              y1={parentNode.position.y}
              x2={childNode.position.x}
              y2={childNode.position.y}
              stroke={isHighlighted ? "#3b82f6" : "#6b7280"}
              strokeWidth={isHighlighted ? 3 : 2}
              strokeOpacity={isHighlighted ? 0.8 : 0.6}
              className="transition-all duration-300"
              strokeDasharray={strokeDashArray}
            />
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
      const fontSize = isRoot ? "16" : size > 60 ? "14" : size > 50 ? "12" : size > 40 ? "10" : "9";
      
      return (
        <g key={node.id} className="cursor-pointer group">
          {/* Drop shadow for nodes */}
          <circle
            cx={node.position.x + 3}
            cy={node.position.y + 3}
            r={size / 2}
            fill="rgba(0,0,0,0.15)"
            className="transition-all duration-300"
          />
          
          {/* Node circle with gradient */}
          <defs>
            <radialGradient id={`gradient-${node.id}`} cx="30%" cy="30%">
              <stop offset="0%" stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor={color} stopOpacity="0.8" />
            </radialGradient>
          </defs>
          
          <circle
            cx={node.position.x}
            cy={node.position.y}
            r={size / 2}
            fill={`url(#gradient-${node.id})`}
            stroke={isSelected ? '#1f2937' : 'white'}
            strokeWidth={isSelected ? 4 : 2}
            className="transition-all duration-300 group-hover:stroke-gray-800 group-hover:stroke-4 group-hover:scale-110"
            onClick={() => onTopicSelect(node)}
            style={{ transformOrigin: `${node.position.x}px ${node.position.y}px` }}
          />
          
          {/* Level indicator for non-root nodes */}
          {!isRoot && (
            <circle
              cx={node.position.x + size/3}
              cy={node.position.y - size/3}
              r="8"
              fill="rgba(255,255,255,0.9)"
              stroke={color}
              strokeWidth="2"
              className="transition-all duration-300"
            />
          )}
          
          {/* Level number */}
          {!isRoot && (
            <text
              x={node.position.x + size/3}
              y={node.position.y - size/3}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={color}
              fontSize="10"
              fontWeight="bold"
              className="pointer-events-none select-none"
            >
              {level}
            </text>
          )}
          
          {/* Node text */}
          <text
            x={node.position.x}
            y={node.position.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={fontSize}
            fontWeight="bold"
            className="pointer-events-none select-none transition-all duration-300 drop-shadow-sm"
            onClick={() => onTopicSelect(node)}
          >
            {displayTitle}
          </text>
          
          {/* Enhanced hover tooltip */}
          <foreignObject
            x={node.position.x - 120}
            y={node.position.y - size/2 - 70}
            width="240"
            height="60"
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
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
          </foreignObject>
        </g>
      );
    });
  };

  return (
    <div className="w-full h-[700px] border rounded-lg bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-800 overflow-hidden relative">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      </div>
      {/* Legend */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="p-3 shadow-lg">
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-300">Learning Path Levels</div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-xs">Main Topic</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs">Level 0 - Foundation</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-xs">Level 1 - Core Skills</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-xs">Level 2 - Advanced</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-violet-500"></div>
              <span className="text-xs">Level 3+ - Specialized</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Difficulty badge */}
      <div className="absolute top-4 right-4 z-10">
        <Badge variant="outline" className="bg-white/90 dark:bg-slate-800/90">
          {roadmap.difficulty}
        </Badge>
      </div>

      {/* SVG Mindmap */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        className="transition-all duration-500"
        style={{ cursor: 'grab' }}
      >
        {/* Background grid */}
        <defs>
          <pattern
            id="grid"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="#e5e7eb"
              strokeOpacity="0.3"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect
          x={viewBox.x}
          y={viewBox.y}
          width={viewBox.width}
          height={viewBox.height}
          fill="url(#grid)"
        />
        
        {/* Render connections first (behind nodes) */}
        {renderConnections()}
        
        {/* Render nodes */}
        {renderNodes()}
      </svg>

      {/* Instructions and Stats */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="p-3 shadow-lg">
          <div className="space-y-1">
            <div className="text-xs text-gray-600 dark:text-gray-300">
              Click any node to see details • {nodes.length - 1} learning topics
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Foundation: {roadmap.topics.filter(t => t.level === 0).length} • 
              Core: {roadmap.topics.filter(t => t.level === 1).length} • 
              Advanced: {roadmap.topics.filter(t => t.level >= 2).length}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
