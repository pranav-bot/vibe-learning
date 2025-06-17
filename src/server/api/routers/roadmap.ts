import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { generateRoadmap } from "~/course-builder-ai/roadmap";
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
});
