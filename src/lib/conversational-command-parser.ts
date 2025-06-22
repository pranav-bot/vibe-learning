// Enhanced Conversational Command Parser
// Supports both traditional CLI commands and natural language commands
// Examples: "/solve all problems on page 28" or "/visualize biology diagrams"
// Now supports topic references with @<topic> syntax

// Topic data structure
export interface TopicData {
  topic_name: string;
  topic_page_start: number;
  topic_page_end: number;
  topic_summary: string;
}

export interface ExtractedTopics {
  topics: TopicData[];
}

export interface ConversationalCommand {
  name: string;
  description: string;
  patterns: RegExp[];
  examples: string[];
  execute: (parsed: ParsedConversationalCommand, context?: CommandContext) => CommandResult | Promise<CommandResult>;
}

export interface ParsedConversationalCommand {
  command: string;
  action?: string;
  target?: string;
  modifiers?: string[];
  location?: string;
  topicReference?: string; // New: referenced topic name
  referencedTopic?: TopicData; // New: actual topic data
  originalText: string;
  confidence: number;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: unknown;
  type?: 'info' | 'success' | 'warning' | 'error';
  actions?: CommandAction[];
}

export interface ChainedCommand {
  parsed: ParsedConversationalCommand;
  order: number;
}

export interface ChainedCommandResult {
  success: boolean;
  message: string;
  results: CommandResult[];
  totalExecuted: number;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export interface CommandAction {
  type: 'navigate' | 'highlight' | 'extract' | 'visualize' | 'analyze';
  target: string;
  parameters?: Record<string, unknown>;
}

export interface CommandContext {
  contentData?: {
    title?: string;
    content_type?: string;
    total_pages?: number;
    subjects?: string[];
  } | null;
  contentId?: string;
  currentPage?: number;
  previousCommandResult?: unknown;
  previousCommandType?: string;
  availableTopics?: ExtractedTopics; // New: available topics for referencing
}

export class ConversationalCommandParser {
  private commands = new Map<string, ConversationalCommand>();
  private nlpPatterns = new Map<string, RegExp[]>();

  constructor() {
    this.registerConversationalCommands();
    this.initializeNLPPatterns();
  }

  // Extract topic reference from command input
  private extractTopicReference(input: string): { cleanInput: string; topicReference?: string } {
    // Updated regex to include hyphens, underscores, and other common characters in topic names
    // Match @<topic_name> where topic_name can be any non-whitespace characters
    const topicRegex = /@(\S+)/g;
    const matches = input.match(topicRegex);
    
    if (matches && matches.length > 0) {
      // For now, take the first topic reference (could be extended to handle multiple)
      const topicReference = matches[0]?.replace('@', '').trim();
      
      // Special handling for compare and visualize commands - don't remove topic references
      if (input.startsWith('/compare') || input.startsWith('/visualize')) {
        return {
          cleanInput: input,
          topicReference
        };
      }
      
      // For other commands, remove the topic reference from the input but keep proper spacing
      const cleanInput = input.replace(topicRegex, '').replace(/\s+/g, ' ').trim();
      
      return {
        cleanInput,
        topicReference
      };
    }
    
    return { cleanInput: input };
  }

  // Find topic data by name (fuzzy matching)
  private findTopicByName(topicName: string, availableTopics?: ExtractedTopics): TopicData | undefined {
    if (!availableTopics?.topics) return undefined;
    
    const normalizedSearchName = topicName.toLowerCase().trim();
    
    // First try exact match
    let foundTopic = availableTopics.topics.find(topic => 
      topic.topic_name.toLowerCase() === normalizedSearchName
    );
    
    // If no exact match, try partial match
    foundTopic ??= availableTopics.topics.find(topic => 
      topic.topic_name.toLowerCase().includes(normalizedSearchName) ||
      normalizedSearchName.includes(topic.topic_name.toLowerCase())
    );
    
    return foundTopic;
  }

  private registerConversationalCommands() {
    // Solve command - handles problem-solving requests
    this.registerCommand({
      name: 'solve',
      description: 'Solve problems, equations, or exercises',
      patterns: [
        /^\/solve\s+(all\s+)?(problems?|exercises?|questions?)\s+(?:on\s+|from\s+)?(?:page\s+)?(\d+)(?:\s*-\s*(\d+))?/i,
        /^\/solve\s+(.*?)\s+(?:on\s+|from\s+)?(?:page\s+)?(\d+)/i,
        /^\/solve\s+(.*)/i
      ],
      examples: [
        '/solve all problems on page 28',
        '/solve exercises from page 15-20',
        '/solve quadratic equations @algebra',
        '/solve @physics problems',
        '/solve this differential equation'
      ],
      execute: (parsed, _context) => {
        return {
          success: true,
          message: `🚧 **Solve command is in development** - This feature will be available soon!`,
          data: {
            command: 'solve',
            target: parsed.target,
            status: 'in_development'
          },
          type: 'info'
        };
      }
    });

    // Visualize command - creates visual representations
    this.registerCommand({
      name: 'visualize',
      description: 'Create visual representations of concepts, diagrams, or data',
      patterns: [
        /^\/visualize\s+(all\s+)?(.*?)\s+(diagrams?|charts?|graphs?|figures?)/i,
        /^\/visualize\s+(.*?)\s+(?:from\s+|on\s+)?(?:page\s+)?(\d+)/i,
        /^\/visualize\s+(.*)/i
      ],
      examples: [
        '/visualize all biology diagrams',
        '/visualize molecular structures from page 45',
        '/visualize @chemistry concepts',
        '/visualize data trends @statistics',
        '/visualize this concept map'
      ],
      execute: async (parsed, _context) => {
        // Handle topic reference if present
        if (parsed.referencedTopic) {
          console.log(`🎯 Visualizing with topic context:`, parsed.referencedTopic);
          console.log(`📖 Topic: ${parsed.referencedTopic.topic_name} (Pages ${parsed.referencedTopic.topic_page_start}-${parsed.referencedTopic.topic_page_end})`);
          
          try {
            // Call the visualize API with topic context
            const response = await fetch('/api/trpc/content.visualizeContent', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                json: {
                  userQuery: parsed.target ?? '',
                  difficulty: 'intermediate', // Could be made configurable
                  topic: parsed.referencedTopic
                }
              })
            });

            if (!response.ok) {
              throw new Error(`API call failed: ${response.status}`);
            }

            const result = await response.json() as {
              result?: {
                data?: {
                  json?: {
                    success?: boolean;
                    data?: {
                      mermaidCode?: string;
                      diagram_type?: string;
                      explanation?: string;
                      key_insights?: string;
                      educational_value?: string;
                    };
                  };
                };
              };
            };
            
            // Handle the TRPC response structure correctly
            const apiResponse = result.result?.data?.json;
            
            if (apiResponse?.success && apiResponse.data) {
              const visualData = apiResponse.data;
              return {
                success: true,
                message: `📊 **Visualization Generated**\n\n**Type:** ${visualData.diagram_type}\n\n**Explanation:** ${visualData.explanation}\n\n**Key Insights:** ${visualData.key_insights}\n\n**Educational Value:** ${visualData.educational_value}`,
                data: {
                  command: 'visualize',
                  target: parsed.target,
                  topicContext: parsed.referencedTopic,
                  visualization: visualData,
                  // Add mermaid-specific data for rendering
                  mermaidDiagram: {
                    mermaidCode: visualData.mermaidCode,
                    title: `${visualData.diagram_type} - ${parsed.referencedTopic?.topic_name}`,
                    description: visualData.explanation
                  }
                },
                type: 'success'
              };
            } else {
              console.error('API response structure:', result);
              throw new Error('API returned unsuccessful result or missing visualization data');
            }
          } catch (error) {
            console.error('Error calling visualize API:', error);
            return {
              success: false,
              message: `❌ **Failed to generate visualization**: ${error instanceof Error ? error.message : 'Unknown error'}`,
              type: 'error'
            };
          }
        } else {
          return {
            success: false,
            message: '❌ **Visualization requires a topic reference** - Use @<topic_name> to specify which topic to visualize',
            type: 'error'
          };
        }
      }
    });

    // Explain command - provides detailed explanations
    this.registerCommand({
      name: 'explain',
      description: 'Provide detailed explanations of concepts or sections',
      patterns: [
        /^\/explain\s+(.*?)\s+(?:on\s+|from\s+)?(?:page\s+)?(\d+)/i,
        /^\/explain\s+(step\s+by\s+)?(.*)/i,
        /^\/explain\s+(.+)/i,  // More flexible - require at least one character
        /^\/explain$/i         // Handle case with no arguments
      ],
      examples: [
        '/explain photosynthesis on page 67',
        '/explain step by step this process',
        '/explain @biology in terms of recent ai development',
        '/explain @physics concepts',
        '/explain use cases of agents',
        '/explain quantum mechanics @physics',
        '/explain the highlighted section',
        '/analyze patterns and /explain their significance'
      ],
      execute: async (parsed, context) => {
        // Handle topic reference if present
        if (parsed.referencedTopic) {
          console.log(`🎯 Explaining with topic context:`, parsed.referencedTopic);
          console.log(`📖 Topic: ${parsed.referencedTopic.topic_name} (Pages ${parsed.referencedTopic.topic_page_start}-${parsed.referencedTopic.topic_page_end})`);
          
          try {
            // Call the explain API with topic context
            const response = await fetch('/api/trpc/content.explainContent', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                json: {
                  contentId: context?.contentId,
                  userQuery: parsed.target ?? '',
                  difficulty: 'intermediate', // Could be made configurable
                  topic: parsed.referencedTopic
                }
              })
            });

            if (!response.ok) {
              throw new Error(`API call failed: ${response.status}`);
            }

            const result = await response.json() as {
              result?: {
                data?: {
                  json?: {
                    success?: boolean;
                    data?: { explanation?: string };
                  };
                };
              };
            };
            
            // Handle the TRPC response structure correctly
            const apiResponse = result.result?.data?.json;
            
            if (apiResponse?.success && apiResponse.data?.explanation) {
              return {
                success: true,
                message: `💡 **Explanation Generated**\n\n${apiResponse.data.explanation}`,
                data: {
                  command: 'explain',
                  target: parsed.target,
                  topicContext: parsed.referencedTopic,
                  explanation: apiResponse.data.explanation
                },
                type: 'success'
              };
            } else {
              console.error('API response structure:', result);
              throw new Error('API returned unsuccessful result or missing explanation');
            }
          } catch (error) {
            console.error('Error calling explain API:', error);
            return {
              success: false,
              message: `❌ **Failed to generate explanation**: ${error instanceof Error ? error.message : 'Unknown error'}`,
              type: 'error'
            };
          }
        } else {
          // No topic reference - use current page number
          const currentPage = context?.currentPage ?? 1;
          console.log(`📄 Explaining with page context: Page ${currentPage}`);
          
          try {
            // Call the explain API with page context
            const response = await fetch('/api/trpc/content.explainContent', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                json: {
                  contentId: context?.contentId,
                  userQuery: parsed.target ?? '',
                  difficulty: 'intermediate', // Could be made configurable
                  pageNumber: currentPage
                }
              })
            });

            if (!response.ok) {
              throw new Error(`API call failed: ${response.status}`);
            }

            const result = await response.json() as {
              result?: {
                data?: {
                  json?: {
                    success?: boolean;
                    data?: { explanation?: string };
                  };
                };
              };
            };
            
            // Handle the TRPC response structure correctly
            const apiResponse = result.result?.data?.json;
            
            if (apiResponse?.success && apiResponse.data?.explanation) {
              return {
                success: true,
                message: `💡 **Explanation Generated** (Page ${currentPage})\n\n${apiResponse.data.explanation}`,
                data: {
                  command: 'explain',
                  target: parsed.target,
                  pageContext: currentPage,
                  explanation: apiResponse.data.explanation
                },
                type: 'success'
              };
            } else {
              console.error('API response structure:', result);
              throw new Error('API returned unsuccessful result or missing explanation');
            }
          } catch (error) {
            console.error('Error calling explain API:', error);
            return {
              success: false,
              message: `❌ **Failed to generate explanation**: ${error instanceof Error ? error.message : 'Unknown error'}`,
              type: 'error'
            };
          }
        }
      }
    });

    // Navigate command - smart navigation
    this.registerCommand({
      name: 'goto',
      description: 'Navigate to specific pages, sections, or topics',
      patterns: [
        /^\/goto\s+(?:page\s+)?(\d+)/i,
        /^\/goto\s+(.*?)\s+section/i,
        /^\/goto\s+(.*)/i
      ],
      examples: [
        '/goto page 42',
        '/goto chapter 5',
        '/goto conclusion section',
        '/goto bibliography'
      ],
      execute: (parsed, _context) => {
        return {
          success: true,
          message: `🚧 **Goto command is in development** - This feature will be available soon!`,
          data: {
            command: 'goto',
            target: parsed.target,
            status: 'in_development'
          },
          type: 'info'
        };
      }
    });

    // Analyze command - content analysis
    this.registerCommand({
      name: 'analyze',
      description: 'Perform deep analysis of content, patterns, or relationships',
      patterns: [
        /^\/analyze\s+(.*?)\s+(?:on\s+|from\s+)?(?:page\s+)?(\d+)/i,
        /^\/analyze\s+(trends?|patterns?|relationships?)\s+in\s+(.*)/i,
        /^\/analyze\s+(.*)/i
      ],
      examples: [
        '/analyze key concepts on page 15',
        '/analyze trends in this data',
        '/analyze relationships between variables',
        '/analyze writing style',
        '/analyze trends of last 10 years and /explain with regard to biology data'
      ],
      execute: (parsed, _context) => {
        return {
          success: true,
          message: `🚧 **Analyze command is in development** - This feature will be available soon!`,
          data: {
            command: 'analyze',
            target: parsed.target,
            status: 'in_development'
          },
          type: 'info'
        };
      }
    });

    // Help command - shows available conversational commands
    this.registerCommand({
      name: 'help',
      description: 'Show available conversational commands and usage examples',
      patterns: [
        /^\/help$/i,
        /^\/help\s+(.*)$/i
      ],
      examples: [
        '/help',
        '/help solve',
        '/help commands',
        '/analyze trends and /explain results',
        '/solve problem and /visualize solution'
      ],
      execute: (parsed, _context) => {
        const { target } = parsed;
        
        if (target) {
          // Help for specific command
          const command = this.commands.get(target.toLowerCase());
          if (command) {
            let help = `**/${command.name}** - ${command.description}\n\n`;
            help += `**Examples:**\n`;
            command.examples.forEach(example => {
              help += `• \`${example}\`\n`;
            });
            
            // Add development status for non-implemented commands
            if (['solve', 'goto', 'analyze', 'help'].includes(command.name)) {
              help += `\n🚧 **Status:** In Development`;
            }
            
            return {
              success: true,
              message: help,
              type: 'info'
            };
          } else {
            return {
              success: false,
              message: `Command '${target}' not found. Use /help to see all commands.`,
              type: 'error'
            };
          }
        }

        // General help with development status
        let helpMessage = this.getCommandHelp();
        helpMessage += `\n🚧 **Development Status:**\n`;
        helpMessage += `• **Fully Available:** /explain, /compare, /visualize\n`;
        helpMessage += `• **In Development:** /solve, /goto, /analyze, /help\n`;
        
        return {
          success: true,
          message: helpMessage,
          type: 'info'
        };
      }
    });

    // Compare command - compares two topics
    this.registerCommand({
      name: 'compare',
      description: 'Compare two topics to understand their similarities, differences, and relationships',
      patterns: [
        /^\/compare\s+@(\S+)\s+(?:and|with|vs|versus)\s+@(\S+)/i,
        /^\/compare\s+@(\S+)\s+@(\S+)/i,
        /^\/compare\s+(.*?)\s+(?:and|with|vs|versus)\s+(.*)/i,
        /^\/compare\s+(.*)/i
      ],
      examples: [
        '/compare @algebra and @calculus',
        '/compare @biology vs @chemistry',
        '/compare @machine-learning with @deep-learning',
        '/compare photosynthesis and cellular respiration',
        '/compare linear regression versus logistic regression'
      ],
      execute: async (parsed, context) => {
        // Extract two topic references from the command
        const input = parsed.originalText;
        const topicRegex = /@(\S+)/g;
        const topicMatches = input.match(topicRegex);
        
        if (!topicMatches || topicMatches.length < 2) {
          return {
            success: false,
            message: '❌ **Compare requires two topic references** - Use format: `/compare @topic1 and @topic2`',
            type: 'error'
          };
        }

        const topic1Name = topicMatches[0]?.replace('@', '').trim();
        const topic2Name = topicMatches[1]?.replace('@', '').trim();

        if (!topic1Name || !topic2Name) {
          return {
            success: false,
            message: '❌ **Invalid topic references** - Please use valid topic names',
            type: 'error'
          };
        }

        // Find both topics in available topics
        const topic1 = context?.availableTopics ? this.findTopicByName(topic1Name, context.availableTopics) : undefined;
        const topic2 = context?.availableTopics ? this.findTopicByName(topic2Name, context.availableTopics) : undefined;

        if (!topic1) {
          return {
            success: false,
            message: `❌ **Topic "${topic1Name}" not found** - Please check available topics`,
            type: 'error'
          };
        }

        if (!topic2) {
          return {
            success: false,
            message: `❌ **Topic "${topic2Name}" not found** - Please check available topics`,
            type: 'error'
          };
        }

        try {
          console.log(`🔍 Comparing topics:`, topic1, topic2);
          
          // Call the compare API
          const response = await fetch('/api/trpc/content.compareTopics', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              json: {
                topic1: topic1,
                topic2: topic2
              }
            })
          });

          if (!response.ok) {
            throw new Error(`API call failed: ${response.status}`);
          }

          const result = await response.json() as {
            result?: {
              data?: {
                json?: {
                  success?: boolean;
                  data?: {
                    topic1?: { name: string; summary: string; key_concepts: string[]; strengths: string[]; limitations: string[] };
                    topic2?: { name: string; summary: string; key_concepts: string[]; strengths: string[]; limitations: string[] };
                    comparison?: {
                      similarities: string[];
                      differences: string[];
                      complementary_aspects: string[];
                      use_cases: {
                        when_to_use_topic1: string[];
                        when_to_use_topic2: string[];
                      };
                    };
                    overall_analysis?: {
                      relationship: string;
                      recommendation: string;
                      learning_sequence: string;
                    };
                  };
                };
              };
            };
          };
          
          // Handle the TRPC response structure correctly
          const apiResponse = result.result?.data?.json;
          
          if (apiResponse?.success && apiResponse.data) {
            const comparisonData = apiResponse.data;
            
            // Format the comparison result nicely
            let message = `🔍 **Topic Comparison: ${comparisonData.topic1?.name} vs ${comparisonData.topic2?.name}**\n\n`;
            
            // Add similarities
            if (comparisonData.comparison?.similarities?.length) {
              message += `**🤝 Similarities:**\n`;
              comparisonData.comparison.similarities.forEach(sim => message += `• ${sim}\n`);
              message += '\n';
            }
            
            // Add differences
            if (comparisonData.comparison?.differences?.length) {
              message += `**🆚 Key Differences:**\n`;
              comparisonData.comparison.differences.forEach(diff => message += `• ${diff}\n`);
              message += '\n';
            }
            
            // Add relationship and recommendation
            if (comparisonData.overall_analysis) {
              message += `**🔗 Relationship:** ${comparisonData.overall_analysis.relationship}\n\n`;
              message += `**💡 Recommendation:** ${comparisonData.overall_analysis.recommendation}\n\n`;
              message += `**📚 Learning Sequence:** ${comparisonData.overall_analysis.learning_sequence}\n`;
            }
            
            return {
              success: true,
              message,
              data: {
                command: 'compare',
                topic1: topic1,
                topic2: topic2,
                comparison: comparisonData
              },
              type: 'success'
            };
          } else {
            console.error('API response structure:', result);
            throw new Error('API returned unsuccessful result or missing comparison data');
          }
        } catch (error) {
          console.error('Error calling compare API:', error);
          return {
            success: false,
            message: `❌ **Failed to generate comparison**: ${error instanceof Error ? error.message : 'Unknown error'}`,
            type: 'error'
          };
        }
      }
    });
  }

  private initializeNLPPatterns() {
    // Common action words and their mappings
    this.nlpPatterns.set('solve', [
      /\b(solve|calculate|compute|find|determine)\b/i,
      /\b(problems?|exercises?|equations?|questions?)\b/i
    ]);

    this.nlpPatterns.set('visualize', [
      /\b(visualize|show|display|draw|create|generate)\b/i,
      /\b(diagrams?|charts?|graphs?|figures?|images?|visuals?)\b/i
    ]);

    this.nlpPatterns.set('explain', [
      /\b(explain|describe|clarify|elaborate|detail)\b/i,
      /\b(concept|process|method|theory|principle)\b/i
    ]);

    this.nlpPatterns.set('analyze', [
      /\b(analyze|examine|study|investigate|review)\b/i,
      /\b(trends?|patterns?|relationships?|data|statistics?)\b/i
    ]);
  }

  private extractSubject(text: string): string {
    const subjects = ['biology', 'chemistry', 'physics', 'mathematics', 'math', 'economics', 'history', 'literature'];
    const found = subjects.find(subject => 
      text.toLowerCase().includes(subject)
    );
    return found ?? 'general';
  }

  private extractModifiers(text: string): string[] {
    const modifiers: string[] = [];
    if (/\ball\b/i.test(text)) modifiers.push('all');
    if (/\bstep\s+by\s+step\b/i.test(text)) modifiers.push('step by step');
    if (/\bdetailed?\b/i.test(text)) modifiers.push('detailed');
    if (/\bquick(ly)?\b/i.test(text)) modifiers.push('quick');
    return modifiers;
  }

  parseConversationalCommand(input: string, context?: CommandContext): ParsedConversationalCommand | null {
    if (!input.startsWith('/')) {
      return null;
    }

    // Extract topic reference first
    const { cleanInput, topicReference } = this.extractTopicReference(input);
    
    // Find the referenced topic if available
    let referencedTopic: TopicData | undefined;
    if (topicReference && context?.availableTopics) {
      referencedTopic = this.findTopicByName(topicReference, context.availableTopics);
      if (!referencedTopic) {
        console.warn(`Topic "${topicReference}" not found in available topics`);
      }
    }

    // Try to match against registered command patterns using clean input
    for (const [commandName, command] of this.commands) {
      for (const pattern of command.patterns) {
        const match = cleanInput.match(pattern);
        if (match) {
          const parsed: ParsedConversationalCommand = {
            command: commandName,
            originalText: input,
            topicReference,
            referencedTopic,
            confidence: referencedTopic ? 0.95 : 0.9  // Higher confidence when topic is found
          };

          // Special handling for explain command when topic reference is present
          if (commandName === 'explain' && topicReference) {
            // For explain commands with topic references, treat the remaining text as the target/query
            const remainingTextMatch = /^\/explain\s+(.*)/i.exec(cleanInput);
            if (remainingTextMatch) {
              parsed.target = remainingTextMatch[1]?.trim() ?? '';
            }
          } else {
            // Standard pattern matching for other commands or explain without topic reference
            // Extract common elements based on the pattern
            if (match.length > 1) {
              parsed.action = match[1]?.trim();
            }
            if (match.length > 2) {
              parsed.target = match[2]?.trim();
            }
            if (match.length > 3) {
              parsed.location = match[3]?.trim();
            }
          }

          parsed.modifiers = this.extractModifiers(cleanInput);
          
          return parsed;
        }
      }
    }

    // Fallback: try to extract basic command structure
    const basicRegex = /^\/(\w+)\s+(.*)/;
    const basicMatch = basicRegex.exec(cleanInput);
    if (basicMatch) {
      return {
        command: basicMatch[1] ?? 'unknown',
        target: basicMatch[2] ?? '',
        originalText: input,
        topicReference,
        referencedTopic,
        confidence: referencedTopic ? 0.6 : 0.5,
        modifiers: this.extractModifiers(cleanInput)
      };
    }

    return null;
  }

  async executeConversationalCommand(input: string, context?: CommandContext): Promise<CommandResult | ChainedCommandResult> {
    // Check if input contains command chaining (multiple commands separated by "and")
    if (this.isChainedCommand(input)) {
      return this.executeChainedCommands(input, context);
    }

    const parsed = this.parseConversationalCommand(input, context);
    
    if (!parsed) {
      return {
        success: false,
        message: 'Invalid command format. Commands should start with "/" followed by an action.',
        type: 'error'
      };
    }

    // If topic was referenced but not found, treat it as normal text in the target
    if (parsed.topicReference && !parsed.referencedTopic) {
      // Instead of showing error, include the topic reference as part of the target text
      parsed.target = parsed.target ? `${parsed.target} @${parsed.topicReference}` : `@${parsed.topicReference}`;
      console.log(`Topic "@${parsed.topicReference}" not found, treating as normal text`);
    }

    const command = this.commands.get(parsed.command);
    if (!command) {
      return {
        success: false,
        message: `Unknown command: /${parsed.command}. Available commands: ${Array.from(this.commands.keys()).join(', ')}`,
        type: 'error'
      };
    }

    try {
      const result = command.execute(parsed, context);
      // Handle both sync and async commands
      return await Promise.resolve(result);
    } catch (error) {
      return {
        success: false,
        message: `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      };
    }
  }

  private isChainedCommand(input: string): boolean {
    // Check for command chaining patterns like "and /" or " and /"
    return /\s+and\s+\/\w+/.test(input);
  }

  private parseChainedCommands(input: string, context?: CommandContext): ChainedCommand[] {
    // Split the input by "and /" pattern while preserving the "/" for each command
    const commandParts = input.split(/\s+and\s+(?=\/)/i);
    
    const chainedCommands: ChainedCommand[] = [];
    
    commandParts.forEach((part, index) => {
      const trimmedPart = part.trim();
      if (trimmedPart.startsWith('/')) {
        const parsed = this.parseConversationalCommand(trimmedPart, context);
        if (parsed) {
          chainedCommands.push({
            parsed,
            order: index + 1
          });
        }
      }
    });

    return chainedCommands;
  }

  private async executeChainedCommands(input: string, context?: CommandContext): Promise<ChainedCommandResult> {
    const chainedCommands = this.parseChainedCommands(input, context);
    
    if (chainedCommands.length === 0) {
      return {
        success: false,
        message: 'No valid commands found in the chain.',
        results: [],
        totalExecuted: 0,
        type: 'error'
      };
    }

    const results: CommandResult[] = [];
    let successCount = 0;
    let enhancedContext = { ...context };

    // Execute commands in sequence
    for (const chainedCommand of chainedCommands) {
      const command = this.commands.get(chainedCommand.parsed.command);
      
      if (!command) {
        const errorResult: CommandResult = {
          success: false,
          message: `Unknown command: /${chainedCommand.parsed.command}`,
          type: 'error'
        };
        results.push(errorResult);
        continue;
      }

      try {
        // Execute the command with the enhanced context from previous commands
        const result = await Promise.resolve(command.execute(chainedCommand.parsed, enhancedContext));
        results.push(result);
        
        if (result.success) {
          successCount++;
          // Pass the result data to the next command's context
          if (result.data) {
            enhancedContext = {
              ...enhancedContext,
              previousCommandResult: result.data,
              previousCommandType: chainedCommand.parsed.command
            };
          }
        }
      } catch (error) {
        const errorResult: CommandResult = {
          success: false,
          message: `Error executing /${chainedCommand.parsed.command}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error'
        };
        results.push(errorResult);
      }
    }

    // Generate summary message
    const totalCommands = chainedCommands.length;
    let summaryMessage = `🔗 **Command Chain Executed** (${successCount}/${totalCommands} successful)\n\n`;
    
    results.forEach((result, index) => {
      const commandName = chainedCommands[index]?.parsed.command ?? 'unknown';
      const status = result.success ? '✅' : '❌';
      summaryMessage += `${status} **/${commandName}**: ${result.message}\n`;
    });

    return {
      success: successCount > 0,
      message: summaryMessage,
      results,
      totalExecuted: successCount,
      type: successCount === totalCommands ? 'success' : successCount > 0 ? 'warning' : 'error'
    };
  }

  registerCommand(command: ConversationalCommand): void {
    this.commands.set(command.name, command);
  }

  isCommand(input: string): boolean {
    return input.trim().startsWith('/');
  }

  getCommands(): ConversationalCommand[] {
    return Array.from(this.commands.values());
  }

  getCommandHelp(): string {
    const commands = Array.from(this.commands.values());
    let help = '🤖 **Conversational Commands Help**\n\n';
    
    commands.forEach(cmd => {
      help += `**/${cmd.name}** - ${cmd.description}\n`;
      help += `Examples:\n`;
      cmd.examples.forEach(example => {
        help += `  • \`${example}\`\n`;
      });
      help += '\n';
    });

    help += '\n💡 **Tips:**\n';
    help += '• Commands are conversational - use natural language\n';
    help += '• Specify page numbers for precise navigation\n';
    help += '• Use "all" to apply actions globally\n';
    help += '• **Reference topics** with @<topic_name> - e.g., `/explain @physics concepts`\n';
    help += '• Topic references provide context from extracted document topics\n';
    help += '• Combine actions for complex workflows\n';
    help += '• **Chain commands** with "and" - e.g., `/analyze trends and /explain results`\n';
    help += '• Chained commands pass data between each other for enhanced results\n';

    return help;
  }

  // Get list of available topic names for autocomplete
  getAvailableTopicNames(context?: CommandContext): string[] {
    if (!context?.availableTopics?.topics) return [];
    
    return context.availableTopics.topics.map(topic => topic.topic_name);
  }

  // Check if a topic reference exists
  hasTopicReference(input: string): boolean {
    return /@\w+/.test(input);
  }
}

// Export singleton instance
export const conversationalCommandParser = new ConversationalCommandParser();
