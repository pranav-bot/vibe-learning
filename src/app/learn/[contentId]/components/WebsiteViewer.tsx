'use client';

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { ExternalLink, RefreshCw, Globe, AlertTriangle } from "lucide-react";

interface WebsiteViewerProps {
  url: string;
  title: string;
}

export function WebsiteViewer({ url, title }: WebsiteViewerProps) {
  const [iframeError, setIframeError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const openInNewTab = () => {
    window.open(url, '_blank');
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIframeError(true);
    setIsLoading(false);
  };

  const refreshPage = () => {
    setIframeError(false);
    setIsLoading(true);
    // Force iframe reload by changing src
    const iframe = document.getElementById('website-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Website Controls */}
      <div className="bg-black/20 border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-blue-400" />
            <span className="text-white font-medium">{title}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshPage}
              className="text-white hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={openInNewTab}
              className="text-white hover:bg-white/10"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          </div>
        </div>
        
        {/* URL Bar */}
        <div className="mt-2 px-3 py-1 bg-white/10 rounded text-sm text-gray-300 truncate">
          {url}
        </div>
      </div>

      {/* Website Content */}
      <div className="flex-1 relative bg-white">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mb-4 mx-auto"></div>
              <p className="text-gray-600">Loading website...</p>
            </div>
          </div>
        )}

        {iframeError ? (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-center text-gray-700 max-w-md">
              <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
              <h3 className="text-lg font-semibold mb-2">Unable to Display Website</h3>
              <p className="text-gray-600 mb-6">
                This website cannot be displayed in an iframe due to security restrictions. 
                You can still open it in a new tab to view the content.
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={openInNewTab}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
                <Button 
                  variant="outline"
                  onClick={refreshPage}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            id="website-iframe"
            src={url}
            className="w-full h-full border-0"
            title={title}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        )}
      </div>
    </div>
  );
}
