//TODO: fix cursor placement in input form

'use client';

import { useState, useRef, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Send, User, Bot, Copy, ThumbsUp, ThumbsDown, Terminal, X } from "lucide-react";
import { conversationalCommandParser, type CommandResult, type CommandAction } from "~/lib/conversational-command-parser";
import { MermaidDiagram } from "./Diagram";

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
  mermaidDiagram?: {
    mermaidCode: string;
    title: string;
    description: string;
  };
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
      content: `👋 Hi! I'm **Copilot Chat** for learning${difficultyConfig ? ` (${difficultyConfig.emoji} **${difficultyConfig.label}** level)` : ''}.\n\nI can help you understand **"${contentData?.title ?? 'this content'}"**. Ask me questions or try these commands:\n\n**💡 Quick Commands:**\n• \`/explain\` - Get detailed explanations\n• \`/solve\` - Help with problems\n• \`/visualize\` - Create diagrams${availableTopics?.topics.length ? `\n• \`/explain @${availableTopics.topics[0]?.topic_name}\` - Topic-specific help` : '\n• \`/explain @topic\` - Topic help (loading...)'}\n• \`/help\` - See all commands\n\n*What would you like to explore?*`,
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

        // Extract mermaid diagram data if this is a visualization command
        let mermaidDiagram: { mermaidCode: string; title: string; description: string; } | undefined;
        if ('data' in commandResult && 
            commandResult.data && 
            typeof commandResult.data === 'object' && 
            'mermaidDiagram' in commandResult.data &&
            commandResult.data.mermaidDiagram &&
            typeof commandResult.data.mermaidDiagram === 'object' &&
            'mermaidCode' in commandResult.data.mermaidDiagram &&
            'title' in commandResult.data.mermaidDiagram &&
            'description' in commandResult.data.mermaidDiagram) {
          mermaidDiagram = {
            mermaidCode: commandResult.data.mermaidDiagram.mermaidCode as string,
            title: commandResult.data.mermaidDiagram.title as string,
            description: commandResult.data.mermaidDiagram.description as string
          };
        }

        const commandResponseMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'system',
          content: commandResult.message,
          timestamp: new Date(),
          commandResult,
          actions: ('data' in commandResult && 'actions' in commandResult) ? commandResult.actions : undefined,
          mermaidDiagram
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
              className="bg-[#f59e0b]/30 text-[#fbbf24] px-1.5 py-0.5 rounded-md border border-[#f59e0b]/50 font-mono text-xs font-medium shadow-sm"
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
              className="bg-[#10b981]/30 text-[#34d399] px-1.5 py-0.5 rounded-md border border-[#10b981]/50 font-medium text-xs shadow-sm"
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
                className="bg-[#f59e0b]/30 text-[#fbbf24] px-1.5 py-0.5 rounded-md border border-[#f59e0b]/50 font-mono text-sm font-medium shadow-sm"
                title={`Valid command: ${token.value}`}
              >
                {token.value}
              </span>
            );
          } else {
            return (
              <span 
                key={index}
                className="bg-[#f59e0b]/15 text-[#f59e0b] px-1.5 py-0.5 rounded-md border border-[#f59e0b]/30 font-mono text-sm opacity-70"
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
                className="bg-[#10b981]/30 text-[#34d399] px-1.5 py-0.5 rounded-md border border-[#10b981]/50 font-medium text-sm shadow-sm"
                title={`Valid topic: ${token.value}`}
              >
                {token.value}
              </span>
            );
          } else if (token.isPartial) {
            return (
              <span 
                key={index}
                className="bg-[#10b981]/20 text-[#10b981] px-1.5 py-0.5 rounded-md border border-[#10b981]/35 font-medium text-sm"
                title={`Partial topic match: ${token.value}`}
              >
                {token.value}
              </span>
            );
          } else {
            return (
              <span 
                key={index}
                className="bg-[#10b981]/10 text-[#6b7280] px-1.5 py-0.5 rounded-md border border-[#10b981]/25 font-medium text-sm opacity-60"
                title={`Unknown topic: ${token.value}`}
              >
                {token.value}
              </span>
            );
          }
          
        case 'text':
        default:
          return (
            <span key={index} className="text-[#cccccc]">
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
    <div className="h-full flex flex-col bg-[#1e1e1e] text-[#cccccc]">
      {/* Chat Header */}
      <div className="border-b border-[#2d2d30] px-4 py-3 bg-[#252526]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-7 w-7 rounded-md bg-[#0078d4] flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-[#cccccc] font-medium text-sm">Copilot Chat</h3>
              <p className="text-xs text-[#8c8c8c]">Ask questions or use slash commands</p>
            </div>
          </div>
          {difficultyConfig && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#8c8c8c]">Level:</span>
              <div className="px-2 py-1 rounded-md bg-[#0078d4]/20 border border-[#0078d4]/30">
                <span className="text-xs text-[#4fc3f7]">{difficultyConfig.emoji} {difficultyConfig.label}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
        <div className="space-y-3 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className="px-4"
            >
              {message.type === 'user' ? (
                /* User Message */
                <div className="flex items-start space-x-3 justify-end">
                  <div className="flex-1 text-right max-w-[80%]">
                    <div className="inline-block px-4 py-3 rounded-2xl bg-[#0078d4] text-white text-sm shadow-sm">
                      <div className="whitespace-pre-wrap break-words">
                        {typeof highlightCommands(message.content) === 'string' 
                          ? message.content 
                          : highlightCommands(message.content)
                        }
                      </div>
                    </div>
                    <div className="text-xs text-[#8c8c8c] mt-1 mr-2">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-[#0078d4] flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                </div>
              ) : (
                /* Assistant/System Message */
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 h-7 w-7 rounded-md flex items-center justify-center ${
                    message.type === 'system'
                      ? 'bg-[#f59e0b] text-white'
                      : 'bg-[#0078d4] text-white'
                  }`}>
                    {message.type === 'system' ? (
                      <Terminal className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div className="flex-1 max-w-[90%]">
                    <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${
                      message.type === 'system'
                        ? `border border-l-4 ${
                            message.commandResult?.type === 'success' 
                              ? 'bg-[#0d7377]/20 border-l-[#10b981] border-[#10b981]/30' 
                              : message.commandResult?.type === 'error'
                              ? 'bg-[#dc2626]/20 border-l-[#dc2626] border-[#dc2626]/30'
                              : message.commandResult?.type === 'warning'
                              ? 'bg-[#f59e0b]/20 border-l-[#f59e0b] border-[#f59e0b]/30'
                              : 'bg-[#374151]/20 border-l-[#6b7280] border-[#6b7280]/30'
                          }`
                        : 'bg-[#2d2d30] text-[#cccccc] border border-[#3e3e42]'
                    }`}>
                      <div className="whitespace-pre-wrap break-words">
                        {typeof highlightCommands(message.content) === 'string' 
                          ? message.content 
                          : highlightCommands(message.content)
                        }
                      </div>
                      
                      {/* Render Mermaid diagram if available */}
                      {message.mermaidDiagram && (
                        <div className="mt-4 border-t border-[#3e3e42] pt-4">
                          <MermaidDiagram
                            mermaidCode={message.mermaidDiagram.mermaidCode}
                            title={message.mermaidDiagram.title}
                            description={message.mermaidDiagram.description}
                            className="max-w-full"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Message Actions */}
                    <div className="flex items-center space-x-1 mt-2 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(message.content)}
                        className="h-6 w-6 p-0 text-[#8c8c8c] hover:text-[#cccccc] hover:bg-[#3e3e42]"
                        title="Copy message"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      {message.type === 'assistant' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-[#8c8c8c] hover:text-[#cccccc] hover:bg-[#3e3e42]"
                            title="Good response"
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-[#8c8c8c] hover:text-[#cccccc] hover:bg-[#3e3e42]"
                            title="Poor response"
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      <div className="text-xs text-[#8c8c8c] ml-2">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="px-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 h-7 w-7 rounded-md bg-[#0078d4] flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="inline-block px-4 py-3 rounded-2xl bg-[#2d2d30] border border-[#3e3e42]">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-[#0078d4] rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-[#0078d4] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-[#0078d4] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-[#8c8c8c]">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="px-4 py-3 border-t border-[#2d2d30] bg-[#252526]">
          <p className="text-xs text-[#8c8c8c] mb-3 font-medium">Try asking:</p>
          <div className="grid grid-cols-1 gap-2">
            {suggestedQuestions.slice(0, 6).map((question, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => {
                  const commandText = question.startsWith('/') ? question.split(' - ')[0] : question;
                  setInputValue(commandText ?? question);
                }}
                className="w-full text-left justify-start text-xs text-[#cccccc] hover:bg-[#2d2d30] h-auto py-2 px-3 rounded-md border border-[#3e3e42] hover:border-[#0078d4]/50 transition-colors"
              >
                <div className="flex items-center space-x-2 w-full">
                  {question.startsWith('/') ? (
                    <Terminal className="h-3 w-3 text-[#0078d4] flex-shrink-0" />
                  ) : (
                    <Bot className="h-3 w-3 text-[#8c8c8c] flex-shrink-0" />
                  )}
                  <span className="truncate">{question}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-[#2d2d30] p-4 bg-[#1e1e1e] relative">
        <div className="flex space-x-3 items-end">
          <div className="relative flex-1">
            {/* Input container with token-based decoration layer */}
            <div className="relative">
              {/* 3️⃣ DECORATION LAYER - Token highlighting overlay */}
              {hasSpecialTokens(inputValue) && (
                <div 
                  className={`absolute inset-0 px-3 py-3 pointer-events-none text-sm rounded-lg z-10 border ${
                    getDecorationStatus(inputValue) === 'command' 
                      ? 'bg-[#f59e0b]/10 border-[#f59e0b]/30'
                      : getDecorationStatus(inputValue) === 'topic'
                      ? 'bg-[#10b981]/10 border-[#10b981]/30'
                      : getDecorationStatus(inputValue) === 'mixed'
                      ? 'bg-[#8b5cf6]/10 border-[#8b5cf6]/30'
                      : 'border-[#3e3e42]'
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
                placeholder="Ask Copilot a question or type / for commands..."
                className={`w-full resize-none rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078d4] disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] max-h-[120px] overflow-y-auto relative z-20 transition-all ${
                  getDecorationStatus(inputValue) === 'command'
                    ? 'border border-[#f59e0b]/50 ring-1 ring-[#f59e0b]/30'
                    : getDecorationStatus(inputValue) === 'topic'
                    ? 'border border-[#10b981]/50 ring-1 ring-[#10b981]/30'
                    : getDecorationStatus(inputValue) === 'mixed'
                    ? 'border border-[#8b5cf6]/50 ring-1 ring-[#8b5cf6]/30'
                    : 'bg-[#2d2d30] text-[#cccccc] border border-[#3e3e42] hover:border-[#0078d4]/50'
                }`}
                style={{
                  color: hasSpecialTokens(inputValue) ? 'transparent' : '#cccccc',
                  caretColor: '#cccccc',
                  backgroundColor: hasSpecialTokens(inputValue) ? 'transparent' : '#2d2d30'
                }}
                disabled={isLoading}
                rows={1}
              />
            </div>
            
            {/* Command Suggestions Dropdown */}
            {showCommandSuggestions && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#252526] border border-[#3e3e42] rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
                <div className="p-3 border-b border-[#3e3e42] flex items-center justify-between">
                  <p className="text-xs text-[#8c8c8c] font-medium">Available Commands</p>
                  <button
                    onClick={() => setShowCommandSuggestions(false)}
                    className="text-[#8c8c8c] hover:text-[#cccccc] transition-colors p-1 rounded hover:bg-[#3e3e42]"
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
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-[#2d2d30] rounded flex items-start space-x-3 group transition-colors"
                      >
                        <Terminal className="h-4 w-4 text-[#f59e0b] mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[#cccccc] font-mono text-sm">{cmd.command}</div>
                          <div className="text-[#8c8c8c] text-xs mt-1 leading-relaxed">{cmd.description}</div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Topic Suggestions Dropdown */}
            {showTopicSuggestions && availableTopics?.topics.length && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#252526] border border-[#3e3e42] rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
                <div className="p-3 border-b border-[#3e3e42] flex items-center justify-between">
                  <p className="text-xs text-[#8c8c8c] font-medium">Available Topics</p>
                  <button
                    onClick={() => setShowTopicSuggestions(false)}
                    className="text-[#8c8c8c] hover:text-[#cccccc] transition-colors p-1 rounded hover:bg-[#3e3e42]"
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
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-[#2d2d30] rounded flex items-start space-x-3 group transition-colors"
                      >
                        <div className="h-4 w-4 bg-[#10b981] rounded-sm flex items-center justify-center mt-0.5 flex-shrink-0">
                          <span className="text-white text-xs font-bold">#</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[#cccccc] font-medium text-sm">@{topicName}</div>
                          <div className="text-[#8c8c8c] text-xs mt-1 leading-relaxed truncate">
                            {availableTopics?.topics.find(t => t.topic_name === topicName)?.topic_summary.slice(0, 80)}...
                          </div>
                        </div>
                      </button>
                    )) : (
                      <div className="px-3 py-3 text-sm text-[#8c8c8c] text-center">
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
            className="bg-[#0078d4] hover:bg-[#106ebe] text-white h-11 px-4 rounded-lg transition-colors disabled:bg-[#3e3e42] disabled:text-[#8c8c8c]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Status indicators */}
        {getDecorationStatus(inputValue) === 'command' && !showCommandSuggestions && !showTopicSuggestions && (
          <div className="mt-3 text-xs text-[#f59e0b] bg-[#f59e0b]/10 px-3 py-2 rounded-md border border-[#f59e0b]/30 flex items-center space-x-2">
            <Terminal className="h-3 w-3" />
            <span>Command detected - Press Enter to execute</span>
          </div>
        )}
        
        {(getDecorationStatus(inputValue) === 'topic' || getDecorationStatus(inputValue) === 'mixed') && !showTopicSuggestions && !showCommandSuggestions && (
          <div className="mt-3 text-xs text-[#10b981] bg-[#10b981]/10 px-3 py-2 rounded-md border border-[#10b981]/30 flex items-center space-x-2">
            <div className="h-3 w-3 bg-[#10b981] rounded-sm flex items-center justify-center">
              <span className="text-white text-xs font-bold">#</span>
            </div>
            <span>Topic reference detected - Continue typing or press Enter</span>
          </div>
        )}
      </div>
    </div>
  );
}
