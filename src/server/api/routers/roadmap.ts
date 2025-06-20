import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { generateRoadmap } from "~/course-builder-ai/roadmap";
import { youtubeResources } from "~/course-builder-ai/resources";
import llms from "~/lib/llms";
import { db } from "~/server/db";

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

  save: publicProcedure
    .input(z.object({
      roadmap: z.object({
        title: z.string(),
        description: z.string(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]),
        rootTopics: z.array(z.string()),
        topics: z.array(z.object({
          id: z.string(),
          title: z.string(),
          summary: z.string(),
          level: z.number(),
          parentId: z.string().optional(),
          children: z.array(z.string())
        }))
      })
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        console.log(`💾 Starting roadmap save for: ${input.roadmap.title}`);
        console.log(`👤 User ID: ${ctx.user?.id ?? 'anonymous'}`);
        
        // Create the roadmap record
        const savedRoadmap = await db.roadmap.create({
          data: {
            title: input.roadmap.title,
            description: input.roadmap.description,
            difficulty: input.roadmap.difficulty,
            profileId: ctx.user?.id ?? null, // Use the authenticated user ID
            topics: {
              create: input.roadmap.topics.map(topic => ({
                id: topic.id,
                title: topic.title,
                summary: topic.summary,
                level: topic.level,
                parentId: topic.parentId || null
              }))
            }
          },
          include: {
            topics: true,
            profile: true
          }
        });
        
        console.log(`✅ Roadmap saved successfully with ID: ${savedRoadmap.id}`);
        console.log(`📚 Saved ${savedRoadmap.topics.length} topics`);
        
        return {
          success: true,
          data: {
            id: savedRoadmap.id,
            title: savedRoadmap.title,
            description: savedRoadmap.description,
            difficulty: savedRoadmap.difficulty,
            createdAt: savedRoadmap.createdAt,
            topicCount: savedRoadmap.topics.length
          }
        };
        
      } catch (error) {
        console.error("❌ Error saving roadmap:", error);
        
        if (error instanceof Error) {
          if (error.message.includes("Unique constraint")) {
            throw new Error("A roadmap with this title already exists. Please choose a different title.");
          }
          if (error.message.includes("Foreign key constraint")) {
            throw new Error("Invalid profile ID provided.");
          }
        }
        
        throw new Error(`Failed to save roadmap: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  getUserRoadmaps: publicProcedure
    .input(z.object({
      profileId: z.string().optional()
    }))
    .query(async ({ input }) => {
      try {
        console.log(`📚 Retrieving roadmaps for profile: ${input.profileId ?? 'anonymous'}`);
        
        const roadmaps = await db.roadmap.findMany({
          where: {
            profileId: input.profileId ?? null
          },
          include: {
            topics: {
              orderBy: {
                level: 'asc'
              }
            },
            profile: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        console.log(`✅ Found ${roadmaps.length} roadmaps`);
        
        return {
          success: true,
          data: roadmaps.map(roadmap => ({
            id: roadmap.id,
            title: roadmap.title,
            description: roadmap.description,
            difficulty: roadmap.difficulty,
            createdAt: roadmap.createdAt,
            updatedAt: roadmap.updatedAt,
            topicCount: roadmap.topics.length,
            topics: roadmap.topics.map(topic => ({
              id: topic.id,
              title: topic.title,
              summary: topic.summary,
              level: topic.level,
              parentId: topic.parentId,
              children: [] // We'll reconstruct this from the parent-child relationships
            }))
          }))
        };
        
      } catch (error) {
        console.error("❌ Error retrieving roadmaps:", error);
        throw new Error(`Failed to retrieve roadmaps: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  getRoadmapById: publicProcedure
    .input(z.object({
      id: z.string()
    }))
    .query(async ({ input }) => {
      try {
        console.log(`🔍 Retrieving roadmap with ID: ${input.id}`);
        
        const roadmap = await db.roadmap.findUnique({
          where: {
            id: input.id
          },
          include: {
            topics: {
              orderBy: {
                level: 'asc'
              }
            },
            profile: true
          }
        });
        
        if (!roadmap) {
          throw new Error("Roadmap not found");
        }
        
        // Reconstruct the roadmap format with children relationships
        const reconstructedTopics = roadmap.topics.map(topic => ({
          id: topic.id,
          title: topic.title,
          summary: topic.summary,
          level: topic.level,
          parentId: topic.parentId,
          children: roadmap.topics
            .filter(t => t.parentId === topic.id)
            .map(t => t.id)
        }));
        
        const rootTopics = reconstructedTopics
          .filter(topic => topic.parentId === null)
          .map(topic => topic.id);
        
        const reconstructedRoadmap = {
          title: roadmap.title,
          description: roadmap.description,
          difficulty: roadmap.difficulty as "beginner" | "intermediate" | "advanced",
          rootTopics: rootTopics,
          topics: reconstructedTopics
        };
        
        console.log(`✅ Roadmap retrieved successfully`);
        
        return {
          success: true,
          data: {
            id: roadmap.id,
            createdAt: roadmap.createdAt,
            updatedAt: roadmap.updatedAt,
            roadmap: reconstructedRoadmap
          }
        };
        
      } catch (error) {
        console.error("❌ Error retrieving roadmap:", error);
        throw new Error(`Failed to retrieve roadmap: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  delete: publicProcedure
    .input(z.object({
      id: z.string(),
      profileId: z.string().optional() // Optional profile ID for authorization
    }))
    .mutation(async ({ input }) => {
      try {
        console.log(`🗑️ Deleting roadmap with ID: ${input.id}`);
        
        // First check if the roadmap exists and belongs to the user (if profileId provided)
        const existingRoadmap = await db.roadmap.findUnique({
          where: {
            id: input.id
          },
          include: {
            topics: true
          }
        });
        
        if (!existingRoadmap) {
          throw new Error("Roadmap not found");
        }
        
        // Check authorization if profileId is provided
        if (input.profileId && existingRoadmap.profileId !== input.profileId) {
          throw new Error("Unauthorized: You can only delete your own roadmaps");
        }
        
        // Delete the roadmap (topics will be deleted due to cascade)
        await db.roadmap.delete({
          where: {
            id: input.id
          }
        });
        
        console.log(`✅ Roadmap deleted successfully`);
        console.log(`🗑️ Deleted ${existingRoadmap.topics.length} associated topics`);
        
        return {
          success: true,
          message: "Roadmap deleted successfully"
        };
        
      } catch (error) {
        console.error("❌ Error deleting roadmap:", error);
        
        if (error instanceof Error) {
          if (error.message.includes("not found")) {
            throw new Error("Roadmap not found or already deleted");
          }
          if (error.message.includes("Unauthorized")) {
            throw error; // Re-throw authorization errors as-is
          }
        }
        
        throw new Error(`Failed to delete roadmap: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),
});
