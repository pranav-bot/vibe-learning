import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { generateRoadmap } from "~/course-builder-ai/roadmap";
import { youtubeResources } from "~/course-builder-ai/resources";
import { generateProjectsForRoadmap, type Project } from "~/course-builder-ai/projects";
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
    .input(z.object({}))
    .query(async ({ ctx }) => {
      try {
        const profileId = ctx.user?.id ?? null;
        console.log(`📚 Retrieving roadmaps for profile: ${profileId ?? 'anonymous'}`);
        
        const roadmaps = await db.roadmap.findMany({
          where: {
            profileId: profileId
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

  saveYoutubeResources: publicProcedure
    .input(z.object({
      topicId: z.string(),
      resources: z.array(z.object({
        videoId: z.string(),
        title: z.string(),
        description: z.string(),
        channelTitle: z.string(),
        publishedAt: z.string(),
        thumbnailUrl: z.string(),
        relevanceScore: z.number().min(1).max(10),
        relevanceReason: z.string(),
        url: z.string()
      }))
    }))
    .mutation(async ({ input }) => {
      try {
        console.log(`💾 Saving YouTube resources for topic: ${input.topicId}`);
        console.log(`📺 Number of resources to save: ${input.resources.length}`);
        
        // First, verify the topic exists
        const topic = await db.topic.findUnique({
          where: { id: input.topicId }
        });
        
        if (!topic) {
          throw new Error("Topic not found");
        }
        
        // Delete existing YouTube resources for this topic to avoid duplicates
        await db.resource.deleteMany({
          where: {
            topicId: input.topicId,
            type: 'YOUTUBE_VIDEO'
          }
        });
        
        // Create new resources
        const savedResources = await db.resource.createMany({
          data: input.resources.map(resource => ({
            title: resource.title,
            description: resource.description,
            url: resource.url,
            type: 'YOUTUBE_VIDEO' as const,
            relevanceScore: resource.relevanceScore,
            relevanceReason: resource.relevanceReason,
            thumbnailUrl: resource.thumbnailUrl,
            channelTitle: resource.channelTitle,
            publishedAt: new Date(resource.publishedAt),
            topicId: input.topicId
          }))
        });
        
        console.log(`✅ YouTube resources saved successfully`);
        console.log(`📺 Saved ${savedResources.count} resources`);
        
        return {
          success: true,
          data: {
            savedCount: savedResources.count,
            topicId: input.topicId
          }
        };
        
      } catch (error) {
        console.error("❌ Error saving YouTube resources:", error);
        
        if (error instanceof Error) {
          if (error.message.includes("Topic not found")) {
            throw new Error("The specified topic does not exist");
          }
          if (error.message.includes("Foreign key constraint")) {
            throw new Error("Invalid topic ID provided");
          }
        }
        
        throw new Error(`Failed to save YouTube resources: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  getTopicResources: publicProcedure
    .input(z.object({
      topicId: z.string(),
      type: z.enum(['YOUTUBE_VIDEO', 'ARTICLE', 'DOCUMENTATION', 'TUTORIAL', 'COURSE', 'BOOK', 'PODCAST', 'EXERCISE', 'QUIZ', 'OTHER']).optional()
    }))
    .query(async ({ input }) => {
      try {
        console.log(`📚 Retrieving resources for topic: ${input.topicId}`);
        if (input.type) {
          console.log(`🔍 Filtering by type: ${input.type}`);
        }
        
        const resources = await db.resource.findMany({
          where: {
            topicId: input.topicId,
            ...(input.type && { type: input.type })
          },
          orderBy: [
            { relevanceScore: 'desc' },
            { createdAt: 'desc' }
          ]
        });
        
        console.log(`✅ Found ${resources.length} resources`);
        
        return {
          success: true,
          data: resources
        };
        
      } catch (error) {
        console.error("❌ Error retrieving topic resources:", error);
        throw new Error(`Failed to retrieve topic resources: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  generateProjects: publicProcedure
    .input(z.object({
      roadmapId: z.string(),
      projectCount: z.number().min(1).max(20).default(6)
    }))
    .mutation(async ({ input }) => {
      try {
        console.log(`🚀 Generating projects for roadmap: ${input.roadmapId}`);
        console.log(`📊 Project count requested: ${input.projectCount}`);
        
        // First, get the roadmap with its topics
        const roadmap = await db.roadmap.findUnique({
          where: { id: input.roadmapId },
          include: {
            topics: {
              orderBy: { level: 'asc' }
            }
          }
        });
        
        if (!roadmap) {
          throw new Error("Roadmap not found");
        }
        
        // Convert the database roadmap to the format expected by generateProjectsForRoadmap
        const roadmapForGeneration = {
          title: roadmap.title,
          description: roadmap.description,
          difficulty: roadmap.difficulty as "beginner" | "intermediate" | "advanced",
          rootTopics: roadmap.topics
            .filter(topic => topic.parentId === null)
            .map(topic => topic.id),
          topics: roadmap.topics.map(topic => ({
            id: topic.id,
            title: topic.title,
            summary: topic.summary,
            level: topic.level,
            parentId: topic.parentId ?? undefined,
            children: roadmap.topics
              .filter(t => t.parentId === topic.id)
              .map(t => t.id)
          }))
        };
        
        // Generate projects using AI
        const model = llms.gemini("gemini-1.5-flash");
        const projectList = await generateProjectsForRoadmap(
          roadmapForGeneration,
          model,
          input.projectCount
        );
        
        console.log(`✅ Generated ${projectList.projects.length} projects successfully`);
        
        return {
          success: true,
          data: projectList.projects
        };
        
      } catch (error) {
        console.error("❌ Error generating projects:", error);
        
        if (error instanceof Error) {
          if (error.message.includes("Roadmap not found")) {
            throw new Error("The specified roadmap does not exist");
          }
        }
        
        throw new Error(`Failed to generate projects: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  saveProjects: publicProcedure
    .input(z.object({
      roadmapId: z.string(),
      projects: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
        estimatedTime: z.string(),
        technologies: z.array(z.string()),
        relatedTopicIds: z.array(z.string()),
        deliverables: z.array(z.string())
      }))
    }))
    .mutation(async ({ input }) => {
      try {
        console.log(`💾 Saving projects for roadmap: ${input.roadmapId}`);
        console.log(`📝 Number of projects to save: ${input.projects.length}`);
        
        // First, verify the roadmap exists
        const roadmap = await db.roadmap.findUnique({
          where: { id: input.roadmapId },
          include: { topics: true }
        });
        
        if (!roadmap) {
          throw new Error("Roadmap not found");
        }
        
        // Verify all related topic IDs exist in the roadmap
        const roadmapTopicIds = new Set(roadmap.topics.map(t => t.id));
        for (const project of input.projects) {
          for (const topicId of project.relatedTopicIds) {
            if (!roadmapTopicIds.has(topicId)) {
              throw new Error(`Topic ID ${topicId} not found in roadmap ${input.roadmapId}`);
            }
          }
        }
        
        // Delete existing projects for this roadmap to avoid duplicates
        await db.project.deleteMany({
          where: { roadmapId: input.roadmapId }
        });
        
        // Create new projects and their topic relationships
        const savedProjects = [];
        for (const project of input.projects) {
          const savedProject = await db.project.create({
            data: {
              id: project.id,
              title: project.title,
              description: project.description,
              difficulty: project.difficulty,
              estimatedTime: project.estimatedTime,
              technologies: project.technologies,
              deliverables: project.deliverables,
              roadmapId: input.roadmapId,
              relatedTopics: {
                create: project.relatedTopicIds.map(topicId => ({
                  topicId: topicId
                }))
              }
            },
            include: {
              relatedTopics: {
                include: {
                  topic: true
                }
              }
            }
          });
          savedProjects.push(savedProject);
        }
        
        console.log(`✅ Projects saved successfully`);
        console.log(`📝 Saved ${savedProjects.length} projects`);
        
        return {
          success: true,
          data: {
            savedCount: savedProjects.length,
            roadmapId: input.roadmapId,
            projects: savedProjects.map(p => ({
              id: p.id,
              title: p.title,
              description: p.description,
              difficulty: p.difficulty,
              estimatedTime: p.estimatedTime,
              technologies: p.technologies,
              deliverables: p.deliverables,
              relatedTopics: p.relatedTopics.map(rt => ({
                id: rt.topic.id,
                title: rt.topic.title
              }))
            }))
          }
        };
        
      } catch (error) {
        console.error("❌ Error saving projects:", error);
        
        if (error instanceof Error) {
          if (error.message.includes("Roadmap not found")) {
            throw new Error("The specified roadmap does not exist");
          }
          if (error.message.includes("Topic ID") && error.message.includes("not found")) {
            throw error; // Re-throw topic validation errors as-is
          }
          if (error.message.includes("Foreign key constraint")) {
            throw new Error("Invalid roadmap or topic ID provided");
          }
        }
        
        throw new Error(`Failed to save projects: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),

  getProjects: publicProcedure
    .input(z.object({
      roadmapId: z.string()
    }))
    .query(async ({ input }) => {
      try {
        console.log(`📋 Retrieving projects for roadmap: ${input.roadmapId}`);
        
        const projects = await db.project.findMany({
          where: { roadmapId: input.roadmapId },
          include: {
            relatedTopics: {
              include: {
                topic: {
                  select: {
                    id: true,
                    title: true,
                    summary: true,
                    level: true
                  }
                }
              }
            },
            roadmap: {
              select: {
                id: true,
                title: true,
                difficulty: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        });
        
        console.log(`✅ Found ${projects.length} projects`);
        
        const formattedProjects = projects.map(project => ({
          id: project.id,
          title: project.title,
          description: project.description,
          difficulty: project.difficulty,
          estimatedTime: project.estimatedTime,
          technologies: project.technologies,
          deliverables: project.deliverables,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          relatedTopics: project.relatedTopics.map(rt => ({
            id: rt.topic.id,
            title: rt.topic.title,
            summary: rt.topic.summary,
            level: rt.topic.level
          })),
          roadmap: project.roadmap
        }));
        
        return {
          success: true,
          data: {
            roadmapId: input.roadmapId,
            projects: formattedProjects,
            totalCount: formattedProjects.length
          }
        };
        
      } catch (error) {
        console.error("❌ Error retrieving projects:", error);
        throw new Error(`Failed to retrieve projects: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),
});
