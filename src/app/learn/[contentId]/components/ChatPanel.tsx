//TODO: fix cursor placement in input form

'use client';

import { useState, useRef, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Send, User, Bot, Copy, ThumbsUp, ThumbsDown, MoreHorizontal, Terminal, X } from "lucide-react";
import { conversationalCommandParser, type CommandResult, type CommandAction } from "~/lib/conversational-command-parser";

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
  commandResult?: CommandResult;
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
  availableTopics?: { topics: { topic_name: string; topic_page_start: number; topic_page_end: number; topic_summary: string; }[] }; // New: extracted topics
}

export function ChatPanel({ contentId, contentData, onCommandAction, difficulty: _difficulty = 'intermediate', difficultyConfig, availableTopics }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hello! I'm your AI learning assistant${difficultyConfig ? ` set to **${difficultyConfig.emoji} ${difficultyConfig.label}** level` : ''}. I can help you understand and analyze "${contentData?.title ?? 'this content'}". Feel free to ask me any questions about the material!\n\n💡 **Try conversational commands like:**\n• \`/solve all problems on page 28\`\n• \`/visualize biology diagrams\`\n• \`/explain photosynthesis step by step\`${availableTopics?.topics.length ? `\n• \`/explain @${availableTopics.topics[0]?.topic_name} concepts\`` : '\n• \`/explain @topic concepts\` - (topics loading...)'}\n• \`/help\` for more commands`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);
  const [showTopicSuggestions, setShowTopicSuggestions] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Remove unused contentId parameter warning by using it
  console.debug('ChatPanel initialized for content:', contentId);
  console.debug('Available topics:', availableTopics?.topics?.length ?? 0, 'topics');

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  // Reset textarea height when input is cleared
  useEffect(() => {
    if (!inputValue && inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  }, [inputValue]);

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
    if (isValidCommandInput(messageInput) && conversationalCommandParser.isCommand(messageInput)) {
      try {
        setIsLoading(true);
        
        // Use only conversational parser for all commands
        const commandResult = await conversationalCommandParser.executeConversationalCommand(messageInput, { 
          contentData, 
          contentId,
          currentPage: 1,
          availableTopics // Pass available topics for topic resolution
        });

        setIsLoading(false);

        // Handle special command actions (only for single CommandResult, not ChainedCommandResult)
        if ('data' in commandResult) {
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
            commandResult.actions.forEach((action: CommandAction) => {
              onCommandAction(action);
            });
          }
        }

        const commandResponseMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'system',
          content: commandResult.message,
          timestamp: new Date(),
          commandResult,
          actions: ('data' in commandResult && 'actions' in commandResult) ? commandResult.actions : undefined
        };

        setMessages(prev => [...prev, commandResponseMessage]);
      } catch (error) {
        setIsLoading(false);
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

  // Function to highlight commands and topics in message content
  const highlightCommands = (content: string) => {
    // Updated regex to match commands and topics until next space character
    const combinedRegex = /(\/\S+|@\S+)/g;
    
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = combinedRegex.exec(content)) !== null) {
      // Add text before the command/topic
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }
      
      const matchedText = match[0];
      
      if (matchedText.startsWith('/')) {
        // Handle commands
        const isValid = isValidCommand(matchedText);
        
        if (isValid) {
          // Add the highlighted command (only if it's valid)
          parts.push(
            <span 
              key={match.index}
              className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 font-mono text-xs backdrop-blur-sm"
            >
              {matchedText}
            </span>
          );
        } else {
          // Add as normal text if command is not valid
          parts.push(matchedText);
        }
      } else if (matchedText.startsWith('@')) {
        // Handle topic references - now single words only
        const topicName = matchedText.substring(1); // Remove @ symbol
        const isValidTopic = availableTopics?.topics.some(topic => 
          topic.topic_name.toLowerCase() === topicName.toLowerCase()
        );
        
        if (isValidTopic) {
          // Add the highlighted topic (only if it's valid)
          parts.push(
            <span 
              key={match.index}
              className="bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded border border-green-500/30 font-medium text-xs backdrop-blur-sm"
            >
              {matchedText}
            </span>
          );
        } else {
          // Add as normal text if topic is not valid
          parts.push(matchedText);
        }
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
    const availableCommandNames = conversationalCommandParser.getCommands().map(cmd => `/${cmd.name}`);
    return availableCommandNames.includes(command);
  };

  // Function to get available topics matching current input
  const getMatchingTopics = (prefix: string): string[] => {
    if (!availableTopics?.topics) return [];
    
    const lowerPrefix = prefix.toLowerCase();
    return availableTopics.topics
      .filter(topic => topic.topic_name.toLowerCase().includes(lowerPrefix))
      .map(topic => topic.topic_name)
      .slice(0, 10); // Limit to 10 suggestions
  };

  // 🛠️ DECORATION LAYER - Token-based highlighting system
  
  // Token types for decoration
  type TokenType = 'command' | 'topic' | 'text';
  
  interface TextToken {
    type: TokenType;
    value: string;
    start: number;
    end: number;
    isValid?: boolean;
    isPartial?: boolean;
  }
  
  // 2️⃣ PARSER - Token scanning for commands and topics
  const parseTextTokens = (text: string): TextToken[] => {
    const tokens: TextToken[] = [];
    // Updated regex to match until next space character (includes hyphens, underscores, etc.)
    const commandRegex = /\/\S+/g;
    const topicRegex = /@\S+/g;
    
    let lastIndex = 0;
    const matches: { regex: RegExp; type: TokenType }[] = [
      { regex: commandRegex, type: 'command' },
      { regex: topicRegex, type: 'topic' }
    ];
    
    // Collect all matches with their positions
    const allMatches: { match: RegExpExecArray; type: TokenType }[] = [];
    
    matches.forEach(({ regex, type }) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        allMatches.push({ match, type });
      }
    });
    
    // Sort matches by position
    allMatches.sort((a, b) => a.match.index - b.match.index);
    
    // Build tokens
    allMatches.forEach(({ match, type }) => {
      // Add text before this match
      if (match.index > lastIndex) {
        tokens.push({
          type: 'text',
          value: text.slice(lastIndex, match.index),
          start: lastIndex,
          end: match.index
        });
      }
      
      // Add the matched token with validation
      const tokenValue = match[0];
      let isValid = false;
      let isPartial = false;
      
      if (type === 'command') {
        isValid = isValidCommand(tokenValue);
      } else if (type === 'topic') {
        const topicName = tokenValue.substring(1); // Remove @
        isValid = availableTopics?.topics.some(topic => 
          topic.topic_name.toLowerCase() === topicName.toLowerCase()
        ) ?? false;
        
        // Check for partial match if not valid
        if (!isValid) {
          isPartial = availableTopics?.topics.some(topic => 
            topic.topic_name.toLowerCase().includes(topicName.toLowerCase())
          ) ?? false;
        }
      }
      
      tokens.push({
        type,
        value: tokenValue,
        start: match.index,
        end: match.index + tokenValue.length,
        isValid,
        isPartial
      });
      
      lastIndex = match.index + tokenValue.length;
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
      tokens.push({
        type: 'text',
        value: text.slice(lastIndex),
        start: lastIndex,
        end: text.length
      });
    }
    
    return tokens;
  };
  
  // 3️⃣ DECORATION LAYER - Apply visual styles to tokens
  const renderTokenizedInput = (value: string) => {
    const tokens = parseTextTokens(value);
    
    return tokens.map((token, index) => {
      switch (token.type) {
        case 'command':
          if (token.isValid) {
            return (
              <span 
                key={index}
                className="bg-amber-500/40 text-amber-100 px-1.5 py-0.5 rounded border border-amber-400/50 font-mono text-sm font-medium shadow-sm"
                title={`Valid command: ${token.value}`}
              >
                {token.value}
              </span>
            );
          } else {
            return (
              <span 
                key={index}
                className="bg-amber-500/20 text-amber-200 px-1.5 py-0.5 rounded border border-amber-400/30 font-mono text-sm opacity-70"
                title={`Invalid command: ${token.value}`}
              >
                {token.value}
              </span>
            );
          }
          
        case 'topic':
          if (token.isValid) {
            return (
              <span 
                key={index}
                className="bg-green-500/40 text-green-100 px-1.5 py-0.5 rounded border border-green-400/50 font-medium text-sm shadow-sm"
                title={`Valid topic: ${token.value}`}
              >
                {token.value}
              </span>
            );
          } else if (token.isPartial) {
            return (
              <span 
                key={index}
                className="bg-green-500/25 text-green-200 px-1.5 py-0.5 rounded border border-green-400/35 font-medium text-sm"
                title={`Partial topic match: ${token.value}`}
              >
                {token.value}
              </span>
            );
          } else {
            return (
              <span 
                key={index}
                className="bg-green-500/15 text-green-300 px-1.5 py-0.5 rounded border border-green-400/25 font-medium text-sm opacity-60"
                title={`Unknown topic: ${token.value}`}
              >
                {token.value}
              </span>
            );
          }
          
        case 'text':
        default:
          return (
            <span key={index} className="text-white">
              {token.value}
            </span>
          );
      }
    });
  };
  
  // Helper function to check if input has any special tokens
  const hasSpecialTokens = (value: string): boolean => {
    const tokens = parseTextTokens(value);
    return tokens.some(token => token.type !== 'text');
  };
  
  // Helper function to get decoration status for input styling
  const getDecorationStatus = (value: string): 'command' | 'topic' | 'mixed' | 'none' => {
    const tokens = parseTextTokens(value);
    const hasCommands = tokens.some(token => token.type === 'command' && token.isValid);
    const hasTopics = tokens.some(token => token.type === 'topic' && (token.isValid ?? token.isPartial));
    
    if (hasCommands && hasTopics) return 'mixed';
    if (hasCommands) return 'command';
    if (hasTopics) return 'topic';
    return 'none';
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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
    
    // Check if we're currently typing a topic reference (@ followed by optional text)
    const atIndex = value.lastIndexOf('@');
    const isTypingTopic = atIndex !== -1;
    
    if (isTypingTopic && availableTopics?.topics.length) {
      // Extract what's being typed after the @ symbol (can be empty)
      const afterAt = value.substring(atIndex + 1);
      console.log('Topic reference detected:', { afterAt, availableTopicsCount: availableTopics.topics.length });
      
      // Get text until next space or end of string
      const nextSpaceIndex = afterAt.indexOf(' ');
      const topicText = nextSpaceIndex === -1 ? afterAt : afterAt.substring(0, nextSpaceIndex);
      
      // Check if the topic text is an exact topic match
      const isExactMatch = availableTopics.topics.some(topic => 
        topic.topic_name.toLowerCase() === topicText.toLowerCase()
      );
      
      // Show suggestions only if:
      // 1. We don't have an exact match yet and are actively typing
      // 2. We just typed @ (empty afterAt)
      // 3. We haven't reached a space yet (still typing the topic name)
      const isActivelyTyping = nextSpaceIndex === -1 || topicText.length > 0;
      const shouldShowSuggestions = !isExactMatch && isActivelyTyping;
      
      if (shouldShowSuggestions) {
        setShowTopicSuggestions(true);
        setShowCommandSuggestions(false);
        return;
      }
    }
    
    // Show command suggestions when typing / at start
    if (value === '/' || (value.startsWith('/') && value.length <= 15 && !value.includes(' '))) {
      setShowCommandSuggestions(true);
      setShowTopicSuggestions(false);
    } else {
      setShowCommandSuggestions(false);
      setShowTopicSuggestions(false);
    }
  };

  const handleCommandSelect = (command: string) => {
    const newValue = command + ' ';
    setInputValue(newValue);
    
    // Auto-resize textarea and set cursor position after setting value
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
        
        // Set cursor position at the end
        const cursorPosition = newValue.length;
        inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
        inputRef.current.focus();
      }
    }, 0);
    
    setShowCommandSuggestions(false);
    setShowTopicSuggestions(false);
  };

  const handleTopicSelect = (topicName: string) => {
    // Find the last @ symbol and replace everything after it with the selected topic
    const atIndex = inputValue.lastIndexOf('@');
    if (atIndex !== -1) {
      const beforeAt = inputValue.substring(0, atIndex);
      const newValue = beforeAt + '@' + topicName + ' ';
      setInputValue(newValue);
      
      // Auto-resize textarea and set cursor position after setting value
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.style.height = 'auto';
          inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
          
          // Set cursor position at the end
          const cursorPosition = newValue.length;
          inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
          inputRef.current.focus();
        }
      }, 0);
    }
    
    setShowTopicSuggestions(false);
    setShowCommandSuggestions(false);
  };

  const suggestedQuestions = [
    "Can you summarize the main points?",
    "What are the key takeaways?",
    "/solve all problems on page 5",
    "/visualize biology diagrams", 
    "/explain photosynthesis step by step",
    "/analyze trends in chapter 3",
    "/goto page 15",
    ...(availableTopics?.topics.length ? [
      `/explain @${availableTopics.topics[0]?.topic_name} concepts`,
      `/analyze @${availableTopics.topics[1]?.topic_name ?? availableTopics.topics[0]?.topic_name} with respect to recent developments`
    ] : []),
    "/help - Show all commands"
  ];

  const availableCommands = conversationalCommandParser.getCommands().map(cmd => ({
    command: `/${cmd.name}`,
    description: cmd.description
  }));

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
        <div className="flex space-x-2 items-end">
          <div className="relative flex-1">
            {/* Input container with token-based decoration layer */}
            <div className="relative">
              {/* 3️⃣ DECORATION LAYER - Token highlighting overlay */}
              {hasSpecialTokens(inputValue) && (
                <div 
                  className={`absolute inset-0 px-3 py-2 pointer-events-none text-sm rounded-md z-10 ${
                    getDecorationStatus(inputValue) === 'command' 
                      ? 'bg-amber-900/20 border border-amber-500/30'
                      : getDecorationStatus(inputValue) === 'topic'
                      ? 'bg-green-900/20 border border-green-500/30'
                      : getDecorationStatus(inputValue) === 'mixed'
                      ? 'bg-purple-900/20 border border-purple-500/30'
                      : 'border border-white/20'
                  }`}
                  style={{
                    fontSize: '14px',
                    lineHeight: '20px',
                    fontFamily: 'inherit',
                  }}
                >
                  <div className="whitespace-pre-wrap break-words min-h-[24px]">
                    {renderTokenizedInput(inputValue)}
                  </div>
                </div>
              )}
              
              {/* 1️⃣ TEXT INPUT AREA - Textarea field */}
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSendMessage();
                  } else if (e.key === 'Escape') {
                    setShowCommandSuggestions(false);
                    setShowTopicSuggestions(false);
                  }
                }}
                placeholder="Ask a question or type a command (e.g., /help)..."
                className={`w-full resize-none rounded-md px-3 py-2 text-sm ring-offset-background placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[40px] max-h-[120px] overflow-y-auto relative z-20 ${
                  getDecorationStatus(inputValue) === 'command'
                    ? 'border border-amber-500/50 ring-1 ring-amber-500/30'
                    : getDecorationStatus(inputValue) === 'topic'
                    ? 'border border-green-500/50 ring-1 ring-green-500/30'
                    : getDecorationStatus(inputValue) === 'mixed'
                    ? 'border border-purple-500/50 ring-1 ring-purple-500/30'
                    : 'bg-white/10 text-white border border-white/20'
                }`}
                style={{
                  color: hasSpecialTokens(inputValue) ? 'transparent' : 'white',
                  caretColor: 'white',
                  backgroundColor: hasSpecialTokens(inputValue) ? 'transparent' : 'rgb(255 255 255 / 0.1)'
                }}
                disabled={isLoading}
                rows={1}
              />
            </div>
            
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

            {/* Topic Suggestions Dropdown */}
            {showTopicSuggestions && availableTopics?.topics.length && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 border border-white/20 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                <div className="p-2 border-b border-white/10 flex items-center justify-between">
                  <p className="text-xs text-gray-400">Available Topics:</p>
                  <button
                    onClick={() => setShowTopicSuggestions(false)}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                    title="Close suggestions"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="p-1">
                  {(() => {
                    // Get the text after the last @ symbol
                    const atIndex = inputValue.lastIndexOf('@');
                    const afterAt = atIndex !== -1 ? inputValue.substring(atIndex + 1) : '';
                    
                    // Get text until next space or end of string
                    const nextSpaceIndex = afterAt.indexOf(' ');
                    const topicText = nextSpaceIndex === -1 ? afterAt : afterAt.substring(0, nextSpaceIndex);
                    const isStillTypingTopic = nextSpaceIndex === -1;
                    
                    if (!isStillTypingTopic && topicText.length === 0) return null;
                    
                    const matchingTopics = getMatchingTopics(topicText);
                    
                    return matchingTopics.length > 0 ? matchingTopics.map((topicName, index) => (
                      <button
                        key={index}
                        onClick={() => handleTopicSelect(topicName)}
                        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded flex items-center justify-between group"
                      >
                        <div>
                          <span className="text-green-300 font-medium">@{topicName}</span>
                          <span className="text-gray-400 text-xs ml-2">
                            {availableTopics?.topics.find(t => t.topic_name === topicName)?.topic_summary.slice(0, 60)}...
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 opacity-0 group-hover:opacity-100">
                          Click to use
                        </div>
                      </button>
                    )) : (
                      <div className="px-3 py-2 text-sm text-gray-400">
                        No topics found matching &ldquo;{topicText}&rdquo;
                      </div>
                    );
                  })()}
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
        
        {getDecorationStatus(inputValue) === 'command' && !showCommandSuggestions && !showTopicSuggestions && (
          <div className="mt-2 text-xs text-amber-300 bg-amber-900/20 px-2 py-1 rounded border border-amber-500/30">
            💡 Command detected - Press Enter to execute
          </div>
        )}
        
        {(getDecorationStatus(inputValue) === 'topic' || getDecorationStatus(inputValue) === 'mixed') && !showTopicSuggestions && !showCommandSuggestions && (
          <div className="mt-2 text-xs text-green-300 bg-green-900/20 px-2 py-1 rounded border border-green-500/30">
            🏷️ Topic reference detected - Continue typing or press Enter
          </div>
        )}
        
        {showTopicSuggestions && (
          <div className="mt-2 text-xs text-green-300 bg-green-900/20 px-2 py-1 rounded border border-green-500/30">
            🏷️ Type @ followed by topic name for contextual commands
          </div>
        )}
      </div>
    </div>
  );
}
