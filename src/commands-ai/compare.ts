import { generateObject, type LanguageModelV1 } from "ai";
import z from "zod";
import { type TopicData } from "./utils";

// Schema for the comparison result
const ComparisonSchema = z.object({
  topic1: z.object({
    name: z.string(),
    summary: z.string(),
    key_concepts: z.array(z.string()),
    strengths: z.array(z.string()),
    limitations: z.array(z.string()),
  }),
  topic2: z.object({
    name: z.string(),
    summary: z.string(),
    key_concepts: z.array(z.string()),
    strengths: z.array(z.string()),
    limitations: z.array(z.string()),
  }),
  comparison: z.object({
    similarities: z.array(z.string()),
    differences: z.array(z.string()),
    complementary_aspects: z.array(z.string()),
    use_cases: z.object({
      when_to_use_topic1: z.array(z.string()),
      when_to_use_topic2: z.array(z.string()),
    }),
  }),
  overall_analysis: z.object({
    relationship: z.string(),
    recommendation: z.string(),
    learning_sequence: z.enum(["topic1_first", "topic2_first", "parallel", "independent"]),
  }),
});

export type ComparisonResult = z.infer<typeof ComparisonSchema>;

/**
 * Generates a comprehensive comparison between two topics
 * @param topic1 - First topic to compare
 * @param topic2 - Second topic to compare
 * @param model - Language model to use for generation
 * @returns Structured comparison analysis
 */
export async function generateTopicComparison(
  topic1: TopicData,
  topic2: TopicData,
  model: LanguageModelV1
): Promise<ComparisonResult> {
  const prompt = `
    Please provide a comprehensive comparison between these two educational topics:

    Topic 1: ${topic1.topic_name}
    Summary: ${topic1.topic_summary}
    Page Range: ${topic1.topic_page_start}-${topic1.topic_page_end}

    Topic 2: ${topic2.topic_name}
    Summary: ${topic2.topic_summary}
    Page Range: ${topic2.topic_page_start}-${topic2.topic_page_end}

    Please analyze both topics in detail and provide:

    1. For each topic:
       - A clear summary
       - Key concepts covered
       - Strengths and advantages
       - Limitations or areas where it might fall short

    2. Comparison analysis:
       - Similarities between the topics
       - Key differences
       - How they complement each other
       - Specific use cases for when to apply each topic

    3. Overall analysis:
       - The relationship between these topics (prerequisite, complementary, alternative approaches, etc.)
       - A recommendation for learners
       - Suggested learning sequence (which to learn first, or if they can be learned in parallel)

    Focus on providing actionable insights that would help a learner understand when and how to use each topic effectively.
  `;

  try {
    const { object } = await generateObject({
      model,
      schema: ComparisonSchema,
      prompt,
    });

    return object;
  } catch (error) {
    console.error("Error generating topic comparison:", error);
    throw new Error("Failed to generate topic comparison");
  }
}

