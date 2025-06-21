'use client';

import { useState } from "react";
import { ContentUploader, type ContentType } from "~/components/ContentUploader";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

interface UploadedContent {
  content_id: string;
  content_type: ContentType;
  title: string;
  file_size?: number;
  url?: string;
  text_length: number;
  text_preview: string;
  status: string;
}

export function DashboardClient() {
  const [uploadedContent, setUploadedContent] = useState<UploadedContent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessingTopics, setIsProcessingTopics] = useState(false);

  // TRPC mutations for topic extraction
  const extractTopics = api.content.extractTopics.useMutation();
  const extractYoutubeTopics = api.content.extractYoutubeTopics.useMutation();

  const handleUploadSuccess = async (data: UploadedContent | undefined) => {
    if (data) {
      setUploadedContent(prev => [data, ...prev]);
      setSuccess(`Successfully processed ${data.title}. Extracting topics...`);
      setError(null);
      setIsProcessingTopics(true);
      
      // Store content data in localStorage for the learning page
      localStorage.setItem(`content_${data.content_id}`, JSON.stringify(data));
      
      try {
        // Extract topics using the appropriate topic extractor based on content type
        let topicsResult;
        if (data.content_type === 'youtube') {
          console.log("🎯 Extracting topics from YouTube video...");
          if (!data.url) {
            throw new Error("YouTube content missing URL");
          }
          topicsResult = await extractYoutubeTopics.mutateAsync({ 
            url: data.url, 
            title: data.title 
          });
        } else {
          console.log("🎯 Extracting topics from document...");
          topicsResult = await extractTopics.mutateAsync({ contentId: data.content_id });
        }
        
        console.log("🎯 Topics extracted successfully:", topicsResult.data);
        
        // Show success message with topic count
        const topicCount = topicsResult.data?.topics?.length || 0;
        setSuccess(`✅ Successfully extracted ${topicCount} topics! Redirecting to learning page...`);
        
        // Store topics data in localStorage for the learning page
        localStorage.setItem(`topics_${data.content_id}`, JSON.stringify(topicsResult.data));
        
        // Redirect to learning page after successful topic extraction
        setTimeout(() => {
          window.location.href = `/learn/${data.content_id}`;
        }, 2000); // Give user time to see the success message
        
      } catch (error) {
        console.error("❌ Topic extraction failed:", error);
        
        // Provide user-friendly error messages
        let errorMessage = "Topic extraction failed";
        if (error instanceof Error) {
          if (error.message.includes("timed out")) {
            errorMessage = "Topic extraction timed out. The document might be too large.";
          } else if (error.message.includes("too long or complex")) {
            errorMessage = "Document is too complex for topic extraction.";
          } else if (error.message.includes("Python backend")) {
            errorMessage = "Backend service is unavailable.";
          } else {
            errorMessage = `Topic extraction failed: ${error.message}`;
          }
        }
        
        setError(errorMessage);
        setSuccess(`${data.title} uploaded successfully, but topic extraction failed. You can still proceed to the learning page.`);
        
        // Still allow redirect to learning page even if topic extraction fails
        setTimeout(() => {
          window.location.href = `/learn/${data.content_id}`;
        }, 5000); // Longer delay to let user read the error
      } finally {
        setIsProcessingTopics(false);
      }
    }
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
    setSuccess(null);
    
    // Clear error message after 5 seconds
    setTimeout(() => setError(null), 5000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getContentTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'pdf-file':
      case 'pdf-link':
        return (
          <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'youtube':
        return (
          <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        );
      case 'website':
        return (
          <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        );
    }
  };

  const getContentTypeLabel = (type: ContentType) => {
    switch (type) {
      case 'pdf-file': return 'PDF File';
      case 'pdf-link': return 'PDF Link';
      case 'youtube': return 'YouTube Video';
      case 'website': return 'Website';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-200">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
          <div className="flex items-center space-x-3">
            {(success.includes('Redirecting') || isProcessingTopics) && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-400 border-t-transparent"></div>
            )}
            <p className="text-green-200">{success}</p>
          </div>
          {isProcessingTopics && (
            <p className="text-green-300 text-sm mt-2">
              🔄 Analyzing document structure and extracting topics using AI...
            </p>
          )}
        </div>
      )}

      {/* Content Uploader */}
      <div className={isProcessingTopics ? "opacity-50 pointer-events-none" : ""}>
        <ContentUploader 
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />
        {isProcessingTopics && (
          <p className="text-center text-muted-foreground text-sm mt-2">
            Please wait while we process your document...
          </p>
        )}
      </div>

      {/* Uploaded Content List */}
      {uploadedContent.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Recently Uploaded Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadedContent.map((content) => (
                <div 
                  key={content.content_id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getContentTypeIcon(content.content_type)}
                      <h4 className="text-white font-medium">{content.title}</h4>
                      <span className="text-xs px-2 py-1 bg-white/10 rounded-full text-gray-300">
                        {getContentTypeLabel(content.content_type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-300">
                      {content.file_size && (
                        <>
                          <span>{formatFileSize(content.file_size)}</span>
                          <span>•</span>
                        </>
                      )}
                      {content.url && (
                        <>
                          <span className="truncate max-w-48">{content.url}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{content.text_length?.toLocaleString() ?? 0} characters extracted</span>
                      <span>•</span>
                      <span className="text-green-400">{content.status}</span>
                    </div>
                    {content.text_preview && (
                      <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                        {content.text_preview}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-white border-white/20 hover:bg-white/10"
                      onClick={() => window.location.href = `/learn/${content.content_id}`}
                    >
                      Learn
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-300 border-red-300/20 hover:bg-red-500/10"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
