import { generateObject, type LanguageModelV1 } from "ai";
import z from "zod";
import type { Roadmap } from "./roadmap";

// Define the schema for a single project
const ProjectSchema = z.object({
  id: z.string().describe("Unique identifier for the project"),
  title: z.string().describe("The title of the project"),
  description: z.string().describe("Detailed description of what the project involves and what will be built"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).describe("Difficulty level of the project"),
  estimatedTime: z.string().describe("Estimated time to complete (e.g., '2-3 hours', '1 week', '2-4 days')"),
  technologies: z.array(z.string()).describe("Technologies, tools, or skills that will be used/learned"),
  relatedTopicIds: z.array(z.string()).describe("Array of topic IDs from the roadmap that this project covers"),
  deliverables: z.array(z.string()).describe("What the learner will have built/created upon completion")
});

// Define the schema for the project list
const ProjectListSchema = z.object({
  projects: z.array(ProjectSchema).describe("List of suggested projects based on the roadmap")
});

export type Project = z.infer<typeof ProjectSchema>;
export type ProjectList = z.infer<typeof ProjectListSchema>;

/**
 * Generates project suggestions based on a roadmap
 */
export async function generateProjectsForRoadmap(
  roadmap: Roadmap,
  model: LanguageModelV1,
  projectCount = 6
): Promise<ProjectList> {
  try {
    const { object } = await generateObject({
      model,
      schema: ProjectListSchema,
      prompt: `Based on the following learning roadmap, generate ${projectCount} practical projects that will help learners practice the topics effectively.

ROADMAP DETAILS:
Title: ${roadmap.title}
Description: ${roadmap.description}
Difficulty: ${roadmap.difficulty}

TOPICS IN ROADMAP:
${roadmap.topics.map(topic => `
- ${topic.title} (ID: ${topic.id})
  Summary: ${topic.summary}
  Level: ${topic.level}
`).join('')}

PROJECT REQUIREMENTS:
1. Create ${projectCount} diverse projects that cover different topics from the roadmap
2. Each project should reference specific topic IDs from the roadmap in relatedTopicIds
3. Projects should vary in difficulty: some beginner, some intermediate, some advanced
4. Each project should have clear deliverables and realistic time estimates
5. Use appropriate technologies that match the roadmap's subject area
6. Make projects practical and portfolio-worthy

IMPORTANT: 
- Use the exact topic IDs from the roadmap in the relatedTopicIds arrays
- Ensure projects are specific and actionable with clear deliverables
- Tailor difficulty and technologies to the roadmap's overall level and topics`,
    });

    return object;
  } catch (error) {
    console.error("Error in generateProjectsForRoadmap:", error);
    throw new Error(`Failed to generate projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

