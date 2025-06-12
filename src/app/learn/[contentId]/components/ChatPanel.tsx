'use client';

import { useState, useRef, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Send, User, Bot, Copy, ThumbsUp, ThumbsDown, MoreHorizontal, Terminal } from "lucide-react";
import { commandParser, type CommandResult } from "~/lib/command-parser";
import { conversationalCommandParser, type CommandResult as ConvCommandResult, type CommandAction } from "~/lib/conversational-command-parser";

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  commandResult?: CommandResult | ConvCommandResult;
  actions?: CommandAction[];
}

interface ChatPanelProps {
  contentId: string;
  contentData: {
    title?: string;
    content_type?: string;
    total_pages?: number;
    subjects?: string[];
  } | null;
  onCommandAction?: (action: CommandAction) => void;
}

export function ChatPanel({ contentId, contentData, onCommandAction }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hello! I'm your AI learning assistant. I can help you understand and analyze "${contentData?.title ?? 'this content'}". Feel free to ask me any questions about the material!\n\n💡 **Try conversational commands like:**\n• \`/solve all problems on page 28\`\n• \`/visualize biology diagrams\`\n• \`/explain photosynthesis step by step\`\n• \`/help\` for more commands`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Remove unused contentId parameter warning by using it
  console.debug('ChatPanel initialized for content:', contentId);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageInput = inputValue.trim();
    setInputValue('');

    // Check if it's a command
    if (commandParser.isCommand(messageInput) || conversationalCommandParser.isCommand(messageInput)) {
      try {
        let commandResult: CommandResult | ConvCommandResult;
        
        // Try conversational parser first for richer commands
        const convParsed = conversationalCommandParser.parseConversationalCommand(messageInput);
        if (convParsed && convParsed.confidence > 0.7) {
          commandResult = conversationalCommandParser.executeConversationalCommand(messageInput, { 
            contentData, 
            contentId,
            currentPage: 1 // You can track current page state
          });
        } else {
          // Fall back to traditional command parser
          commandResult = commandParser.executeCommand(messageInput, { 
            contentData, 
            contentId 
          });
        }

        // Handle special command actions
        const commandData = commandResult.data as { action?: string } | undefined;
        if (commandData?.action === 'clear_chat') {
          setMessages([{
            id: Date.now().toString(),
            type: 'system',
            content: commandResult.message,
            timestamp: new Date(),
            commandResult
          }]);
          return;
        }

        // Execute command actions if available
        if ('actions' in commandResult && commandResult.actions && onCommandAction) {
          commandResult.actions.forEach(action => {
            onCommandAction(action);
          });
        }

        const commandResponseMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'system',
          content: commandResult.message,
          timestamp: new Date(),
          commandResult,
          actions: 'actions' in commandResult ? commandResult.actions : undefined
        };

        setMessages(prev => [...prev, commandResponseMessage]);
      } catch (error) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'system',
          content: `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          commandResult: {
            success: false,
            message: 'Command execution failed',
            type: 'error'
          }
        };
        setMessages(prev => [...prev, errorMessage]);
      }
      return;
    }

    // Regular chat message - simulate AI response
    setIsLoading(true);
    
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateMockResponse(),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 2000);
  };

  const generateMockResponse = (): string => {
    const responses = [
      "That's a great question! Based on the content you're studying, I can see that this relates to key concepts discussed in the material. Let me break this down for you...",
      "From my analysis of this content, here's what I found: The main points seem to focus on practical applications and theoretical foundations. Would you like me to elaborate on any specific aspect?",
      "I notice you're asking about a topic that's covered in depth in this material. The content provides several examples and explanations that might help clarify your understanding...",
      "That's an interesting perspective! The content actually touches on this subject in multiple sections. Let me highlight the most relevant parts for you...",
      "Based on the material you're studying, I can provide some insights. The content suggests that understanding this concept is crucial for grasping the broader themes discussed..."
    ];
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex] ?? "I'm here to help! Could you please rephrase your question?";
  };

  const copyToClipboard = (content: string) => {
    void navigator.clipboard.writeText(content);
  };

  const getSystemMessageBgColor = (type?: string) => {
    switch (type) {
      case 'success': return 'bg-green-600/80';
      case 'error': return 'bg-red-600/80';
      case 'warning': return 'bg-yellow-600/80';
      case 'info': 
      default: return 'bg-blue-600/80';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "Can you summarize the main points?",
    "What are the key takeaways?",
    "/solve all problems on page 5",
    "/visualize biology diagrams", 
    "/explain photosynthesis step by step",
    "/analyze trends in chapter 3",
    "/goto page 15",
    "/help - Show all commands"
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-white font-medium">AI Learning Assistant</h3>
            <p className="text-xs text-gray-400">Ask questions or use commands (type /help)</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 px-4 overflow-y-auto" ref={scrollAreaRef}>
        <div className="space-y-4 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                message.type === 'user' 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
                  : message.type === 'system'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500'
              }`}>
                {message.type === 'user' ? (
                  <User className="h-4 w-4 text-white" />
                ) : message.type === 'system' ? (
                  <Terminal className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-white" />
                )}
              </div>
              
              <div className={`flex-1 max-w-xs ${message.type === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block p-3 rounded-lg text-sm ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.type === 'system'
                    ? `${getSystemMessageBgColor(message.commandResult?.type)} text-white`
                    : 'bg-white/10 text-white'
                }`}>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
                
                {(message.type === 'assistant' || message.type === 'system') && (
                  <div className="flex items-center space-x-1 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(message.content)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    {message.type === 'assistant' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="inline-block p-3 rounded-lg bg-white/10">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="px-4 py-2 border-t border-white/10">
          <p className="text-xs text-gray-400 mb-2">Suggested questions and commands:</p>
          <div className="space-y-1">
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => {
                  const commandText = question.startsWith('/') ? question.split(' - ')[0] : question;
                  setInputValue(commandText ?? question);
                }}
                className="w-full text-left justify-start text-xs text-gray-300 hover:bg-white/10 h-8"
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-white/10 p-4">
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question or type a command (e.g., /help)..."
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={() => void handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {inputValue.startsWith('/') && (
          <div className="mt-2 text-xs text-amber-300">
            💡 Command detected - Press Enter to execute
          </div>
        )}
      </div>
    </div>
  );
}
