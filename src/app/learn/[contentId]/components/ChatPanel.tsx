//TODO: fix cursor placement in input form

'use client';

import { useState, useRef, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Send, User, Bot, Copy, ThumbsUp, ThumbsDown, MoreHorizontal, Terminal, X } from "lucide-react";
import { commandParser, type CommandResult } from "~/lib/command-parser";
import { conversationalCommandParser, type CommandResult as ConvCommandResult, type CommandAction } from "~/lib/conversational-command-parser";

// Import difficulty types
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

interface DifficultyConfig {
  level: DifficultyLevel;
  label: string;
  emoji: string;
  description: string;
  audience: string;
  aiInstructions: string;
}

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
  difficulty?: DifficultyLevel;
  difficultyConfig?: DifficultyConfig;
}

export function ChatPanel({ contentId, contentData, onCommandAction, difficulty: _difficulty = 'intermediate', difficultyConfig }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hello! I'm your AI learning assistant${difficultyConfig ? ` set to **${difficultyConfig.emoji} ${difficultyConfig.label}** level` : ''}. I can help you understand and analyze "${contentData?.title ?? 'this content'}". Feel free to ask me any questions about the material!\n\n💡 **Try conversational commands like:**\n• \`/solve all problems on page 28\`\n• \`/visualize biology diagrams\`\n• \`/explain photosynthesis step by step\`\n• \`/help\` for more commands`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);
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

  // Watch for difficulty changes and add system message
  useEffect(() => {
    if (difficultyConfig && messages.length > 1) { // Only after initial message
      const difficultyMessage: Message = {
        id: `difficulty-${Date.now()}`,
        type: 'system',
        content: `🎚️ **Difficulty level changed to ${difficultyConfig.emoji} ${difficultyConfig.label}**\n\n*I'll now adjust my responses for ${difficultyConfig.audience}: ${difficultyConfig.aiInstructions}*`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, difficultyMessage]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficultyConfig]);

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

    // Check if it's a valid command that should be executed
    const isValidCommandInput = (input: string): boolean => {
      if (!input.startsWith('/')) return false;
      
      const commandWord = input.split(' ')[0];
      return commandWord ? isValidCommand(commandWord) : false;
    };

    // Check if it's a command and if it's valid
    if (isValidCommandInput(messageInput) && (commandParser.isCommand(messageInput) || conversationalCommandParser.isCommand(messageInput))) {
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

  // Function to highlight commands in message content
  const highlightCommands = (content: string) => {
    // Regular expression to match only the command word (starting with / and followed by word characters)
    const commandRegex = /\/\w+/g;
    
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = commandRegex.exec(content)) !== null) {
      // Add text before the command
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }
      
      // Check if the command is valid before highlighting
      const command = match[0];
      const isValid = isValidCommand(command);
      
      if (isValid) {
        // Add the highlighted command (only if it's valid)
        parts.push(
          <span 
            key={match.index}
            className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 font-mono text-xs backdrop-blur-sm"
          >
            {command}
          </span>
        );
      } else {
        // Add as normal text if command is not valid
        parts.push(command);
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }
    
    return parts.length > 1 ? parts : content;
  };

  // Function to check if a command is valid
  const isValidCommand = (command: string) => {
    return availableCommands.some(cmd => cmd.command === command);
  };

  // Function to render input with command highlighting
  const renderInputWithHighlighting = (value: string) => {
    const commandRegex = /\/\w+/g;
    const match = commandRegex.exec(value);
    
    if (match && match.index === 0) {
      const commandPart = match[0];
      const remainingPart = value.slice(commandPart.length);
      const isValid = isValidCommand(commandPart);
      
      if (isValid) {
        return (
          <div className="flex items-center w-full overflow-hidden">
            <span className="bg-amber-500/40 text-amber-200 px-1.5 py-0.5 rounded border border-amber-500/50 font-mono text-sm backdrop-blur-sm whitespace-nowrap">
              {commandPart}
            </span>
            <span className="text-white ml-1 flex-1 min-w-0">
              {remainingPart}
              {/* Invisible cursor spacer to position the actual cursor correctly */}
              <span className="opacity-0">|</span>
            </span>
          </div>
        );
      }
    }
    
    // For invalid commands or non-commands, return plain text
    return <span className="text-white">{value}</span>;
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Show command suggestions only when user types '/' at the beginning
    if (value === '/' || (value.startsWith('/') && value.length <= 15 && !value.includes(' '))) {
      setShowCommandSuggestions(true);
    } else {
      setShowCommandSuggestions(false);
    }
  };

  const handleCommandSelect = (command: string) => {
    setInputValue(command + ' ');
    setShowCommandSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    } else if (e.key === 'Escape') {
      setShowCommandSuggestions(false);
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

  const availableCommands = [
    { command: "/help", description: "Show all available commands" },
    { command: "/solve", description: "Solve problems or equations" },
    { command: "/explain", description: "Explain concepts in detail" },
    { command: "/summarize", description: "Summarize content or sections" },
    { command: "/visualize", description: "Create visual representations" },
    { command: "/analyze", description: "Analyze data or trends" },
    { command: "/goto", description: "Navigate to specific page" },
    { command: "/quiz", description: "Generate quiz questions" },
    { command: "/highlight", description: "Highlight important points" },
    { command: "/translate", description: "Translate content" },
    { command: "/clear", description: "Clear chat history" },
    { command: "/save", description: "Save current session" }
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
                  <div className="whitespace-pre-wrap">
                    {typeof highlightCommands(message.content) === 'string' 
                      ? message.content 
                      : highlightCommands(message.content)
                    }
                  </div>
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
      <div className="border-t border-white/10 p-4 relative">
        <div className="flex space-x-2">
          <div className="relative flex-1">
            {/* Input field */}
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question or type a command (e.g., /help)..."
              className={`border-white/20 placeholder:text-gray-400 text-sm ${
                inputValue.startsWith('/') && isValidCommand(inputValue.split(' ')[0] ?? '')
                  ? 'bg-amber-900/30 border-amber-500/50 ring-1 ring-amber-500/30'
                  : 'bg-white/10 text-white'
              }`}
              disabled={isLoading}
              style={{
                color: inputValue.startsWith('/') && isValidCommand(inputValue.split(' ')[0] ?? '') ? 'transparent' : undefined,
                caretColor: inputValue.startsWith('/') && isValidCommand(inputValue.split(' ')[0] ?? '') ? 'white' : undefined
              }}
            />
            
            {/* Command highlighting overlay - only show when valid command */}
            {inputValue.startsWith('/') && isValidCommand(inputValue.split(' ')[0] ?? '') && (
              <div className="absolute inset-0 flex items-center px-3 pointer-events-none text-sm overflow-hidden">
                {renderInputWithHighlighting(inputValue)}
              </div>
            )}
            
            {/* Command Suggestions Dropdown */}
            {showCommandSuggestions && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 border border-white/20 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                <div className="p-2 border-b border-white/10 flex items-center justify-between">
                  <p className="text-xs text-gray-400">Available Commands:</p>
                  <button
                    onClick={() => setShowCommandSuggestions(false)}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                    title="Close suggestions"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="p-1">
                  {availableCommands
                    .filter(cmd => 
                      inputValue === '/' || 
                      cmd.command.toLowerCase().includes(inputValue.slice(1).toLowerCase())
                    )
                    .map((cmd, index) => (
                      <button
                        key={index}
                        onClick={() => handleCommandSelect(cmd.command)}
                        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded flex items-center justify-between group"
                      >
                        <div>
                          <span className="text-amber-300 font-mono">{cmd.command}</span>
                          <span className="text-gray-400 text-xs ml-2">{cmd.description}</span>
                        </div>
                        <div className="text-xs text-gray-500 opacity-0 group-hover:opacity-100">
                          Click to use
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
          
          <Button
            onClick={() => void handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {inputValue.startsWith('/') && isValidCommand(inputValue.split(' ')[0] ?? '') && !showCommandSuggestions && (
          <div className="mt-2 text-xs text-amber-300 bg-amber-900/20 px-2 py-1 rounded border border-amber-500/30">
            💡 Command detected - Press Enter to execute
          </div>
        )}
      </div>
    </div>
  );
}
