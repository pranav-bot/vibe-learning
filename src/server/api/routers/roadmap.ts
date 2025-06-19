import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { generateRoadmap } from "~/course-builder-ai/roadmap";
import { youtubeResources } from "~/course-builder-ai/resources";
import llms from "~/lib/llms";

export const roadmapRouter = createTRPCRouter({
  generate: publicProcedure
    .input(z.object({ 
      topic: z.string(),
      difficulty: z.enum(["beginner", "intermediate", "advanced"])
    }))
    .mutation(async ({ input }) => {
      try {
        console.log(`🗺️ Starting roadmap generation for topic: ${input.topic}`);
        console.log(`🎚️ Difficulty: ${input.difficulty}`);
        
        // Try with gemini-2.0-flash first, then fallback to other models if needed
        let roadmap;
        try {
          const roadmapPromise = generateRoadmap(
            input.topic,
            input.difficulty,
            llms.gemini("gemini-2.0-flash")
          );
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Roadmap generation timed out after 2 minutes")), 120000)
          );
          
          roadmap = await Promise.race([roadmapPromise, timeoutPromise]) as Awaited<typeof roadmapPromise>;
        } catch (geminiError) {
          console.warn("⚠️ Gemini 2.0 model failed, trying fallback...", geminiError);
          
          // Fallback to gemini-1.5-flash
          try {
            roadmap = await generateRoadmap(
              input.topic,
              input.difficulty,
              llms.gemini("gemini-1.5-flash")
            );
          } catch (fallbackError) {
            console.error("❌ Fallback model also failed:", fallbackError);
            throw geminiError; // Throw original error
          }
        }
        
        console.log(`✅ Roadmap generated successfully`);
        console.log(`📚 Generated ${Object.keys(roadmap.topics).length} topics`);
        console.log(`🗺️ Roadmap output:`, JSON.stringify(roadmap, null, 2));
        
        return {
          success: true,
          data: roadmap
        };
        
      } catch (error) {
        console.error("❌ Error generating roadmap:", error);
        
        // Provide more detailed error information
        if (error instanceof Error) {
          if (error.message.includes("Roadmap generation timed out")) {
            throw new Error("Roadmap generation took too long and was cancelled. Please try again with a simpler topic.");
          }
          if (error.message.includes("property is not defined")) {
            throw new Error("AI model configuration error. Please try again.");
          }
        }
        
        throw new Error(`Failed to generate roadmap: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  youtubeResources: publicProcedure
    .input(z.object({
      topic: z.string(),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]),
      topicSummary: z.string()
    }))
    .mutation(async ({ input }) => {
      try {
        console.log(`🎥 Starting YouTube resources fetch for topic: ${input.topic}`);
        console.log(`🎚️ Difficulty: ${input.difficulty}`);
        
        // Use gemini model for resource selection
        const model = llms.gemini("gemini-1.5-flash");
        
        const resources = await youtubeResources(
          input.topic,
          input.difficulty,
          input.topicSummary,
          model
        );
        
        console.log(`✅ YouTube resources fetched successfully`);
        console.log(`📺 Found ${resources.selectedVideos.length} relevant videos`);
        
        return {
          success: true,
          data: resources
        };
        
      } catch (error) {
        console.error("❌ Error fetching YouTube resources:", error);
        
        if (error instanceof Error) {
          if (error.message.includes("YouTube API key not found")) {
            throw new Error("YouTube API is not configured. Please contact the administrator.");
          }
          if (error.message.includes("No YouTube videos found")) {
            throw new Error("No relevant videos found for this topic. Try a different search term.");
          }
        }
        
        throw new Error(`Failed to fetch YouTube resources: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),
});
