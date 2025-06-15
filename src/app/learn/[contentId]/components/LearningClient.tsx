'use client';

import { useState, useEffect, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { ArrowLeft, MessageSquare, X } from "lucide-react";
import Link from "next/link";
import ThemeToggle from "~/components/ThemeToggle";
import { PDFViewer } from "./PDFViewer";
import { VideoPlayer } from "./VideoPlayer";
import { WebsiteViewer } from "./WebsiteViewer";
import { ChatPanel } from "./ChatPanel";
import { type ContentType } from "~/components/ContentUploader";
import { type CommandAction } from "~/lib/conversational-command-parser";

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

export function LearningClient({ contentId }: LearningClientProps) {
  const [contentData, setContentData] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);

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
      const response = await fetch(`http://localhost:8000/content/${contentId}`);
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
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
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
            <div className="flex items-center space-x-2">
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
          <div className="fixed right-0 top-20 bottom-0 w-96 border-l border-border bg-card/40 backdrop-blur-sm">
            <ChatPanel 
              contentId={contentId}
              contentData={{
                ...contentData,
                total_pages: 100, // Mock total pages
                subjects: ['biology', 'chemistry', 'physics'] // Mock subjects
              }}
              onCommandAction={handleCommandAction}
            />
          </div>
        )}
      </div>
    </div>
  );
}
