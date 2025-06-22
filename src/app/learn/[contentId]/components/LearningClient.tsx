'use client';

import { useState, useEffect, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { Slider } from "~/components/ui/slider";
import { ArrowLeft, MessageSquare, X, GraduationCap } from "lucide-react";
import Link from "next/link";
import ThemeToggle from "~/components/ThemeToggle";
import { PDFViewer } from "./PDFViewer";
import { VideoPlayer } from "./VideoPlayer";
import { WebsiteViewer } from "./WebsiteViewer";
import { ChatPanel } from "./ChatPanel";
import { type ContentType } from "~/components/ContentUploader";
import { type CommandAction } from "~/lib/conversational-command-parser";
import { env } from "~/env";

interface ContentData {
  content_id: string;
  content_type: ContentType;
  title: string;
  file_size?: number;
  url?: string;
  text_length: number;
  text_preview: string;
  status: string;
}

interface LearningClientProps {
  contentId: string;
}

// Difficulty levels configuration
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

interface DifficultyConfig {
  level: DifficultyLevel;
  label: string;
  emoji: string;
  description: string;
  audience: string;
  aiInstructions: string;
}

const DIFFICULTY_LEVELS: Record<DifficultyLevel, DifficultyConfig> = {
  beginner: {
    level: 'beginner',
    label: 'High School',
    emoji: '🟢',
    description: 'High School Level',
    audience: 'Ages 14-18',
    aiInstructions: 'Simplify language, basic definitions, no jargon, examples with real-world analogies'
  },
  intermediate: {
    level: 'intermediate',
    label: 'Undergrad / College',
    emoji: '🔵',
    description: 'College Level',
    audience: 'B.Sc. / B.A. level',
    aiInstructions: 'Use technical terms, light math, reference core concepts, slightly deeper problem sets'
  },
  advanced: {
    level: 'advanced',
    label: 'Graduate',
    emoji: '🟠',
    description: 'Graduate Level',
    audience: 'M.Sc. / PhD coursework',
    aiInstructions: 'Include proofs, derivations, cross-discipline connections, complex problem sets'
  },
  expert: {
    level: 'expert',
    label: 'Expert / Research',
    emoji: '🔴',
    description: 'Research Level',
    audience: 'Domain professionals',
    aiInstructions: 'Deep theory, original research papers, latest findings, very complex problem sets, model edge cases'
  }
};

const DIFFICULTY_ORDER: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];

export function LearningClient({ contentId }: LearningClientProps) {
  const [contentData, setContentData] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');
  const [availableTopics, setAvailableTopics] = useState<{ topics: { topic_name: string; topic_page_start: number; topic_page_end: number; topic_summary: string; }[] } | null>(null);
  const [topicsLoading, setTopicsLoading] = useState(false);

  // Remove unused contentId parameter warning by using it
  console.debug('LearningClient initialized for content:', contentId);

  const fetchContentData = useCallback(async () => {
    try {
      // First check localStorage for recently uploaded content
      const storedData = localStorage.getItem(`content_${contentId}`);
      if (storedData) {
        const data = JSON.parse(storedData) as ContentData;
        setContentData(data);
        setLoading(false);
        return;
      }

      // Try to fetch from backend
      const response = await fetch(`${env.NEXT_PUBLIC_BACKEND_URL}/content/${contentId}`);
      if (response.ok) {
        const data = await response.json() as ContentData;
        setContentData(data);
      } else {
        // For now, create mock data based on contentId since backend doesn't store data
        setContentData({
          content_id: contentId,
          content_type: getMockContentType(contentId),
          title: getMockTitle(contentId),
          text_length: 1500,
          text_preview: "Sample content for learning and analysis.",
          status: "ready",
          url: getMockUrl(contentId)
        });
      }
    } catch (err) {
      console.error("Failed to fetch content:", err);
      // Create mock data for demo
      setContentData({
        content_id: contentId,
        content_type: getMockContentType(contentId),
        title: getMockTitle(contentId),
        text_length: 1500,
        text_preview: "Sample content for learning and analysis.",
        status: "ready",
        url: getMockUrl(contentId)
      });
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  useEffect(() => {
    void fetchContentData();
  }, [fetchContentData]);
  const getMockContentType = (id: string): ContentType => {
    const types: ContentType[] = ['pdf-file', 'pdf-link', 'youtube', 'website'];
    return types[id.length % 4] ?? 'pdf-file';
  };

  const getMockTitle = (id: string): string => {
    const titles = [
      'Sample PDF Document',
      'Research Paper on AI',
      'YouTube Tutorial Video',
      'Educational Website Article'
    ];
    return titles[id.length % 4] ?? 'Sample Document';
  };

  const getMockUrl = (id: string): string | undefined => {
    const urls: (string | undefined)[] = [
      undefined,
      'https://example.com/sample.pdf',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://example.com/article'
    ];
    return urls[id.length % 4];
  };

  const handleCommandAction = (action: CommandAction) => {
    console.log('Executing command action:', action);
    
    switch (action.type) {
      case 'navigate':
        if (action.target === 'page' && action.parameters?.page) {
          const pageNum = action.parameters.page as number;
          setCurrentPage(pageNum);
          setCommandFeedback(`📖 Navigated to page ${pageNum}`);
        }
        break;
        
      case 'highlight':
        setCommandFeedback(`🎯 Highlighting ${action.target} (${JSON.stringify(action.parameters)})`);
        break;
        
      case 'visualize':
        setCommandFeedback(`📊 Creating visualizations for ${action.target}`);
        break;
        
      case 'analyze':
        setCommandFeedback(`🔬 Analyzing ${action.target} with parameters: ${JSON.stringify(action.parameters)}`);
        break;
        
      case 'extract':
        setCommandFeedback(`📋 Extracting ${action.target}`);
        break;        default:
          setCommandFeedback(`⚡ Executing action on ${action.target}`);
    }

    // Clear feedback after 3 seconds
    setTimeout(() => setCommandFeedback(null), 3000);
  };

  const handleDifficultyChange = (value: number[]) => {
    const newDifficulty = DIFFICULTY_ORDER[value[0] ?? 0];
    if (newDifficulty) {
      setDifficulty(newDifficulty);
      setCommandFeedback(`🎚️ Difficulty set to ${DIFFICULTY_LEVELS[newDifficulty].emoji} ${DIFFICULTY_LEVELS[newDifficulty].label}`);
      setTimeout(() => setCommandFeedback(null), 3000);
    }
  };

  const getCurrentDifficultyIndex = () => {
    return DIFFICULTY_ORDER.indexOf(difficulty);
  };

  const renderContentViewer = () => {
    if (!contentData) return null;

    switch (contentData.content_type) {
      case 'pdf-file':
      case 'pdf-link':
        return (
          <PDFViewer 
            contentId={contentData.content_id}
            url={contentData.url}
            title={contentData.title}
          />
        );
      case 'youtube':
        return (
          <VideoPlayer 
            url={contentData.url ?? ''}
            title={contentData.title}
          />
        );
      case 'website':
        return (
          <WebsiteViewer 
            url={contentData.url ?? ''}
            title={contentData.title}
          />
        );
      default:
        return <div className="text-white">Unsupported content type</div>;
    }
  };

  const fetchAvailableTopics = useCallback(async () => {
    if (!contentData) return;
    
    try {
      setTopicsLoading(true);
      console.log('🔍 Checking for topics for content:', contentId);
      
      // Debug: List all localStorage keys that contain "topics"
      const allKeys = Object.keys(localStorage);
      const topicKeys = allKeys.filter(key => key.includes('topics'));
      console.log('🗄️ All topic-related localStorage keys:', topicKeys);
      
      // First, check localStorage for previously extracted topics
      const storedTopics = localStorage.getItem(`topics_${contentId}`);
      console.log('🔍 Checking localStorage with key:', `topics_${contentId}`);
      console.log('🔍 StoredTopics result:', storedTopics ? 'Found data' : 'No data found');
      if (storedTopics) {
        console.log('📝 StoredTopics content:', storedTopics.substring(0, 200) + (storedTopics.length > 200 ? '...' : ''));
        try {
          const parsedTopics = JSON.parse(storedTopics) as { topics: Array<{ topic_name: string; topic_page_start: number; topic_page_end: number; topic_summary: string; }> };
          setAvailableTopics(parsedTopics);
          console.log('✅ Topics loaded from localStorage:', parsedTopics.topics.length, 'topics');
          return;
        } catch {
          console.warn('❌ Failed to parse stored topics, fetching fresh ones');
        }
      }
      
      // If no stored topics, call the appropriate API based on content type
      console.log('📡 No stored topics found, calling topic extraction API...');
      
      let response;
      if (contentData.content_type === 'youtube') {
        console.log("url", process.env.NEXT_PUBLIC_BACKEND_URL);
        console.log('🎥 Extracting topics from YouTube content');
        if (!contentData.url) {
          throw new Error("YouTube content missing URL");
        }
        response = await fetch('/api/trpc/content.extractYoutubeTopics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            json: {
              url: contentData.url,
              title: contentData.title
            }
          })
        });
      } else {
        console.log('📄 Extracting topics from document content');
        response = await fetch('/api/trpc/content.extractTopics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            json: {
              contentId: contentId
            }
          })
        });
      }

      if (response.ok) {
        const result = await response.json() as { result: { data: { success: boolean; data: { topics: Array<{ topic_name: string; topic_page_start?: number; topic_page_end?: number; topic_summary: string; }> } } } };
        
        if (result.result.data.success) {
          const topicsData = result.result.data.data;
          
          // Transform topics data to ensure all required fields are present
          const transformedTopicsData: { topics: Array<{ topic_name: string; topic_page_start: number; topic_page_end: number; topic_summary: string; }> } = {
            topics: topicsData.topics.map((topic, index) => ({
              topic_name: topic.topic_name,
              topic_page_start: contentData.content_type === 'youtube' ? index + 1 : (topic.topic_page_start ?? 1),
              topic_page_end: contentData.content_type === 'youtube' ? index + 1 : (topic.topic_page_end ?? 1),
              topic_summary: topic.topic_summary
            }))
          };
          
          setAvailableTopics(transformedTopicsData);
          
          // Store the topics in localStorage for future use
          localStorage.setItem(`topics_${contentId}`, JSON.stringify(transformedTopicsData));
          
          console.log('✅ Topics fetched from API and cached:', transformedTopicsData.topics.length, 'topics');
        } else {
          console.warn('❌ Failed to extract topics');
          setAvailableTopics({ topics: [] });
        }
      } else {
        console.warn('❌ Failed to fetch topics:', response.status);
        // Provide some mock topics for testing if API fails
        const mockTopics = {
          topics: [
            {
              topic_name: "artificial intelligence",
              topic_page_start: 1,
              topic_page_end: 5,
              topic_summary: "Introduction to artificial intelligence concepts and applications"
            },
            {
              topic_name: "machine learning",
              topic_page_start: 6,
              topic_page_end: 12,
              topic_summary: "Fundamentals of machine learning algorithms and techniques"
            },
            {
              topic_name: "neural networks",
              topic_page_start: 13,
              topic_page_end: 18,
              topic_summary: "Deep dive into neural network architectures and training"
            }
          ]
        };
        setAvailableTopics(mockTopics);
        console.log('🔄 Using mock topics for testing:', mockTopics.topics.length, 'topics');
      }
    } catch (error) {
      console.error('❌ Error fetching topics:', error);
      // Provide some mock topics for testing if everything fails
      const mockTopics = {
        topics: [
          {
            topic_name: "artificial intelligence",
            topic_page_start: 1,
            topic_page_end: 5,
            topic_summary: "Introduction to artificial intelligence concepts and applications"
          },
          {
            topic_name: "machine learning",
            topic_page_start: 6,
            topic_page_end: 12,
            topic_summary: "Fundamentals of machine learning algorithms and techniques"
          },
          {
            topic_name: "neural networks",
            topic_page_start: 13,
            topic_page_end: 18,
            topic_summary: "Deep dive into neural network architectures and training"
          }
        ]
      };
      setAvailableTopics(mockTopics);
      console.log('🔄 Using mock topics due to error:', mockTopics.topics.length, 'topics');
    } finally {
      setTopicsLoading(false);
    }
  }, [contentId, contentData]);

  // Fetch topics when content data is available
  useEffect(() => {
    if (contentData && !availableTopics && !topicsLoading) {
      // Add a small delay to allow localStorage to be set if coming from mindmap
      // Also retry a few times in case of timing issues
      let retryCount = 0;
      const maxRetries = 3;
      
      const tryFetchTopics = () => {
        console.log(`🔄 Attempt ${retryCount + 1}/${maxRetries} to fetch topics`);
        
        // Check if topics exist in localStorage first
        const storedTopics = localStorage.getItem(`topics_${contentId}`);
        if (storedTopics) {
          console.log(`✅ Found topics in localStorage on attempt ${retryCount + 1}`);
          void fetchAvailableTopics();
          return;
        }
        
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`⏳ No topics found, retrying in ${200 * retryCount}ms...`);
          setTimeout(tryFetchTopics, 200 * retryCount);
        } else {
          console.log('📡 No cached topics found after retries, proceeding with API call');
          void fetchAvailableTopics();
        }
      };
      
      // Start with a small initial delay
      const timer = setTimeout(tryFetchTopics, 100);
      
      return () => clearTimeout(timer);
    }
  }, [contentData, availableTopics, topicsLoading, fetchAvailableTopics, contentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-2 border-white border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error Loading Content</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <Link href="/dashboard">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm h-20">
        <div className="container mx-auto px-6 py-4 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="h-6 w-px bg-border"></div>
              <h1 className="text-xl font-semibold text-foreground">
                {contentData?.title ?? 'Learning Session'}
              </h1>
            </div>
            
            {/* Center: Difficulty Slider */}
            <div className="flex items-center space-x-3 bg-muted/50 rounded-lg px-4 py-2 border border-border/50">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm" role="img" aria-label="difficulty emoji">
                    {DIFFICULTY_LEVELS[difficulty].emoji}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {DIFFICULTY_LEVELS[difficulty].label}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">🟢</span>
                  <Slider
                    value={[getCurrentDifficultyIndex()]}
                    onValueChange={handleDifficultyChange}
                    max={3}
                    min={0}
                    step={1}
                    className="w-32"
                  />
                  <span className="text-xs text-muted-foreground">🔴</span>
                </div>
              </div>
            </div>
            
            {/* Right: Controls */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="text-foreground hover:bg-accent"
              >
                {isChatOpen ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Hide Chat
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Show Chat
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Content Viewer */}
        <div className={`flex-1 ${isChatOpen ? 'mr-96' : ''} transition-all duration-300 relative`}>
          {/* Command Feedback */}
          {commandFeedback && (
            <div className="absolute top-4 right-4 z-50 bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg shadow-lg border border-primary/30 backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary-foreground/70 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">{commandFeedback}</span>
              </div>
            </div>
          )}
          
          {/* Current Page Indicator */}
          <div className="absolute bottom-4 left-4 bg-card/60 text-card-foreground px-3 py-1 rounded-full text-sm backdrop-blur-sm border border-border">
            Page {currentPage}
          </div>
          
          {renderContentViewer()}
        </div>

        {/* Chat Panel */}
        {isChatOpen && (
          <div className="fixed right-0 top-20 bottom-0 w-96 border-l border-border bg-card/40 backdrop-blur-sm z-40">
            <ChatPanel 
              contentId={contentId}
              contentData={{
                ...contentData,
                total_pages: 100, // Mock total pages
                subjects: ['biology', 'chemistry', 'physics'] // Mock subjects
              }}
              onCommandAction={handleCommandAction}
              difficulty={difficulty}
              difficultyConfig={DIFFICULTY_LEVELS[difficulty]}
              availableTopics={availableTopics ?? undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}
