'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Copy, Download, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';

interface DiagramProps {
  mermaidCode: string;
  title?: string;
  description?: string;
  className?: string;
}

export const MermaidDiagram: React.FC<DiagramProps> = ({
  mermaidCode,
  title,
  description,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diagramId] = useState(() => `mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const initializeMermaid = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize Mermaid with configuration
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'inherit',
          fontSize: 14,
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis'
          },
          sequence: {
            diagramMarginX: 50,
            diagramMarginY: 10,
            actorMargin: 50,
            width: 150,
            height: 65,
            boxMargin: 10,
            boxTextMargin: 5,
            noteMargin: 10,
            messageMargin: 35,
            mirrorActors: true,
            bottomMarginAdj: 1,
            useMaxWidth: true,
            rightAngles: false,
            showSequenceNumbers: false
          },
          gantt: {
            useMaxWidth: true,
            leftPadding: 75,
            gridLineStartPadding: 35,
            fontSize: 11,
            sectionFontSize: 24,
            numberSectionStyles: 4
          }
        });

        if (containerRef.current) {
          // Clear previous content
          containerRef.current.innerHTML = '';
          
          // Validate and render the diagram
          const validationResult = await mermaid.parse(mermaidCode);
          if (validationResult) {
            const { svg } = await mermaid.render(diagramId, mermaidCode);
            containerRef.current.innerHTML = svg;
          } else {
            throw new Error('Invalid Mermaid syntax');
          }
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      } finally {
        setIsLoading(false);
      }
    };

    if (mermaidCode) {
      void initializeMermaid();
    }
  }, [mermaidCode, diagramId]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode);
      toast.success('Mermaid code copied to clipboard');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadSVG = () => {
    if (containerRef.current) {
      const svgElement = containerRef.current.querySelector('svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = svgUrl;
        downloadLink.download = `${title ?? 'diagram'}.svg`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(svgUrl);

        toast.success('Diagram saved as SVG file');
      }
    }
  };

  const openFullscreen = () => {
    if (containerRef.current) {
      const svgElement = containerRef.current.querySelector('svg');
      if (svgElement) {
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${title ?? 'Mermaid Diagram'}</title>
                <style>
                  body { 
                    margin: 0; 
                    padding: 20px; 
                    font-family: system-ui, -apple-system, sans-serif;
                    background: #f8fafc;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                  }
                  svg { 
                    max-width: 100%; 
                    height: auto; 
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                  }
                </style>
              </head>
              <body>
                ${svgElement.outerHTML}
              </body>
            </html>
          `);
          newWindow.document.close();
        }
      }
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            {title && <CardTitle className="text-lg font-semibold">{title}</CardTitle>}
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="h-8 w-8 p-0"
              title="Copy Mermaid code"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadSVG}
              className="h-8 w-8 p-0"
              title="Download as SVG"
              disabled={isLoading || !!error}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openFullscreen}
              className="h-8 w-8 p-0"
              title="Open in fullscreen"
              disabled={isLoading || !!error}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Rendering diagram...</span>
          </div>
        )}
        
        {error && (
          <div className="p-6 border-2 border-dashed border-red-200 rounded-lg bg-red-50">
            <div className="text-center">
              <p className="text-red-600 font-medium">Failed to render diagram</p>
              <p className="text-red-500 text-sm mt-1">{error}</p>
              <details className="mt-3 text-xs">
                <summary className="cursor-pointer text-red-600 hover:text-red-700">
                  Show Mermaid code
                </summary>
                <pre className="mt-2 p-2 bg-red-100 rounded text-left overflow-x-auto">
                  <code>{mermaidCode}</code>
                </pre>
              </details>
            </div>
          </div>
        )}
        
        {!isLoading && !error && (
          <div className="mermaid-container overflow-x-auto">
            <div 
              ref={containerRef} 
              className="flex justify-center items-center min-h-[200px] w-full"
              style={{ lineHeight: 1.5 }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MermaidDiagram;
