import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { generateLearningCurve } from "~/course-builder-ai/learning-curve";
import llms from "~/lib/llms";

export const curveRouter = createTRPCRouter({
  generate: publicProcedure
    .input(z.object({ 
      topic: z.string(),
      difficulty: z.enum(["beginner", "intermediate", "advanced"])
    }))
    .mutation(async ({ input }) => {
      try {
        console.log(`📈 Starting learning curve generation for topic: ${input.topic}`);
        console.log(`🎚️ Difficulty: ${input.difficulty}`);
        
        // Try with gemini-2.0-flash first, then fallback to other models if needed
        let learningCurve;
        try {
          const curvePromise = generateLearningCurve(
            input.topic,
            input.difficulty,
            llms.gemini("gemini-2.0-flash")
          );
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Learning curve generation timed out after 2 minutes")), 120000)
          );
          
          learningCurve = await Promise.race([curvePromise, timeoutPromise]);
          console.log(`✅ Learning curve generated successfully with gemini-2.0-flash`);
        } catch (error) {
          console.log(`⚠️ Gemini failed, trying fallback model:`, error);
          
          try {
            learningCurve = await generateLearningCurve(
              input.topic,
              input.difficulty,
              llms.openai("gpt-4o")
            );
            console.log(`✅ Learning curve generated successfully with GPT-4o fallback`);
          } catch (fallbackError) {
            console.error(`❌ Both Gemini and GPT-4o failed:`, fallbackError);
            throw new Error("Failed to generate learning curve with all available models");
          }
        }

        if (!learningCurve) {
          throw new Error("Learning curve generation returned null or undefined");
        }

        console.log(`📊 Learning curve contains ${learningCurve.coreModules.length} core modules`);
        console.log(`⏱️ Total estimated hours: ${learningCurve.totalEstimatedHours}`);
        console.log(`🎯 Max impact score: ${learningCurve.maxImpact}`);

        return {
          success: true,
          data: learningCurve,
          message: "Learning curve generated successfully"
        };
      } catch (error) {
        console.error("❌ Error in learning curve generation:", error);
        throw new Error(
          `Failed to generate learning curve: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  // Additional procedure to get curve data for visualization
  getCurveData: publicProcedure
    .input(z.object({
      topic: z.string(),
      difficulty: z.enum(["beginner", "intermediate", "advanced"])
    }))
    .query(async ({ input }) => {
      try {
        console.log(`📊 Getting curve data for visualization: ${input.topic}`);
        
        const learningCurve = await generateLearningCurve(
          input.topic,
          input.difficulty,
          llms.gemini("gemini-2.0-flash")
        );

        // Extract only the curve data for chart visualization
        const curveData = learningCurve.curveData.map((point, index) => ({
          ...point,
          moduleTitle: learningCurve.coreModules.find(m => m.id === point.moduleId)?.title || `Module ${index + 1}`,
          category: learningCurve.coreModules.find(m => m.id === point.moduleId)?.category || "unknown"
        }));

        return {
          success: true,
          data: {
            topic: learningCurve.topic,
            difficulty: learningCurve.difficulty,
            totalEstimatedHours: learningCurve.totalEstimatedHours,
            maxImpact: learningCurve.maxImpact,
            curveData
          }
        };
      } catch (error) {
        console.error("❌ Error getting curve data:", error);
        throw new Error(
          `Failed to get curve data: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
});