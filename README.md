# 📚 Vibe Learning - AI-Powered Learning Platform

Transform your learning experience with AI-powered personalized education. Learn at your own pace with intelligent tutoring and adaptive content.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat&logo=typescript)](https://typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.5-darkblue?style=flat&logo=prisma)](https://prisma.io/)
[![tRPC](https://img.shields.io/badge/tRPC-11.0-blue?style=flat&logo=trpc)](https://trpc.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

## ✨ Features

### 🚀 Dual Learning Modes

- **Roadmap Learning**: Create comprehensive learning roadmaps for any topic with AI-generated content
- **Single Document Analysis**: Upload and analyze individual documents, PDFs with AI-powered insights

## 🗺️ Comprehensive Roadmap Learning System

Vibe Learning's flagship feature is its AI-powered roadmap generation system that creates personalized learning experiences for any topic.

### ✨ Roadmap Features

#### 🎯 **Intelligent Roadmap Generation**

- **AI-Powered Creation**: Generate comprehensive learning roadmaps using advanced language models (Gemini 2.0 Flash with fallback to 1.5 Flash)
- **Hierarchical Structure**: Topics organized in a tree-like mindmap with clear parent-child relationships
- **Progressive Learning**: Multi-level structure from foundations (Level 0) to specialized topics (Level 3+)
- **Difficulty Adaptation**: Content tailored for beginner, intermediate, or advanced learners

#### 🧠 **Interactive Mindmap Visualization**

- **Dynamic Mindmap**: Visual representation of learning topics with interactive nodes
- **Level-Based Color Coding**:
  - 🔵 Main Topic (Central node)
  - 🔴 Level 0 - Foundation concepts
  - 🟡 Level 1 - Core skills
  - 🟢 Level 2 - Advanced topics
  - 🟣 Level 3+ - Specialized areas
- **Interactive Navigation**: Click topics to explore detailed content and resources
- **Zoom & Pan Controls**: Navigate large roadmaps with built-in controls

#### 📚 **Rich Learning Resources**

- **YouTube Integration**: AI-curated video resources for each topic
  - Top 5 most relevant videos per topic
  - Difficulty-appropriate content selection
  - Educational channel prioritization
  - Relevance scoring and explanations
- **Automatic Resource Discovery**: AI analyzes and selects the best learning materials
- **Topic-Specific Content**: Resources tailored to each individual topic's requirements

#### 🛠️ **Hands-On Project Generation**

- **AI-Generated Projects**: Practical projects aligned with roadmap topics
- **Skill Application**: Projects designed to reinforce learned concepts
- **Portfolio Building**: Create real-world deliverables
- **Technology Integration**: Projects use appropriate tools and technologies
- **Difficulty Progression**: Projects range from beginner to advanced levels

#### 💾 **Persistent Learning Progress**

- **Database Integration**: Roadmaps saved to PostgreSQL database via Prisma
- **User Library**: Access all previously generated roadmaps
- **Progress Tracking**: Resume learning from where you left off
- **Roadmap History**: Browse and revisit past learning journeys

### 🚀 How Roadmap Learning Works

#### **1. Topic Selection**

- Navigate to `/library`
- Enter any learning topic (e.g., "Machine Learning", "Web Development")
- Choose from popular topics or create custom ones
- Select difficulty level: Beginner, Intermediate, or Advanced

#### **2. AI Generation Process**

```text
🔄 Analyzing topic and difficulty level
🧠 Generating hierarchical topic structure
🗺️ Creating mindmap relationships
📚 Curating relevant resources
🛠️ Generating practical projects
💾 Saving to your personal library
```

#### **3. Learning Experience**

- **Visual Learning**: Interactive mindmap shows learning path
- **Topic Deep-Dive**: Click any topic for detailed exploration
- **Resource Access**: YouTube videos, articles, and tutorials for each topic
- **Project Building**: Hands-on projects to apply knowledge
- **AI Commands**: Use conversational commands like `/explain @topic` for instant help

#### **4. Advanced Features**

- **Topic Referencing**: Use `@topic_name` syntax to reference specific roadmap topics
- **Cross-Topic Comparison**: Compare different topics with `/compare @topic1 vs @topic2`
- **Visual Learning**: Generate diagrams with `/visualize @topic concepts`
- **Conversational Interface**: Natural language interaction with learning content

### 🎓 Learning Methodologies

#### **Structured Progression**

- **Foundation First**: Start with Level 0 fundamental concepts
- **Parallel Learning**: Multiple Level 1 topics can be learned simultaneously
- **Depth Building**: Progress through levels at your own pace
- **Skill Integration**: Projects combine multiple topics for holistic learning

#### **Adaptive Content**

- **Beginner Level**: High school appropriate, simplified language, real-world analogies
- **Intermediate Level**: College level, technical terms, core concept references
- **Advanced Level**: Graduate level, proofs, derivations, complex problem sets

#### **Multi-Modal Learning**

- **Visual**: Interactive mindmaps and AI-generated diagrams
- **Video**: Curated YouTube educational content
- **Practical**: Hands-on projects and exercises
- **Conversational**: AI-powered explanations and discussions

### 📊 Roadmap Architecture

#### **Database Schema**

```typescript
Roadmap {
  id: string
  title: string
  description: string
  difficulty: "beginner" | "intermediate" | "advanced"
  createdAt: Date
  updatedAt: Date
  topics: Topic[]
  projects: Project[]
}

Topic {
  id: string
  title: string
  summary: string
  level: number
  parentId: string | null
  children: string[]
  resources: Resource[]
}

Project {
  id: string
  title: string
  description: string
  difficulty: string
  estimatedTime: string
  technologies: string[]
  deliverables: string[]
  relatedTopics: Topic[]
}
```

#### **AI Generation Pipeline**

1. **Topic Analysis**: AI analyzes the input topic and difficulty
2. **Structure Generation**: Creates hierarchical topic tree
3. **Content Enrichment**: Generates summaries and learning objectives
4. **Resource Curation**: Searches and selects relevant YouTube videos
5. **Project Creation**: Generates practical projects for skill application
6. **Quality Assurance**: Validates relationships and content coherence

### 🎯 Use Cases

#### **For Students**

- Create study roadmaps for courses and subjects
- Break down complex topics into manageable learning paths
- Access curated resources for any subject
- Build portfolio projects while learning

#### **For Professionals**

- Upskill in new technologies and frameworks
- Create learning plans for career advancement
- Stay updated with industry trends
- Develop practical skills through projects

#### **For Educators**

- Design curriculum structures
- Create supplementary learning materials
- Provide students with comprehensive resource lists
- Track learning progression through visual roadmaps

### 🔧 Technical Implementation

#### **Core Technologies**

- **Frontend**: Next.js 15 with React components for mindmap visualization
- **Backend**: tRPC for type-safe API endpoints
- **Database**: PostgreSQL with Prisma ORM for data persistence
- **AI Integration**: Google Gemini models for content generation
- **Resource APIs**: YouTube Data API v3 for video curation

#### **Key Components**

- `CustomMindmap.tsx`: Interactive mindmap visualization
- `RoadmapLoading.tsx`: Beautiful loading states during generation
- `DifficultyDialog.tsx`: User experience for difficulty selection
- `course-builder-ai/`: AI generation modules for roadmaps, resources, and projects

### 🤖 AI-Powered Conversational Chat System

Vibe Learning features a sophisticated conversational command parser that enables natural language interaction with learning content through an intelligent chat interface.

#### 💬 **Full-Featured Chat Interface**

- **Natural Language Processing**: Understands conversational commands and queries
- **Context-Aware Responses**: Maintains conversation context and learning progress
- **Real-Time Interaction**: Instant responses with streaming support
- **Multi-Modal Output**: Text, diagrams, and visual content in chat responses

#### 🎯 **Advanced Command Parser**

- **Pattern Recognition**: Multiple regex patterns per command for flexible input
- **Topic Referencing**: Use `@topic_name` syntax to reference specific roadmap topics
- **Chained Commands**: Execute multiple commands in sequence (e.g., `/analyze trends and /explain results`)
- **Error Handling**: Intelligent error messages and command suggestions
- **Command History**: Track and repeat previous successful commands

#### 🔧 **Supported Commands**

##### **Fully Implemented Commands:**

- **`/explain`** - Get detailed explanations of concepts with topic context

  ```text
  /explain photosynthesis @biology
  /explain step by step this process
  /explain quantum mechanics on page 45
  /explain @machine-learning concepts
  ```

- **`/visualize`** - Generate Mermaid diagrams and visual representations

  ```text
  /visualize molecular structures @chemistry
  /visualize all biology diagrams
  /visualize data trends from page 28
  /visualize this concept map
  ```

- **`/compare`** - Compare two topics to understand relationships

  ```text
  /compare @algebra and @calculus
  /compare @biology vs @chemistry
  /compare linear regression versus logistic regression
  ```

##### **Commands in Development:**

- **`/solve`** - Problem-solving assistance

  ```text
  /solve all problems on page 28
  /solve quadratic equations @algebra
  /solve @physics problems
  ```

- **`/analyze`** - Deep content analysis and pattern recognition

  ```text
  /analyze key concepts on page 15
  /analyze trends in this data
  /analyze relationships between variables
  ```

- **`/goto`** - Smart navigation through content

  ```text
  /goto page 42
  /goto chapter 5
  /goto conclusion section
  ```

- **`/help`** - Show available commands and usage examples

  ```text
  /help
  /help solve
  /help commands
  ```

#### 🎯 **Topic Referencing System**

The parser includes a sophisticated topic referencing system that allows users to interact with specific topics from their roadmaps:

- **Topic Detection**: Automatic identification of `@topic_name` patterns
- **Fuzzy Matching**: Smart matching for topic names with typos or variations
- **Topic Context**: Commands executed with full topic context including summaries and page ranges
- **Cross-Reference**: Link related topics and concepts automatically

##### **Topic Reference Examples:**

```text
# Reference specific topics from your roadmap
/explain @machine-learning algorithms
/visualize @neural-networks architecture
/compare @supervised-learning vs @unsupervised-learning

# Use topics with page context
/explain photosynthesis @biology from page 67
/visualize molecular structures @chemistry on page 45
```

#### 🔄 **Command Processing Pipeline**

1. **Input Parsing**: Analyze user input for command patterns and topic references
2. **Topic Resolution**: Find and validate referenced topics from available roadmaps
3. **Context Building**: Gather relevant context including page numbers, topic summaries
4. **API Integration**: Call appropriate tRPC endpoints with enriched context
5. **Response Generation**: Format AI-generated responses with rich content
6. **Output Rendering**: Display results with proper formatting, diagrams, and interactive elements

#### 🧠 **Intelligent Features**

- **Context Awareness**: Remembers current page, selected topics, and conversation history
- **Smart Suggestions**: Suggests related commands and topics based on current context
- **Error Recovery**: Helpful error messages with command suggestions and corrections
- **Multi-Command Support**: Handle complex queries with multiple commands
- **Adaptive Responses**: Adjust response complexity based on user's difficulty level

#### 🎨 **Rich Response Formats**

- **Structured Text**: Well-formatted explanations with headers and bullet points
- **Mermaid Diagrams**: Interactive visual diagrams embedded in chat
- **Topic Cards**: Rich topic information with summaries and metadata
- **Resource Lists**: Curated learning resources with relevance scores
- **Project Suggestions**: Practical projects with detailed specifications

#### 🔧 **Technical Implementation**

##### **Core Components:**

- `ConversationalCommandParser.ts`: Main parser with command registration and execution
- `command-parser.ts`: Basic command parsing utilities
- Command processors in `commands-ai/` directory:
  - `explain.ts`: Detailed concept explanations
  - `visualize.ts`: Mermaid diagram generation
  - `compare.ts`: Topic comparison analysis
  - `topic-extractor.ts`: Topic identification and extraction

##### **API Integration:**

```typescript
// Example API calls from commands
await fetch('/api/trpc/content.explainContent', {
  method: 'POST',
  body: JSON.stringify({
    json: {
      contentId: context?.contentId,
      userQuery: parsed.target,
      difficulty: 'intermediate',
      topic: parsed.referencedTopic
    }
  })
})
```

##### **Command Registration:**

```typescript
// Commands are registered with patterns, examples, and execution logic
this.registerCommand({
  name: 'explain',
  description: 'Provide detailed explanations of concepts',
  patterns: [
    /^\/explain\s+(.*?)\s+(?:on\s+|from\s+)?(?:page\s+)?(\d+)/i,
    /^\/explain\s+(step\s+by\s+)?(.*)/i,
    /^\/explain\s+(.+)/i
  ],
  examples: [
    '/explain photosynthesis on page 67',
    '/explain @biology concepts',
    '/explain step by step this process'
  ],
  execute: async (parsed, context) => { /* command logic */ }
});
```

### 🎯 Enhanced Learning Experience

- **Interactive Learning**: Chat-based interface makes learning conversational and engaging
- **Instant Help**: Get explanations and clarifications without leaving the learning flow
- **Visual Learning**: Generate diagrams and visualizations on-demand
- **Contextual Assistance**: AI understands your current learning context and progress
- **Personalized Responses**: Content adapted to your skill level and learning preferences

## 🏗️ Tech Stack

This project is built on the [T3 Stack](https://create.t3.gg/) with additional AI and learning-focused enhancements:

### Frontend

- **[Next.js 15](https://nextjs.org)** - React framework with App Router
- **[TypeScript](https://typescriptlang.org)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first CSS framework
- **[Radix UI](https://radix-ui.com)** - Accessible component library
- **[Lucide React](https://lucide.dev)** - Beautiful icons

### Backend & Database

- **[tRPC](https://trpc.io)** - End-to-end typesafe APIs
- **[Prisma](https://prisma.io)** - Type-safe database ORM
- **[PostgreSQL](https://postgresql.org)** - Robust relational database
- **[Supabase](https://supabase.com)** - Authentication and database hosting

### AI & Machine Learning

- **[Google AI SDK](https://ai.google.dev)** - AI model integration
- **[Mermaid](https://mermaid.js.org)** - Diagram and flowchart generation
- **Python Backend** - Advanced PDF processing and AI operations

### Development Tools

- **[ESLint](https://eslint.org)** - Code linting
- **[Prettier](https://prettier.io)** - Code formatting
- **[TypeScript ESLint](https://typescript-eslint.io)** - TypeScript-specific linting

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database
- Python 3.8+ (for backend AI services)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/vibe-learning.git
   cd vibe-learning
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Configure the following variables:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/vibe_learning"
   
   # Backend Services
   NEXT_PUBLIC_BACKEND_URL="http://localhost:5000"
   
   # Supabase (optional, for auth)
   NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
   ```

4. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the Python backend** (optional, for AI features)

   ```bash
   cd src/python-backend
   pip install -r requirements.txt
   chmod +x start-server.sh
   ./start-server.sh
   ```

6. **Start the development server**

   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```text
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── dashboard/         # Single document analysis
│   ├── library/           # Roadmap learning
│   ├── learn/             # Learning interface
│   └── api/               # API routes
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (Radix)
│   └── *.tsx             # Feature-specific components
├── commands-ai/          # AI command processors
├── course-builder-ai/    # AI course generation
├── lib/                  # Utility libraries
├── python-backend/       # Python AI services
├── server/               # Backend API logic
├── trpc/                 # tRPC configuration
└── utils/                # Helper utilities
```

## 🎮 Usage

### Roadmap Learning

1. Navigate to `/library`
2. Create a new learning roadmap
3. AI generates structured learning content
4. Follow the progressive learning path

### Single Document Analysis

1. Go to `/dashboard`
2. Upload a PDF or document
3. Use AI commands to interact with content:
   - `/explain @topic_name` - Get explanations
   - `/visualize molecular structures` - Generate diagrams
   - `/analyze patterns in data` - Deep analysis

### AI Commands

The platform supports natural language commands:

```text
/explain photosynthesis @biology
/visualize molecular structures from page 45
/analyze trends in this data
/goto chapter 5
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbo
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format:check # Check code formatting
npm run format:write # Format code with Prettier
npm run typecheck    # Run TypeScript checks
```

### Database Management

```bash
# Generate and apply migrations
npx prisma migrate dev --name your-migration-name

# Reset database (development only)
npx prisma migrate reset

# View data in browser
npx prisma studio
```

## 🧪 Testing

```bash
# Run type checking
npm run typecheck

# Run linting
npm run check
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Docker

```bash
# Build Docker image
docker build -t vibe-learning .

# Run container
docker run -p 3000:3000 vibe-learning
```

### Environment Variables for Production

```env
DATABASE_URL="your-production-database-url"
NEXT_PUBLIC_BACKEND_URL="your-production-backend-url"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write descriptive commit messages
- Add tests for new features
- Update documentation as needed

## 📖 API Documentation

The project uses tRPC for type-safe API routes. Key endpoints:

- `content.explainContent` - AI-powered explanations
- `content.visualizeContent` - Generate visual diagrams
- `roadmap.*` - Roadmap management
- `auth.*` - Authentication handling

## 🔧 Configuration

### Environment Setup

See `.env.example` for all required environment variables.

### Database Schema

The application uses Prisma with PostgreSQL. Key models:

- `Profile` - User profiles
- `Roadmap` - Learning roadmaps
- `Topic` - Individual learning topics
- `Project` - Associated projects

## 📚 Learning Resources

- [T3 Stack Documentation](https://create.t3.gg/)
- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Prisma Documentation](https://prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Reset database connection
npx prisma db push --force-reset
```

#### Python Backend Issues

```bash
# Ensure Python dependencies are installed
cd src/python-backend
pip install -r requirements.txt

# Check if backend is running
curl http://localhost:5000/health
```

#### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [T3 Stack](https://create.t3.gg/) for the amazing foundation
- [Vercel](https://vercel.com) for hosting and deployment
- [Supabase](https://supabase.com) for authentication and database
- The open-source community for the incredible tools

---

Made with ❤️ for learners everywhere
