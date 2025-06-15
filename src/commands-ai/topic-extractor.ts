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

// Define the output schema for topics with page information
const topicSchema = z.object({
  topic_name: z.string().describe("The name or title of the topic"),
  topic_page_start: z.number().describe("The starting page number for this topic"),
  topic_page_end: z.number().describe("The ending page number for this topic"),
  topic_content: z.string().describe("The original content of the topic as it appears in the document")
});

const topicExtractor = async (content: ContentInput, model: LanguageModelV1) => {
  // Format the content for the AI prompt
  const formattedContent = content.pages
    .map(page => `Page ${page.page_number}:\n${page.content}`)
    .join('\n\n');

  const response = await generateObject({
    model: model,
    prompt: `Analyze the following document with ${content.total_pages} pages and extract the main topics. For each topic, identify:
1. The topic name/title
2. The starting page number where the topic begins
3. The ending page number where the topic ends
4. The original content of the topic (extract the actual text content as it appears in the document, do not summarize)

Document content:
${formattedContent}

Please identify topics that span across pages and provide accurate page ranges for each topic. Return the original content for each topic exactly as it appears in the document.`,
    schema: z.object({
      topics: z.array(topicSchema).describe("List of main topics with their page ranges and original content"),
    }),
  });

  return response;
}

export default topicExtractor;