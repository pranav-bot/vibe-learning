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
      execute: (parsed, context) => {
        if (context?.previousCommandResult) {
          console.log(`output of ${context.previousCommandType} command`, context.previousCommandResult, `passed to output of solve command`, { parsed, context });
        } else {
          console.log('output of solve command', { parsed, context });
        }
        
        // Generate mock data for chaining
        const solveData = {
          command: 'solve',
          target: parsed.target,
          solutions: [`Solution for: ${parsed.target}`],
          context: context?.previousCommandResult ? 'Used previous command result' : 'Fresh execution'
        };
        
        return {
          success: true,
          message: `🧮 **Solve command executed** - Check console for details`,
          data: solveData,
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
        '/visualize data trends',
        '/visualize this concept map'
      ],
      execute: (parsed, context) => {
        if (context?.previousCommandResult) {
          console.log(`output of ${context.previousCommandType} command`, context.previousCommandResult, `passed to output of visualize command`, { parsed, context });
        } else {
          console.log('output of visualize command', { parsed, context });
        }
        
        // Generate mock data for chaining
        const visualizeData = {
          command: 'visualize',
          target: parsed.target,
          visualizations: [`Visualization of: ${parsed.target}`],
          context: context?.previousCommandResult ? 'Enhanced with previous results' : 'Fresh visualization'
        };
        
        return {
          success: true,
          message: `📊 **Visualize command executed** - Check console for details`,
          data: visualizeData,
          type: 'info'
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
        '/explain the highlighted section',
        '/analyze patterns and /explain their significance'
      ],
      execute: (parsed, context) => {
        if (context?.previousCommandResult) {
          console.log(`output of ${context.previousCommandType} command`, context.previousCommandResult, `passed to output of explain command`, { parsed, context });
        } else {
          console.log('output of explain command', { parsed, context });
        }
        
        // Generate mock data for chaining, enhanced if previous command data exists
        const explainData = {
          command: 'explain',
          target: parsed.target,
          explanations: [`Explanation of: ${parsed.target}`],
          basedOn: context?.previousCommandResult ? 
            `Enhanced explanation based on ${context.previousCommandType} results` : 
            'Independent explanation'
        };
        
        return {
          success: true,
          message: `💡 **Explain command executed** - Check console for details`,
          data: explainData,
          type: 'info'
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
        if (context?.previousCommandResult) {
          console.log(`output of ${context.previousCommandType} command`, context.previousCommandResult, `passed to output of goto command`, { parsed, context });
        } else {
          console.log('output of goto command', { parsed, context });
        }
        
        // Generate mock data for chaining
        const gotoData = {
          command: 'goto',
          target: parsed.target,
          navigation: `Navigated to: ${parsed.target}`,
          context: context?.previousCommandResult ? 'Navigation enhanced by previous results' : 'Direct navigation'
        };
        
        return {
          success: true,
          message: `📖 **Goto command executed** - Check console for details`,
          data: gotoData,
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
      execute: (parsed, context) => {
        if (context?.previousCommandResult) {
          console.log(`output of ${context.previousCommandType} command`, context.previousCommandResult, `passed to output of analyze command`, { parsed, context });
        } else {
          console.log('output of analyze command', { parsed, context });
        }
        
        // Generate mock analysis data for chaining
        const analysisData = {
          command: 'analyze',
          target: parsed.target,
          analysis: {
            trends: [`Trend analysis of: ${parsed.target}`],
            patterns: [`Pattern identified in: ${parsed.target}`],
            insights: [`Key insights from: ${parsed.target}`]
          },
          context: context?.previousCommandResult ? 'Analysis enhanced by previous results' : 'Fresh analysis'
        };
        
        return {
          success: true,
          message: `🔬 **Analyze command executed** - Check console for details`,
          data: analysisData,
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

        // General help
        return {
          success: true,
          message: this.getCommandHelp(),
          type: 'info'
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

  executeConversationalCommand(input: string, context?: CommandContext): CommandResult | ChainedCommandResult {
    // Check if input contains command chaining (multiple commands separated by "and")
    if (this.isChainedCommand(input)) {
      return this.executeChainedCommands(input, context);
    }

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

  private isChainedCommand(input: string): boolean {
    // Check for command chaining patterns like "and /" or " and /"
    return /\s+and\s+\/\w+/.test(input);
  }

  private parseChainedCommands(input: string): ChainedCommand[] {
    // Split the input by "and /" pattern while preserving the "/" for each command
    const commandParts = input.split(/\s+and\s+(?=\/)/i);
    
    const chainedCommands: ChainedCommand[] = [];
    
    commandParts.forEach((part, index) => {
      const trimmedPart = part.trim();
      if (trimmedPart.startsWith('/')) {
        const parsed = this.parseConversationalCommand(trimmedPart);
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

  private executeChainedCommands(input: string, context?: CommandContext): ChainedCommandResult {
    const chainedCommands = this.parseChainedCommands(input);
    
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
        const result = command.execute(chainedCommand.parsed, enhancedContext);
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
    help += '• Combine actions for complex workflows\n';
    help += '• **Chain commands** with "and" - e.g., `/analyze trends and /explain results`\n';
    help += '• Chained commands pass data between each other for enhanced results\n';

    return help;
  }
}

// Export singleton instance
export const conversationalCommandParser = new ConversationalCommandParser();
