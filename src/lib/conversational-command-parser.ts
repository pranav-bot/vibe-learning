// Enhanced Conversational Command Parser
// Supports both traditional CLI commands and natural language commands
// Examples: "/solve all problems on page 28" or "/visualize biology diagrams"

export interface ConversationalCommand {
  name: string;
  description: string;
  patterns: RegExp[];
  examples: string[];
  execute: (parsed: ParsedConversationalCommand, context?: CommandContext) => CommandResult;
}

export interface ParsedConversationalCommand {
  command: string;
  action?: string;
  target?: string;
  modifiers?: string[];
  location?: string;
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
}

export class ConversationalCommandParser {
  private commands = new Map<string, ConversationalCommand>();
  private nlpPatterns = new Map<string, RegExp[]>();

  constructor() {
    this.registerConversationalCommands();
    this.initializeNLPPatterns();
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
        '/solve quadratic equations',
        '/solve this differential equation'
      ],
      execute: (parsed, _context) => {
        const { target, location, modifiers } = parsed;
        const isAll = modifiers?.includes('all');
        
        if (location) {
          const pageRegex = /(\d+)(?:\s*-\s*(\d+))?/;
          const pageMatch = pageRegex.exec(location);
          if (pageMatch) {
            const startPage = parseInt(pageMatch[1] ?? '1', 10);
            const endPage = pageMatch[2] ? parseInt(pageMatch[2], 10) : startPage;
            
            return {
              success: true,
              message: `🧮 **Solving ${isAll ? 'all ' : ''}${target || 'problems'} on page${endPage > startPage ? 's' : ''} ${startPage}${endPage > startPage ? `-${endPage}` : ''}**\n\n• Analyzing content structure...\n• Identifying mathematical expressions...\n• Applying solution algorithms...\n• Generating step-by-step solutions...\n\n*Solutions will be highlighted in the content viewer.*`,
              type: 'info',
              actions: [
                {
                  type: 'navigate',
                  target: 'page',
                  parameters: { page: startPage }
                },
                {
                  type: 'highlight',
                  target: 'problems',
                  parameters: { pages: [startPage, endPage], type: target }
                },
                {
                  type: 'analyze',
                  target: 'mathematical_content',
                  parameters: { solve: true, showSteps: true }
                }
              ]
            };
          }
        }

        return {
          success: true,
          message: `🧮 **Solving: ${target || 'identified problems'}**\n\n• Scanning content for solvable problems...\n• Applying appropriate solution methods...\n• Generating explanations...\n\n*Results will appear in the content viewer.*`,
          type: 'info',
          actions: [
            {
              type: 'analyze',
              target: 'all_problems',
              parameters: { solve: true, target }
            }
          ]
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
        '/visualize data trends',
        '/visualize this concept map'
      ],
      execute: (parsed, _context) => {
        const { target, location, modifiers } = parsed;
        const isAll = modifiers?.includes('all');
        const subject = this.extractSubject(target ?? '');

        if (location) {
          const pageNum = parseInt(location);
          return {
            success: true,
            message: `📊 **Visualizing ${isAll ? 'all ' : ''}${target} on page ${pageNum}**\n\n• Extracting visual elements...\n• Analyzing relationships...\n• Creating interactive representations...\n• Generating annotations...\n\n*Visual enhancements will appear in the content viewer.*`,
            type: 'info',
            actions: [
              {
                type: 'navigate',
                target: 'page',
                parameters: { page: pageNum }
              },
              {
                type: 'visualize',
                target: 'diagrams',
                parameters: { page: pageNum, subject, enhance: true }
              }
            ]
          };
        }

        return {
          success: true,
          message: `📊 **Creating visualizations for: ${target}**\n\n• Scanning for visual content...\n• Generating interactive elements...\n• Creating concept maps...\n• Adding explanatory overlays...\n\n*Enhanced visuals will be displayed throughout the content.*`,
          type: 'info',
          actions: [
            {
              type: 'visualize',
              target: 'content',
              parameters: { subject, type: target, global: true }
            }
          ]
        };
      }
    });

    // Explain command - provides detailed explanations
    this.registerCommand({
      name: 'explain',
      description: 'Provide detailed explanations of concepts or sections',
      patterns: [
        /^\/explain\s+(.*?)\s+(?:on\s+|from\s+)?(?:page\s+)?(\d+)/i,
        /^\/explain\s+(step\s+by\s+step\s+)?(.*)/i,
        /^\/explain\s+(.*)/i
      ],
      examples: [
        '/explain photosynthesis on page 67',
        '/explain step by step this process',
        '/explain quantum mechanics',
        '/explain the highlighted section'
      ],
      execute: (parsed, _context) => {
        const { target, location, modifiers } = parsed;
        const isStepByStep = modifiers?.includes('step by step');

        if (location) {
          const pageNum = parseInt(location);
          return {
            success: true,
            message: `💡 **Explaining ${target} from page ${pageNum}**\n\n• Analyzing content context...\n• Breaking down complex concepts...\n• Finding related information...\n• ${isStepByStep ? 'Creating step-by-step breakdown...' : 'Generating comprehensive explanation...'}\n\n*Detailed explanation will appear with highlighted references.*`,
            type: 'info',
            actions: [
              {
                type: 'navigate',
                target: 'page',
                parameters: { page: pageNum }
              },
              {
                type: 'highlight',
                target: 'concept',
                parameters: { concept: target, page: pageNum }
              },
              {
                type: 'analyze',
                target: 'explanation',
                parameters: { concept: target, stepByStep: isStepByStep }
              }
            ]
          };
        }

        return {
          success: true,
          message: `💡 **Explaining: ${target}**\n\n• Searching content for relevant information...\n• Analyzing concept relationships...\n• ${isStepByStep ? 'Preparing step-by-step breakdown...' : 'Generating comprehensive explanation...'}\n• Gathering supporting examples...\n\n*Explanation will include references and examples from your content.*`,
          type: 'info',
          actions: [
            {
              type: 'analyze',
              target: 'concept',
              parameters: { concept: target, stepByStep: isStepByStep }
            }
          ]
        };
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
      execute: (parsed, context) => {
        const { target, originalText } = parsed;
        
        // Check if it's a page number
        const pageRegex = /(?:page\s+)?(\d+)/i;
        const pageMatch = pageRegex.exec(originalText);
        if (pageMatch) {
          const pageNum = parseInt(pageMatch[1] ?? '1', 10);
          const totalPages = context?.contentData?.total_pages ?? 100;
          
          if (pageNum > totalPages) {
            return {
              success: false,
              message: `❌ Page ${pageNum} doesn't exist. This document has ${totalPages} pages.`,
              type: 'error'
            };
          }

          return {
            success: true,
            message: `📖 **Navigating to page ${pageNum}**`,
            type: 'success',
            actions: [
              {
                type: 'navigate',
                target: 'page',
                parameters: { page: pageNum }
              }
            ]
          };
        }

        // Handle section/topic navigation
        return {
          success: true,
          message: `🔍 **Searching for: ${target}**\n\n• Scanning table of contents...\n• Analyzing section headers...\n• Locating relevant content...\n\n*Will navigate to the best match found.*`,
          type: 'info',
          actions: [
            {
              type: 'navigate',
              target: 'section',
              parameters: { query: target }
            }
          ]
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
        '/analyze writing style'
      ],
      execute: (parsed, _context) => {
        const { target, location } = parsed;

        if (location) {
          const pageNum = parseInt(location);
          return {
            success: true,
            message: `🔬 **Analyzing ${target} on page ${pageNum}**\n\n• Extracting key information...\n• Identifying patterns and relationships...\n• Calculating metrics and statistics...\n• Generating insights...\n\n*Analysis results will be displayed with visual highlights.*`,
            type: 'info',
            actions: [
              {
                type: 'navigate',
                target: 'page',
                parameters: { page: pageNum }
              },
              {
                type: 'analyze',
                target: 'content',
                parameters: { focus: target, page: pageNum }
              }
            ]
          };
        }

        return {
          success: true,
          message: `🔬 **Performing analysis: ${target}**\n\n• Scanning entire document...\n• Applying analytical algorithms...\n• Identifying key patterns...\n• Generating comprehensive report...\n\n*Analysis will be presented with interactive elements.*`,
          type: 'info',
          actions: [
            {
              type: 'analyze',
              target: 'global',
              parameters: { type: target }
            }
          ]
        };
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

  parseConversationalCommand(input: string): ParsedConversationalCommand | null {
    if (!input.startsWith('/')) {
      return null;
    }

    // Try to match against registered command patterns
    for (const [commandName, command] of this.commands) {
      for (const pattern of command.patterns) {
        const match = input.match(pattern);
        if (match) {
          const parsed: ParsedConversationalCommand = {
            command: commandName,
            originalText: input,
            confidence: 0.9
          };

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

          parsed.modifiers = this.extractModifiers(input);
          
          return parsed;
        }
      }
    }

    // Fallback: try to extract basic command structure
    const basicRegex = /^\/(\w+)\s+(.*)/;
    const basicMatch = basicRegex.exec(input);
    if (basicMatch) {
      return {
        command: basicMatch[1] ?? 'unknown',
        target: basicMatch[2] ?? '',
        originalText: input,
        confidence: 0.5,
        modifiers: this.extractModifiers(input)
      };
    }

    return null;
  }

  executeConversationalCommand(input: string, context?: CommandContext): CommandResult {
    const parsed = this.parseConversationalCommand(input);
    
    if (!parsed) {
      return {
        success: false,
        message: 'Invalid command format. Commands should start with "/" followed by an action.',
        type: 'error'
      };
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
      return command.execute(parsed, context);
    } catch (error) {
      return {
        success: false,
        message: `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      };
    }
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
    help += '• Combine actions for complex workflows\n';

    return help;
  }
}

// Export singleton instance
export const conversationalCommandParser = new ConversationalCommandParser();
