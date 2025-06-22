import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import topicExtractor, { youtubeTopicExtractor } from "~/commands-ai/topic-extractor";
import explain from "~/commands-ai/explain";
import visualize from "~/commands-ai/visualize";
import { generateTopicComparison } from "~/commands-ai/compare";
import llms from "~/lib/llms";

// Backend URL for server-side requests
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

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
        
        const response = await fetch(`${BACKEND_URL}/content/${input.contentId}/topic-extractor-format`, {
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

  extractYoutubeTopics: publicProcedure
    .input(z.object({ 
      url: z.string().url("Must be a valid URL"),
      title: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      try {
        console.log(`🎥 Starting YouTube topic extraction for URL: ${input.url}`);
        
        // Validate that it's a YouTube URL
        if (!input.url.includes('youtube.com') && !input.url.includes('youtu.be')) {
          throw new Error("URL must be a YouTube video link");
        }
        
        // Extract transcript from YouTube video using Python backend
        const formData = new FormData();
        formData.append('url', input.url);
        if (input.title) {
          formData.append('title', input.title);
        }
        
        console.log(`📡 Fetching transcript from Python backend...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for transcript extraction
        
        const response = await fetch(`${BACKEND_URL}/youtube-transcript`, {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to extract transcript: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const responseData = await response.json() as { 
          success: boolean; 
          data: { 
            content_id: string; 
            transcript?: string; 
            title: string; 
            url: string; 
            text_length: number; 
          } 
        };
        
        if (!responseData.success) {
          throw new Error("Failed to extract transcript from YouTube video");
        }
        
        // Get the transcript text
        const transcriptResponse = await fetch(`${BACKEND_URL}/content/${responseData.data.content_id}/transcript`);
        
        if (!transcriptResponse.ok) {
          throw new Error("Failed to retrieve transcript text");
        }
        
        const transcriptData = await transcriptResponse.json() as {
          success: boolean;
          data: {
            transcript: string;
            title: string;
            url: string;
            text_length: number;
          }
        };
        
        if (!transcriptData.success || !transcriptData.data.transcript) {
          throw new Error("No transcript available for this video");
        }
        
        console.log(`📝 Transcript extracted: ${transcriptData.data.text_length} characters`);
        
        // Extract topics using the YouTube topic extractor with timeout
        const extractionPromise = youtubeTopicExtractor(
          transcriptData.data.transcript, 
          llms.gemini("gemini-2.0-flash-exp")
        );
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("YouTube topic extraction timed out after 5 minutes")), 300000)
        );
        
        const result = await Promise.race([extractionPromise, timeoutPromise]) as Awaited<typeof extractionPromise>;
        
        // Log the output
        console.log("🎯 YouTube Topic Extractor Output:");
        console.log("=".repeat(50));
        console.log(JSON.stringify(result.object, null, 2));
        console.log("=".repeat(50));
        console.log(`✅ Successfully extracted ${result.object.topics?.length || 0} topics from YouTube video`);
        
        return {
          success: true,
          data: {
            ...result.object,
            contentId: responseData.data.content_id,
            videoInfo: {
              title: transcriptData.data.title,
              url: transcriptData.data.url,
              text_length: transcriptData.data.text_length
            }
          }
        };
        
      } catch (error) {
        console.error("❌ Error extracting YouTube topics:", error);
        
        // Provide more detailed error information
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new Error("Request timed out while extracting transcript from YouTube");
          } else if (error.message.includes("YouTube topic extraction timed out")) {
            throw new Error("Topic extraction took too long and was cancelled (>5 minutes)");
          } else if (error.message.includes("No transcript available")) {
            throw new Error("This YouTube video does not have captions or transcripts available");
          } else if (error.message.includes("TranscriptsDisabled")) {
            throw new Error("Transcripts are disabled for this YouTube video");
          } else if (error.message.includes("Video unavailable")) {
            throw new Error("YouTube video is unavailable or private");
          }
        }
        
        throw new Error(`Failed to extract topics from YouTube video: ${error instanceof Error ? error.message : String(error)}`);
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

  visualizeContent: publicProcedure
    .input(z.object({
      userQuery: z.string(),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).default('intermediate'),
      topic: z.object({
        topic_name: z.string(),
        topic_page_start: z.number(),
        topic_page_end: z.number(),
        topic_summary: z.string()
      })
    }))
    .mutation(async ({ input }) => {
      try {
        console.log(`🎨 Starting visualization for query: ${input.userQuery}`);
        console.log(`📚 Topic: ${input.topic.topic_name}`);
        console.log(`🎚️ Difficulty: ${input.difficulty}`);

        // Call the visualize function with timeout
        const visualizePromise = visualize(
          input.userQuery,
          input.difficulty,
          llms.gemini("gemini-2.0-flash-exp"),
          input.topic
        );
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Visualization generation timed out after 2 minutes")), 120000)
        );
        
        const visualization = await Promise.race([visualizePromise, timeoutPromise]) as Awaited<typeof visualizePromise>;
        
        console.log(`✅ Visualization generated successfully (${visualization.object.diagram_type})`);
        
        return {
          success: true,
          data: {
            ...visualization.object,
            userQuery: input.userQuery,
            difficulty: input.difficulty,
            topic: input.topic,
            generatedAt: new Date().toISOString()
          }
        };
        
      } catch (error) {
        console.error("❌ Error generating visualization:", error);
        
        // Provide more detailed error information
        if (error instanceof Error) {
          if (error.message.includes("Visualization generation timed out")) {
            throw new Error("Visualization generation took too long and was cancelled (>2 minutes)");
          }
        }
        
        throw new Error(`Failed to generate visualization: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  compareTopics: publicProcedure
    .input(z.object({
      topic1: z.object({
        topic_name: z.string(),
        topic_page_start: z.number(),
        topic_page_end: z.number(),
        topic_summary: z.string()
      }),
      topic2: z.object({
        topic_name: z.string(),
        topic_page_start: z.number(),
        topic_page_end: z.number(),
        topic_summary: z.string()
      })
    }))
    .mutation(async ({ input }) => {
      try {
        console.log(`🔍 Starting comparison between topics:`);
        console.log(`📚 Topic 1: ${input.topic1.topic_name}`);
        console.log(`📚 Topic 2: ${input.topic2.topic_name}`);

        // Call the comparison function with timeout
        const comparisonPromise = generateTopicComparison(
          input.topic1,
          input.topic2,
          llms.gemini("gemini-2.0-flash-exp")
        );
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Topic comparison timed out after 3 minutes")), 180000)
        );
        
        const comparison = await Promise.race([comparisonPromise, timeoutPromise]) as Awaited<typeof comparisonPromise>;
        
        console.log(`✅ Topic comparison generated successfully`);
        console.log(`🔗 Relationship: ${comparison.overall_analysis.relationship}`);
        console.log(`📖 Learning sequence: ${comparison.overall_analysis.learning_sequence}`);
        
        return {
          success: true,
          data: {
            ...comparison,
            generatedAt: new Date().toISOString()
          }
        };
        
      } catch (error) {
        console.error("❌ Error generating topic comparison:", error);
        
        // Provide more detailed error information
        if (error instanceof Error) {
          if (error.message.includes("Topic comparison timed out")) {
            throw new Error("Topic comparison took too long and was cancelled (>3 minutes)");
          }
        }
        
        throw new Error(`Failed to generate topic comparison: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),
});
