import { generateText, type LanguageModelV1 } from "ai";
import { fetchPageContent, fetchTopicContent, type TopicData } from "./utils";

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