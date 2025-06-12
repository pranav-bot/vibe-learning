'use client';

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { ArrowLeft, MessageSquare, X } from "lucide-react";
import Link from "next/link";
import { PDFViewer } from "./PDFViewer";
import { VideoPlayer } from "./VideoPlayer";
import { WebsiteViewer } from "./WebsiteViewer";
import { ChatPanel } from "./ChatPanel";
import { type ContentType } from "~/components/ContentUploader";

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
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);

  useEffect(() => {
    fetchContentData();
  }, [contentId]);

  const fetchContentData = async () => {
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
  };

  // Mock data generators for demo purposes
  const getMockContentType = (id: string): ContentType => {
    const types: ContentType[] = ['pdf-file', 'pdf-link', 'youtube', 'website'];
    return types[id.length % 4];
  };

  const getMockTitle = (id: string): string => {
    const titles = [
      'Sample PDF Document',
      'Research Paper on AI',
      'YouTube Tutorial Video',
      'Educational Website Article'
    ];
    return titles[id.length % 4];
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="h-6 w-px bg-white/20"></div>
              <h1 className="text-xl font-semibold text-white">
                {contentData?.title ?? 'Learning Session'}
              </h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="text-white hover:bg-white/10"
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

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Content Viewer */}
        <div className={`flex-1 ${isChatOpen ? 'mr-96' : ''} transition-all duration-300`}>
          {renderContentViewer()}
        </div>

        {/* Chat Panel */}
        {isChatOpen && (
          <div className="fixed right-0 top-20 bottom-0 w-96 border-l border-white/10 bg-black/40 backdrop-blur-sm">
            <ChatPanel 
              contentId={contentId}
              contentData={contentData}
            />
          </div>
        )}
      </div>
    </div>
  );
}
