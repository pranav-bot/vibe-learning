'use client';

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Download, FileText, AlertCircle } from "lucide-react";

interface PDFViewerProps {
  contentId: string;
  url?: string;
  title: string;
}

export function PDFViewer({ contentId, url, title }: PDFViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPDF();
  }, [contentId, url]);

  const loadPDF = async () => {
    try {
      if (url && url.includes('.pdf')) {
        // For PDF links, try to load directly
        setPdfUrl(url);
      } else {
        // For uploaded files, use the PDF endpoint
        const fileUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/pdf/${contentId}`;
        
        // Test if the PDF exists by making a HEAD request
        try {
          const response = await fetch(fileUrl, { method: 'HEAD' });
          if (response.ok) {
            setPdfUrl(fileUrl);
          } else {
            setError('PDF file not found on server');
          }
        } catch (fetchError) {
          console.error('Error checking PDF file:', fetchError);
          setError('Could not connect to server');
        }
      }
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Failed to load PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = title || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent mb-4"></div>
          <p className="text-white">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-white">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load PDF</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          <Button 
            onClick={loadPDF}
            className="bg-gradient-to-r from-purple-500 to-pink-500"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* PDF Controls */}
      <div className="bg-black/20 border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-red-400" />
            <span className="text-white font-medium">{title}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-white hover:bg-white/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 bg-gray-100">
        {pdfUrl ? (
          <div className="w-full h-full">
            <embed
              src={pdfUrl}
              type="application/pdf"
              className="w-full h-full"
              title={title}
              onError={() => {
                console.error('Failed to load PDF with embed');
                setError('PDF could not be displayed. This may happen if the browser does not support PDF viewing.');
              }}
            />
            {/* Fallback message */}
            <div className="hidden" id="pdf-fallback">
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">PDF Viewer Not Supported</h3>
                  <p className="text-gray-500 mb-4">Your browser may not support embedded PDF viewing.</p>
                  <div className="space-y-2">
                    <Button 
                      onClick={handleDownload}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 w-full"
                    >
                      Download PDF
                    </Button>
                    <Button 
                      onClick={() => window.open(pdfUrl, '_blank')}
                      variant="outline"
                      className="w-full"
                    >
                      Open in New Tab
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">PDF Preview Not Available</h3>
              <p className="text-gray-500 mb-4">The PDF cannot be displayed in the browser.</p>
              <Button 
                onClick={handleDownload}
                className="bg-gradient-to-r from-purple-500 to-pink-500"
              >
                Download PDF
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
