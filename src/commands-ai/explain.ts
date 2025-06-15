import { generateText, type LanguageModelV1 } from "ai";

// Define the topic type for a single topic
type TopicData = {
  topic_name: string;
  topic_page_start: number;
  topic_page_end: number;
  topic_summary: string;
};

// Function to fetch page content from FastAPI backend
async function fetchPageContent(contentId: string, pageNumber: number): Promise<string> {
  try {
    const response = await fetch(`http://localhost:8000/content/${contentId}/page/${pageNumber}`);
    if (!response.ok) {
      console.warn(`Failed to fetch page ${pageNumber} for content ${contentId}: ${response.status}`);
      return '';
    }
    const data = await response.json() as { success: boolean; data?: { text?: string } };
    return data.data?.text ?? '';
  } catch (error) {
    console.warn(`Error fetching page ${pageNumber} for content ${contentId}:`, error);
    return '';
  }
}

// Function to fetch content for a page range
async function fetchTopicContent(contentId: string, startPage: number, endPage: number): Promise<string> {
  const pagePromises = [];
  
  for (let page = startPage; page <= endPage; page++) {
    pagePromises.push(fetchPageContent(contentId, page));
  }
  
  const pageContents = await Promise.all(pagePromises);
  return pageContents
    .filter(content => content.trim().length > 0) // Filter out empty pages
    .map((content, index) => `[Page ${startPage + index}]\n${content}`)
    .join('\n\n');
}

const explain = async (
  user_query: string, 
  difficulty: string, 
  model: LanguageModelV1, 
  topic?: TopicData,
  pageNumber?: number,
  contentId?: string
) => {
    let context = '';
    
    // Handle topic-based context
    if (topic && contentId) {
        context = 'Related Topic with Content:\n\n';
        
        // Fetch content for the topic
        context += `${topic.topic_name} (Pages ${topic.topic_page_start}-${topic.topic_page_end})\n`;
        context += `Summary: ${topic.topic_summary}\n\n`;
        
        try {
            const topicContent = await fetchTopicContent(contentId, topic.topic_page_start, topic.topic_page_end);
            if (topicContent.trim()) {
                context += `Content:\n${topicContent}\n\n`;
            } else {
                context += `Content: [Unable to fetch content for this topic]\n\n`;
            }
        } catch (error) {
            console.warn(`Error fetching content for topic ${topic.topic_name}:`, error);
            context += `Content: [Error fetching content for this topic]\n\n`;
        }
    } else if (topic) {
        // Fallback to just topic summary if no contentId provided
        context = 'Related Topic:\n';
        context += `${topic.topic_name} (Pages ${topic.topic_page_start}-${topic.topic_page_end})\n`;
        context += `Summary: ${topic.topic_summary}\n\n`;
    }
    // Handle page-based context
    else if (pageNumber && contentId) {
        context = `Page ${pageNumber} Content:\n\n`;
        
        try {
            const pageContent = await fetchPageContent(contentId, pageNumber);
            if (pageContent.trim()) {
                context += `[Page ${pageNumber}]\n${pageContent}\n\n`;
            } else {
                context += `[Unable to fetch content for page ${pageNumber}]\n\n`;
            }
        } catch (error) {
            console.warn(`Error fetching content for page ${pageNumber}:`, error);
            context += `[Error fetching content for page ${pageNumber}]\n\n`;
        }
    }

    const response = await generateText({
        model: model,
        prompt: `You are an expert educator and researcher. Your task is to provide a comprehensive, well-researched explanation that demonstrates deep understanding and critical analysis.

EXPLANATION REQUIREMENTS:
- Difficulty Level: ${difficulty}
- Provide thorough analysis with multiple perspectives
- Include relevant background context and foundational concepts
- Explain underlying principles and mechanisms
- Draw connections to related concepts and real-world applications
- Address potential misconceptions or common questions
- Use clear, structured organization with logical flow
- Support explanations with specific examples and evidence when possible

RESEARCH DEPTH GUIDELINES:
- Break down complex concepts into digestible components
- Explain the 'why' behind concepts, not just the 'what'
- Include historical context or development when relevant
- Discuss practical implications and applications
- Address limitations, challenges, or controversies if applicable
- Connect to broader themes and interdisciplinary relationships

${context ? `REFERENCE MATERIAL:
${context}

Use this reference material as your primary source, but enhance it with deeper analysis, connections, and insights. Don't just summarize - synthesize and expand upon the content.

` : ''}CONTENT TO EXPLAIN:
${user_query}

Provide a comprehensive explanation that goes beyond surface-level description to offer genuine insight and understanding. Structure your response with clear headings and logical progression from basic concepts to more advanced insights.`,
    });

    return response.text;
};

export default explain;