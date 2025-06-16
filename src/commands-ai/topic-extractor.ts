import { generateObject, type LanguageModelV1 } from "ai"
import { z } from "zod";

// Define the input structure for page-wise content
interface PageData {
  page_number: number;
  content: string;
}

interface ContentInput {
  total_pages: number;
  pages: PageData[];
}

const topicExtractor = async (content: ContentInput, model: LanguageModelV1) => {
  console.log(`🤖 Topic Extractor: Processing ${content.total_pages} pages...`);
  
  // Format the content for the AI prompt
  const formattedContent = content.pages
    .map(page => `Page ${page.page_number}:\n${page.content}`)
    .join('\n\n');

  console.log(`📝 Total content length: ${formattedContent.length} characters`);
  
  // Chunk content if it's too large (limit to ~3B characters to avoid token limits)
  const maxContentLength = 3000000000; // 3 billion characters, adjust as needed
  let contentToProcess = formattedContent;
  
  if (formattedContent.length > maxContentLength) {
    console.log(`⚠️ Content too large (${formattedContent.length} chars), truncating to ${maxContentLength} chars...`);
    contentToProcess = formattedContent.substring(0, maxContentLength) + "\n\n[Content truncated for processing...]";
  }
  
  console.log(`🧠 Sending to AI model for topic extraction...`);

  const response = await generateObject({
    model: model,
    prompt: `Analyze the following document with ${content.total_pages} pages and extract the main topics. For each topic, identify:
1. The topic name/title(without spaces)
2. The starting page number where the topic begins
3. The ending page number where the topic ends
4. A detailed summary of the topic content 

Document content:
${contentToProcess}

Extract the main topics and provide concise summaries for each topic. Focus on the key themes and concepts.`,
    schema: z.object({
      topics: z.array(z.object({
        topic_name: z.string().describe("The name or title of the topic"),
        topic_page_start: z.number().describe("The starting page number for this topic"),
        topic_page_end: z.number().describe("The ending page number for this topic"),
        topic_summary: z.string().describe("A detailed summary of the topic")
      })).describe("List of main topics with their page ranges and summaries "),
    }),
  });

  console.log(`🎉 Topic extraction completed successfully!`);
  return response;
}

export default topicExtractor;