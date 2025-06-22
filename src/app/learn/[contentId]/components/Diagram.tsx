'use client';

import React, { useEffect, useState } from 'react';
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

// Helper function to clean and fix common Mermaid syntax issues
const cleanMermaidCode = (code: string): string => {
  let cleaned = code;
  
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  
  // Check if it's a sequence diagram and handle accordingly
  const isSequenceDiagram = cleaned.includes('sequenceDiagram');
  
  if (isSequenceDiagram) {
    // Fix sequence diagram specific issues
    
    // Fix arrow syntax for sequence diagrams
    cleaned = cleaned.replace(/-->/g, '-->>');
    cleaned = cleaned.replace(/->>/g, '->>');
    cleaned = cleaned.replace(/-->>>/g, '-->>');
    cleaned = cleaned.replace(/->>>/g, '->>');
    
    // Fix participant names - remove special characters and ensure proper formatting
    cleaned = cleaned.replace(/participant\s+([^:\n]+)/g, (_match: string, name: string) => {
      const cleanName = name.trim().replace(/[^\w\s]/g, '');
      return `participant ${cleanName}`;
    });
    
    // Fix message syntax - ensure proper format
    cleaned = cleaned.replace(/([A-Za-z]\w*)\s*-\s*>>\s*([A-Za-z]\w*)\s*:\s*(.+)/g, '$1->>$2: $3');
    cleaned = cleaned.replace(/([A-Za-z]\w*)\s*-\s*-\s*>>\s*([A-Za-z]\w*)\s*:\s*(.+)/g, '$1-->>$2: $3');
    
    // Clean message text
    cleaned = cleaned.replace(/:\s*([^\n]+)/g, (_match: string, text: string) => {
      const cleanText = text.replace(/[^\w\s\-+='()!?]/g, ' ').trim();
      return `: ${cleanText}`;
    });
    
    // Fix Note syntax
    cleaned = cleaned.replace(/Note\s+over\s+([^:]+):\s*(.+)/g, (_match: string, participants: string, note: string) => {
      const cleanParticipants = participants.trim().replace(/[^\w\s,]/g, '');
      const cleanNote = note.replace(/[^\w\s\-+='()!?:]/g, ' ').trim();
      return `Note over ${cleanParticipants}: ${cleanNote}`;
    });
    
  } else {
    // Handle other diagram types
    
    // Fix common arrow syntax issues
    cleaned = cleaned.replace(/-->/g, ' --> ');
    cleaned = cleaned.replace(/\s+-->\s+/g, ' --> ');
    
    // Fix node text that might contain problematic characters
    cleaned = cleaned.replace(/([A-Z]+)\{([^}]+)\}/g, (_match: string, nodeId: string, text: string) => {
      // For diamond nodes, ensure proper text formatting
      const cleanText = text.replace(/[^\w\s\-+='?]/g, ' ').trim();
      return `${nodeId}{${cleanText}}`;
    });
    
    // Fix node text in brackets
    cleaned = cleaned.replace(/([A-Z]+)\[([^\]]+)\]/g, (_match: string, nodeId: string, text: string) => {
      const cleanText = text.replace(/[^\w\s\-+='?]/g, ' ').trim();
      return `${nodeId}[${cleanText}]`;
    });
    
    // Fix node text in parentheses
    cleaned = cleaned.replace(/([A-Z]+)\(([^)]+)\)/g, (_match: string, nodeId: string, text: string) => {
      const cleanText = text.replace(/[^\w\s\-+='?]/g, ' ').trim();
      return `${nodeId}(${cleanText})`;
    });
  }
  
  // Common fixes for all diagram types
  
  // Ensure proper line endings
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Remove empty lines and normalize spacing
  cleaned = cleaned.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
  
  // Fix indentation for nested elements
  cleaned = cleaned.split('\n').map(line => {
    if (line.trim().startsWith('alt ') || 
        line.trim().startsWith('else') || 
        line.trim().startsWith('end') ||
        line.trim().startsWith('activate ') ||
        line.trim().startsWith('deactivate ')) {
      return '    ' + line.trim();
    }
    return line.trim();
  }).join('\n');
  
  return cleaned;
};

// Global flag to track if mermaid has been initialized
let mermaidInitialized = false;

export const MermaidDiagram: React.FC<DiagramProps> = ({
  mermaidCode,
  title,
  description,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diagramId] = useState(() => `mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const initializeMermaid = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('Initializing Mermaid with code:', mermaidCode);

        // Initialize Mermaid with configuration only once globally
        if (!mermaidInitialized) {
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
          mermaidInitialized = true;
          console.log('Mermaid initialized');
        }

        // Wait for the component to render and try multiple times to find the container
        let container = null;
        let retries = 0;
        const maxRetries = 20;
        
        while (!container && retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100));
          container = document.getElementById(diagramId);
          retries++;
          console.log(`Attempt ${retries}: Container found:`, !!container);
        }

        if (!container) {
          throw new Error(`Container element not found after ${maxRetries} attempts (${maxRetries * 100}ms)`);
        }

        // Clear previous content
        container.innerHTML = '';
        
        console.log('Container found, rendering with ID:', diagramId);
        
        // Clean and validate the mermaid code first
        const cleanedCode = cleanMermaidCode(mermaidCode);
        console.log('Original Mermaid code:', mermaidCode);
        console.log('Cleaned Mermaid code:', cleanedCode);
        
        try {
          await mermaid.parse(cleanedCode);
          console.log('Mermaid code is valid');
        } catch (parseError) {
          console.error('Mermaid parse error:', parseError);
          console.error('Problematic Mermaid code:', cleanedCode);
          
          // Try to provide a more helpful error message
          let errorMessage = `Invalid Mermaid syntax: ${String(parseError)}`;
          
          // Check for common issues and suggest fixes
          if (String(parseError).includes('PS')) {
            errorMessage += '\n\nPossible issues:\n- Check node syntax (use [] for rectangles, () for rounded, {} for diamonds)\n- Verify arrow syntax (use --> or -->) \n- Check for special characters in node text';
          }
          
          throw new Error(errorMessage);
        }
        
        // Use the proper render API with cleaned code
        const renderResult = await mermaid.render(`${diagramId}-svg`, cleanedCode);
        console.log('Render result:', renderResult);
        
        if (renderResult?.svg) {
          // Insert the SVG into the DOM
          container.innerHTML = renderResult.svg;
          console.log('SVG inserted into container');
          
          // Bind any interactive events
          if (renderResult.bindFunctions) {
            renderResult.bindFunctions(container);
            console.log('Event bindings applied');
          }
        } else {
          throw new Error('No SVG returned from render');
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      } finally {
        setIsLoading(false);
      }
    };

    if (mermaidCode?.trim()) {
      console.log('Starting mermaid initialization');
      void initializeMermaid();
    } else {
      console.log('No mermaid code provided');
      setIsLoading(false);
      setError('No mermaid code provided');
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
    const container = document.getElementById(diagramId);
    if (container) {
      const svgElement = container.querySelector('svg');
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
    const container = document.getElementById(diagramId);
    if (container) {
      const svgElement = container.querySelector('svg');
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
        
        {/* Always render the container, but hide it while loading or if there's an error */}
        <div className="mermaid-container overflow-x-auto" style={{ display: isLoading || error ? 'none' : 'block' }}>
          <div 
            id={diagramId}
            className="w-full min-h-[200px]"
            style={{ 
              lineHeight: 1.5,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start'
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MermaidDiagram;
