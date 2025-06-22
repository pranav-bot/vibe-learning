import { generateObject, type LanguageModelV1 } from "ai";
import z from "zod";

// Define the schema for a single topic in the roadmap
const TopicSchema = z.object({
  id: z.string().describe("Unique identifier for the topic"),
  title: z.string().describe("The title of the topic"),
  summary: z.string().describe("A brief summary explaining what this topic covers and why it's important"),
  level: z.number().describe("The depth level of this topic (0 for root, 1 for main branches, 2 for sub-branches, etc.)"),
  parentId: z.string().optional().describe("ID of the parent topic (should be undefined or omitted for root topics)"),
  children: z.array(z.string()).describe("Array of child topic IDs that branch from this topic")
}).transform((data) => ({
  ...data,
  // Transform empty string, "null", or "undefined" parentId to undefined for root topics
  parentId: data.parentId === "" || data.parentId === "null" || data.parentId === "undefined" ? undefined : data.parentId
}));

// Define the schema for the complete roadmap
const RoadmapSchema = z.object({
  title: z.string().describe("The title of the complete learning roadmap"),
  description: z.string().describe("An overview of what the roadmap covers"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).describe("The difficulty level of the roadmap"),
  rootTopics: z.array(z.string()).describe("Array of root topic IDs that start the roadmap"),
  topics: z.array(TopicSchema).describe("Array of all topics in the roadmap for easy lookup and mindmap creation")
});

export type Topic = z.infer<typeof TopicSchema>;
export type Roadmap = z.infer<typeof RoadmapSchema>;

export async function generateRoadmap(
  topic: string,
  difficulty: "beginner" | "intermediate" | "advanced",
  model: LanguageModelV1
): Promise<Roadmap> {
  try {
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
- Level 0: Core foundational concepts (2-4 root topics) - these should have NO parentId (leave it undefined or null)
- Level 1: Main learning areas that branch from foundations (3-6 topics per branch)
- Level 2: Specific skills/concepts within each area (2-4 topics per branch)
- Level 3+: Advanced/specialized topics as needed

CRITICAL RULES:
- Root topics (level 0) must have parentId as null or undefined (do NOT use empty string "")
- Only non-root topics should have a valid parentId that references their parent topic's ID
- The rootTopics array must contain the exact IDs of all level 0 topics
- Each topic must have a children array listing the IDs of its direct children
- Ensure parent-child relationships are consistent (if A is parent of B, then B's parentId should be A's id)

Example structure:
- Topic with level 0: { "id": "TOPIC-001", "level": 0, "parentId": null, "children": ["TOPIC-101", "TOPIC-102"] }
- Topic with level 1: { "id": "TOPIC-101", "level": 1, "parentId": "TOPIC-001", "children": ["TOPIC-111"] }

Return the topics as an array where each topic has a unique ID and proper parent-child relationships.`,
    });

    return object;
  } catch (error) {
    console.error("Error in generateRoadmap:", error);
    throw new Error(`Failed to generate roadmap: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
