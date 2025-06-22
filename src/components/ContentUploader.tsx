'use client';

import { useState, useRef } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";


export type ContentType = 'pdf-file' | 'pdf-link' | 'youtube' | 'website';

interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    content_id: string;
    content_type: ContentType;
    title: string;
    file_size?: number;
    url?: string;
    text_length: number;
    text_preview: string;
    status: string;
  };
}

interface ContentUploaderProps {
  onUploadSuccess?: (data: UploadResponse['data']) => void;
  onUploadError?: (error: string) => void;
}

export function ContentUploader({ onUploadSuccess, onUploadError }: ContentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<ContentType>('pdf-file');
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      onUploadError?.('Please select a PDF file');
      return;
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      onUploadError?.('File size must be less than 50MB');
      return;
    }

    await uploadContent(file, 'pdf-file');
  };

  const handleUrlSubmit = async (url: string, type: ContentType) => {
    if (!url.trim()) {
      onUploadError?.('Please enter a valid URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      onUploadError?.('Please enter a valid URL');
      return;
    }

    // Type-specific validation
    if (type === 'pdf-link' && !url.toLowerCase().includes('.pdf')) {
      onUploadError?.('Please enter a valid PDF URL (must contain .pdf)');
      return;
    }

    if (type === 'youtube' && !isYouTubeUrl(url)) {
      onUploadError?.('Please enter a valid YouTube URL');
      return;
    }

    await uploadContent(url, type);
  };

  const isYouTubeUrl = (url: string): boolean => {
    return url.includes('youtube.com/watch') || url.includes('youtu.be/') || url.includes('youtube.com/embed/');
  };

  const uploadContent = async (content: File | string, type: ContentType) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      
      if (content instanceof File) {
        formData.append('file', content);
        formData.append('content_type', type);
      } else {
        formData.append('url', content);
        formData.append('content_type', type);
      }

      // Create XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest();

      // Set up progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      // Set up response handling
      const uploadPromise = new Promise<UploadResponse>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch {
              reject(new Error('Invalid response format'));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText) as { detail?: string };
              let errorMessage: string = errorResponse.detail ?? 'Upload failed';
              
              // Handle character limit error specifically
              if (typeof errorMessage === 'string' && 
                  (errorMessage.includes('character limit') || errorMessage.includes('100,000'))) {
                errorMessage = 'Document too large: Character limit exceeded (100,000 characters). Please use a smaller document.';
              }
              
              reject(new Error(errorMessage));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error during upload'));
        };
      });

      // Choose endpoint based on content type
      const endpoint = content instanceof File ? 
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/upload-pdf` : 
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/upload-content`;

      xhr.open('POST', endpoint);
      xhr.send(formData);

      const response = await uploadPromise;

      if (response.success) {
        onUploadSuccess?.(response.data);
        setUrlInput(''); // Clear URL input on success
      } else {
        onUploadError?.(response.message || 'Upload failed');
      }

    } catch (error) {
      // Don't log character limit errors to console as they're expected user errors
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      if (!errorMessage.includes('character limit') && !errorMessage.includes('100,000')) {
        console.error('Upload error:', error);
      }
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void handleFileUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      void handleFileUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleClick = () => {
    if (activeTab === 'pdf-file') {
      fileInputRef.current?.click();
    }
  };

  const getTabIcon = (type: ContentType) => {
    switch (type) {
      case 'pdf-file':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'pdf-link':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
      case 'youtube':
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        );
      case 'website':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        );
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader className="text-center">
        <CardTitle className="text-white flex items-center justify-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          Upload Learning Content
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ContentType)}>
          <TabsList className="grid w-full grid-cols-4 bg-white/10">
            <TabsTrigger value="pdf-file" className="flex items-center gap-2 text-xs">
              {getTabIcon('pdf-file')}
              PDF File
            </TabsTrigger>
            <TabsTrigger value="pdf-link" className="flex items-center gap-2 text-xs">
              {getTabIcon('pdf-link')}
              PDF Link
            </TabsTrigger>
            <TabsTrigger value="youtube" className="flex items-center gap-2 text-xs">
              {getTabIcon('youtube')}
              YouTube
            </TabsTrigger>
            <TabsTrigger value="website" className="flex items-center gap-2 text-xs">
              {getTabIcon('website')}
              Website
            </TabsTrigger>
          </TabsList>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          <TabsContent value="pdf-file" className="mt-6">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                isDragOver
                  ? 'border-purple-400 bg-purple-500/10'
                  : 'border-white/30 hover:border-white/50'
              } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={handleClick}
            >
              <div className="mx-auto w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                {isUploading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                ) : (
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </div>

              {isUploading ? (
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">Uploading PDF...</h3>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-300">{Math.round(uploadProgress)}% complete</p>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {isDragOver ? 'Drop your PDF here' : 'Drag and drop your PDF here'}
                  </h3>
                  <p className="text-gray-300 mb-4">or click to browse files</p>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    Select PDF File
                  </Button>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pdf-link" className="mt-6">
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">Enter PDF URL</h3>
                <p className="text-gray-300">Paste a direct link to a PDF document</p>
              </div>
              <Input
                type="url"
                placeholder="https://example.com/document.pdf"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                disabled={isUploading}
              />
              <Button 
                onClick={() => handleUrlSubmit(urlInput, 'pdf-link')}
                disabled={isUploading || !urlInput.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isUploading ? 'Processing...' : 'Process PDF Link'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="youtube" className="mt-6">
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">Enter YouTube URL</h3>
                <p className="text-gray-300">Paste a YouTube video URL to extract content</p>
              </div>
              <Input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                disabled={isUploading}
              />
              <Button 
                onClick={() => handleUrlSubmit(urlInput, 'youtube')}
                disabled={isUploading || !urlInput.trim()}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              >
                {isUploading ? 'Processing...' : 'Process YouTube Video'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="website" className="mt-6">
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">Enter Website URL</h3>
                <p className="text-gray-300">Paste any website URL to extract content</p>
              </div>
              <Input
                type="url"
                placeholder="https://example.com/article"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                disabled={isUploading}
              />
              <Button 
                onClick={() => handleUrlSubmit(urlInput, 'website')}
                disabled={isUploading || !urlInput.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                {isUploading ? 'Processing...' : 'Process Website'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Progress indicator for URL uploads */}
        {isUploading && activeTab !== 'pdf-file' && (
          <div className="mt-6 space-y-2">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full animate-pulse"></div>
            </div>
            <p className="text-gray-300 text-center text-sm">Processing content...</p>
          </div>
        )}

        {/* Requirements */}
        <div className="mt-6 p-4 bg-white/5 rounded-lg">
          <h4 className="text-white font-medium mb-2">Supported content types:</h4>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• PDF files (up to 50MB, max 100,000 characters) and PDF links</li>
            <li>• YouTube videos (transcript extraction)</li>
            <li>• Websites and articles (content extraction)</li>
            <li>• All content is processed with AI for learning</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
