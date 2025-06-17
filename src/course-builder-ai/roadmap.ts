import { generateObject, type LanguageModelV1 } from "ai";
import z from "zod";

// Define the schema for a single topic in the roadmap
const TopicSchema = z.object({
  id: z.string().describe("Unique identifier for the topic"),
  title: z.string().describe("The title of the topic"),
  summary: z.string().describe("A brief summary explaining what this topic covers and why it's important"),
  level: z.number().describe("The depth level of this topic (0 for root, 1 for main branches, 2 for sub-branches, etc.)"),
  parentId: z.string().optional().describe("ID of the parent topic (undefined for root topics)"),
  children: z.array(z.string()).describe("Array of child topic IDs that branch from this topic")
});

// Define the schema for the complete roadmap
const RoadmapSchema = z.object({
  title: z.string().describe("The title of the complete learning roadmap"),
  description: z.string().describe("An overview of what the roadmap covers"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).describe("The difficulty level of the roadmap"),
  rootTopics: z.array(z.string()).describe("Array of root topic IDs that start the learning path"),
  topics: z.record(z.string(), TopicSchema).describe("Map of topic ID to topic object for easy lookup and mindmap creation")
});

export type Topic = z.infer<typeof TopicSchema>;
export type Roadmap = z.infer<typeof RoadmapSchema>;

export async function generateRoadmap(
  topic: string,
  difficulty: "beginner" | "intermediate" | "advanced",
  model: LanguageModelV1
): Promise<Roadmap> {
  const { object } = await generateObject({
    model,
    schema: RoadmapSchema,
    prompt: `Create a comprehensive learning roadmap for "${topic}" at ${difficulty} level that can be used to generate a mindmap.

The roadmap should:
- Be structured as a hierarchical tree with branching topics
- Have multiple main branches (root topics) that can be learned in parallel
- Each topic can have multiple subtopics that branch out from it
- Topics at the same level can be learned simultaneously or in any order
- Include clear parent-child relationships between topics
- Provide clear summaries for each topic explaining what will be learned and why it's important
- Be appropriate for ${difficulty} level learners
- Use unique IDs for each topic and maintain parent-child relationships

Structure it like a mindmap where:
- Level 0: Core foundational concepts (2-4 root topics)
- Level 1: Main learning areas that branch from foundations (3-6 topics per branch)
- Level 2: Specific skills/concepts within each area (2-4 topics per branch)
- Level 3+: Advanced/specialized topics as needed

Make sure each topic has a unique ID, references its parent (if any), and lists its children.`,
  });

  return object;
}
