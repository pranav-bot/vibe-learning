import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import topicExtractor from "~/commands-ai/topic-extractor";
import explain from "~/commands-ai/explain";
import llms from "~/lib/llms";

// Define the input structure that matches the Python backend response
const ContentInput = z.object({
  total_pages: z.number(),
  pages: z.array(z.object({
    page_number: z.number(),
    content: z.string()
  }))
});

export const contentRouter = createTRPCRouter({
  extractTopics: publicProcedure
    .input(z.object({ contentId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        console.log(`🚀 Starting topic extraction for content ID: ${input.contentId}`);
        
        // Fetch formatted content from Python backend with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for fetch
        
        const response = await fetch(`http://localhost:8000/content/${input.contentId}/topic-extractor-format`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
        }
        
        const responseData = await response.json() as { success: boolean; data: unknown };
        
        if (!responseData.success) {
          throw new Error("Failed to get formatted content from Python backend");
        }
        
        // Validate the content structure
        const content = ContentInput.parse(responseData.data);
        console.log(`📄 Document has ${content.total_pages} pages`);
        
        // Extract topics using the topic extractor with timeout
        const extractionPromise = topicExtractor(content, llms.gemini("gemini-2.0-flash-exp"));
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Topic extraction timed out after 5 minutes")), 300000)
        );
        
        const result = await Promise.race([extractionPromise, timeoutPromise]) as Awaited<typeof extractionPromise>;
        
        // Log the output as requested
        console.log("🎯 Topic Extractor Output:");
        console.log("=".repeat(50));
        console.log(JSON.stringify(result.object, null, 2));
        console.log("=".repeat(50));
        console.log(`✅ Successfully extracted ${result.object.topics?.length || 0} topics`);
        
        return {
          success: true,
          data: result.object
        };
        
      } catch (error) {
        console.error("❌ Error extracting topics:", error);
        
        // Provide more detailed error information
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new Error("Request timed out while fetching content from Python backend");
          } else if (error.message.includes("Topic extraction timed out")) {
            throw new Error("Topic extraction took too long and was cancelled (>5 minutes)");
          } else if (error.message.includes("No object generated")) {
            throw new Error("AI model failed to generate valid topics. The document might be too long or complex.");
          }
        }
        
        throw new Error(`Failed to extract topics: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  explainContent: publicProcedure
    .input(z.object({
      contentId: z.string(),
      userQuery: z.string(),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).default('intermediate'),
      topic: z.object({
        topic_name: z.string(),
        topic_page_start: z.number(),
        topic_page_end: z.number(),
        topic_summary: z.string()
      }).optional(),
      pageNumber: z.number().optional()
    }))
    .mutation(async ({ input }) => {
      try {
        console.log(`🤖 Starting explanation for content ID: ${input.contentId}`);
        console.log(`📝 User query: ${input.userQuery}`);
        console.log(`🎚️ Difficulty: ${input.difficulty}`);
        
        if (input.topic) {
          console.log(`📚 Using topic: ${input.topic.topic_name} (Pages ${input.topic.topic_page_start}-${input.topic.topic_page_end})`);
        } else if (input.pageNumber) {
          console.log(`📄 Using page number: ${input.pageNumber}`);
        }

        // Call the explain function with timeout
        const explainPromise = explain(
          input.userQuery,
          input.difficulty,
          llms.gemini("gemini-2.0-flash-exp"),
          input.topic,
          input.pageNumber,
          input.contentId
        );
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Explanation generation timed out after 2 minutes")), 120000)
        );
        
        const explanation = await Promise.race([explainPromise, timeoutPromise]) as string;
        
        console.log(`✅ Explanation generated successfully (${explanation.length} characters)`);
        
        return {
          success: true,
          data: {
            explanation,
            contentId: input.contentId,
            userQuery: input.userQuery,
            difficulty: input.difficulty,
            topic: input.topic,
            pageNumber: input.pageNumber,
            generatedAt: new Date().toISOString()
          }
        };
        
      } catch (error) {
        console.error("❌ Error generating explanation:", error);
        
        // Provide more detailed error information
        if (error instanceof Error) {
          if (error.message.includes("Explanation generation timed out")) {
            throw new Error("Explanation generation took too long and was cancelled (>2 minutes)");
          } else if (error.message.includes("Failed to fetch")) {
            throw new Error("Unable to fetch content from the document. Please check the content ID and page numbers.");
          }
        }
        
        throw new Error(`Failed to generate explanation: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),
});
