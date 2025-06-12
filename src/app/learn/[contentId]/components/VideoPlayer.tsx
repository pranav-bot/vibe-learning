'use client';

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Play, ExternalLink, AlertCircle } from "lucide-react";

interface VideoPlayerProps {
  url: string;
  title: string;
}

export function VideoPlayer({ url, title }: VideoPlayerProps) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    processVideoUrl();
  }, [url]);

  const processVideoUrl = () => {
    try {
      if (!url) {
        setError('No video URL provided');
        return;
      }

      // Extract video ID from various YouTube URL formats
      let videoId = null;
      
      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1]?.split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0];
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('embed/')[1]?.split('?')[0];
      }

      if (videoId) {
        setEmbedUrl(`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`);
      } else {
        setError('Invalid YouTube URL format');
      }
    } catch (err) {
      setError('Failed to process video URL');
    }
  };

  const openInNewTab = () => {
    window.open(url, '_blank');
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-white">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Video</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          <Button 
            onClick={openInNewTab}
            className="bg-gradient-to-r from-red-500 to-red-600"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in YouTube
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Video Controls */}
      <div className="bg-black/20 border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Play className="h-5 w-5 text-red-500" />
            <span className="text-white font-medium">{title}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={openInNewTab}
              className="text-white hover:bg-white/10"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in YouTube
            </Button>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="flex-1 bg-black flex items-center justify-center">
        {embedUrl ? (
          <div className="w-full h-full max-w-4xl max-h-[80vh] mx-auto">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              title={title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent mb-4 mx-auto"></div>
            <p className="text-white">Loading video...</p>
          </div>
        )}
      </div>
    </div>
  );
}
