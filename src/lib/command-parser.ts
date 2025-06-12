// Command parser for chat interface
// Handles special commands that users can type in the chat

export interface Command {
  name: string;
  description: string;
  usage: string;
  execute: (args: string[], context?: CommandContext) => CommandResult;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: unknown;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export interface CommandContext {
  contentData?: {
    title?: string;
    content_type?: string;
  } | null;
  contentId?: string;
}

export interface ParsedCommand {
  isCommand: boolean;
  command?: string;
  args?: string[];
  originalText: string;
}

export class CommandParser {
  private commands = new Map<string, Command>();

  constructor() {
    this.registerDefaultCommands();
  }

  private registerDefaultCommands() {
    // Help command
    this.registerCommand({
      name: 'help',
      description: 'Show available commands',
      usage: '/help [command]',
      execute: (args) => {
        if (args.length > 0) {
          const commandName = args[0];
          if (commandName) {
            const cmd = this.commands.get(commandName);
            if (cmd) {
              return {
                success: true,
                message: `**${cmd.name}**: ${cmd.description}\n**Usage**: ${cmd.usage}`,
                type: 'info'
              };
            }
            return {
              success: false,
              message: `Command '${commandName}' not found. Use /help to see all commands.`,
              type: 'error'
            };
          }
        }

        const commandList = Array.from(this.commands.values())
          .map(cmd => `• **${cmd.name}**: ${cmd.description}`)
          .join('\n');

        return {
          success: true,
          message: `**🤖 Command Help**\n\n**Traditional Commands:**\n${commandList}\n\n**💬 Conversational Commands:**\nTry natural language commands like:\n• \`/solve all problems on page 28\`\n• \`/visualize biology diagrams\`\n• \`/explain photosynthesis step by step\`\n• \`/analyze trends in chapter 3\`\n• \`/goto page 15\`\n\n💡 **Tip**: Commands understand natural language and can be very specific!`,
          type: 'info'
        };
      }
    });

    // Clear command
    this.registerCommand({
      name: 'clear',
      description: 'Clear the chat history',
      usage: '/clear',
      execute: () => ({
        success: true,
        message: 'Chat history cleared.',
        type: 'success',
        data: { action: 'clear_chat' }
      })
    });

    // Summary command
    this.registerCommand({
      name: 'summary',
      description: 'Get a summary of the current content',
      usage: '/summary [brief|detailed]',
      execute: (args, context) => {
        const type = args[0] ?? 'brief';
        const title = context?.contentData?.title ?? 'this content';
        
        if (type === 'detailed') {
          return {
            success: true,
            message: `**Detailed Summary of "${title}":**\n\n• Main concepts and key points\n• Important definitions and terminology\n• Practical applications and examples\n• Connections to related topics\n• Areas for further exploration\n\n*This is a mock summary. In a real implementation, this would analyze the actual content.*`,
            type: 'info'
          };
        }
        
        return {
          success: true,
          message: `**Brief Summary of "${title}":**\n\nThis content covers essential concepts with practical examples and real-world applications. Key takeaways include foundational principles and their implementation.\n\n*This is a mock summary. Use \`/summary detailed\` for more information.*`,
          type: 'info'
        };
      }
    });

    // Quiz command
    this.registerCommand({
      name: 'quiz',
      description: 'Generate a quiz based on the content',
      usage: '/quiz [easy|medium|hard] [number]',
      execute: (args, context) => {
        const difficulty = args[0] ?? 'medium';
        const countArg = args[1];
        const count = countArg ? parseInt(countArg, 10) : 3;
        const title = context?.contentData?.title ?? 'this content';

        if (count > 10) {
          return {
            success: false,
            message: 'Maximum 10 questions allowed per quiz.',
            type: 'warning'
          };
        }

        const questions = Array.from({ length: count }, (_, i) => 
          `${i + 1}. What is the main concept discussed in section ${i + 1} of "${title}"?`
        ).join('\n');

        return {
          success: true,
          message: `**Quiz (${difficulty.toUpperCase()} - ${count} questions):**\n\n${questions}\n\n*This is a mock quiz. In a real implementation, questions would be generated from the actual content.*`,
          type: 'info',
          data: { action: 'quiz_generated', difficulty, count }
        };
      }
    });

    // Notes command
    this.registerCommand({
      name: 'notes',
      description: 'Manage your learning notes',
      usage: '/notes [list|add|clear] [note content]',
      execute: (args) => {
        const action = args[0] ?? 'list';
        
        switch (action) {
          case 'list':
            return {
              success: true,
              message: '**Your Notes:**\n\n• Sample note 1: Key concept about...\n• Sample note 2: Important formula...\n• Sample note 3: Real-world application...\n\n*Use `/notes add [content]` to add new notes.*',
              type: 'info'
            };
          
          case 'add':
            const noteContent = args.slice(1).join(' ');
            if (!noteContent) {
              return {
                success: false,
                message: 'Please provide note content. Usage: `/notes add [your note]`',
                type: 'error'
              };
            }
            return {
              success: true,
              message: `Note added: "${noteContent}"`,
              type: 'success',
              data: { action: 'note_added', content: noteContent }
            };
          
          case 'clear':
            return {
              success: true,
              message: 'All notes cleared.',
              type: 'success',
              data: { action: 'notes_cleared' }
            };
          
          default:
            return {
              success: false,
              message: 'Invalid notes action. Use: list, add, or clear',
              type: 'error'
            };
        }
      }
    });

    // Explain command
    this.registerCommand({
      name: 'explain',
      description: 'Get detailed explanation of a concept',
      usage: '/explain [concept]',
      execute: (args, _context) => {
        const concept = args.join(' ');
        if (!concept) {
          return {
            success: false,
            message: 'Please specify what you want explained. Usage: `/explain [concept]`',
            type: 'error'
          };
        }

        return {
          success: true,
          message: `**Explaining: "${concept}"**\n\nThis concept relates to the core themes in your content. Here's a detailed breakdown:\n\n• **Definition**: Key characteristics and properties\n• **Context**: How it fits within the broader topic\n• **Examples**: Practical applications and use cases\n• **Related Concepts**: Connected ideas and principles\n\n*This is a mock explanation. In a real implementation, this would analyze the actual content for context.*`,
          type: 'info'
        };
      }
    });

    // Search command
    this.registerCommand({
      name: 'search',
      description: 'Search within the current content',
      usage: '/search [query]',
      execute: (args) => {
        const query = args.join(' ');
        if (!query) {
          return {
            success: false,
            message: 'Please provide a search query. Usage: `/search [your query]`',
            type: 'error'
          };
        }

        return {
          success: true,
          message: `**Search Results for "${query}":**\n\n• **Section 1**: Found 3 matches related to "${query}"\n• **Section 2**: Found 1 match with relevant context\n• **Section 3**: Found 2 matches in examples\n\n*This is a mock search. In a real implementation, this would search through the actual content.*`,
          type: 'info',
          data: { action: 'search_performed', query }
        };
      }
    });

    // Debug command (for development)
    this.registerCommand({
      name: 'debug',
      description: 'Show debug information',
      usage: '/debug [info|context|commands]',
      execute: (args, _context) => {
        const type = args[0] ?? 'info';
        
        switch (type) {
          case 'context':
            return {
              success: true,
              message: `**Debug Context:**\n\`\`\`json\n${JSON.stringify(_context, null, 2)}\n\`\`\``,
              type: 'info'
            };
          
          case 'commands':
            const commandNames = Array.from(this.commands.keys()).join(', ');
            return {
              success: true,
              message: `**Registered Commands:** ${commandNames}`,
              type: 'info'
            };
          
          default:
            return {
              success: true,
              message: `**Debug Info:**\n• Commands available: ${this.commands.size}\n• Parser version: 1.0.0\n• Environment: Development`,
              type: 'info'
            };
        }
      }
    });
  }

  registerCommand(command: Command): void {
    this.commands.set(command.name, command);
  }

  parseInput(input: string): ParsedCommand {
    const trimmed = input.trim();
    
    if (!trimmed.startsWith('/')) {
      return {
        isCommand: false,
        originalText: input
      };
    }

    const parts = trimmed.slice(1).split(/\s+/);
    const command = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    return {
      isCommand: true,
      command,
      args,
      originalText: input
    };
  }

  executeCommand(input: string, context?: CommandContext): CommandResult {
    const parsed = this.parseInput(input);
    
    if (!parsed.isCommand || !parsed.command) {
      return {
        success: false,
        message: 'Invalid command format. Commands should start with "/"',
        type: 'error'
      };
    }

    const command = this.commands.get(parsed.command);
    if (!command) {
      return {
        success: false,
        message: `Unknown command: /${parsed.command}. Use /help to see available commands.`,
        type: 'error'
      };
    }

    try {
      return command.execute(parsed.args ?? [], context);
    } catch (error) {
      return {
        success: false,
        message: `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      };
    }
  }

  isCommand(input: string): boolean {
    return input.trim().startsWith('/');
  }

  getCommands(): Command[] {
    return Array.from(this.commands.values());
  }
}

// Export a singleton instance
export const commandParser = new CommandParser();
