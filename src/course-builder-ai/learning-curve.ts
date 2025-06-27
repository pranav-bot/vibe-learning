import { generateObject, type LanguageModelV1 } from "ai";
import z from "zod";

// Define the schema for a sub-module
const SubModuleSchema = z.object({
  id: z.string().describe("Unique identifier for the sub-module"),
  title: z.string().describe("The title of the sub-module"),
  description: z.string().describe("Detailed description of what this sub-module covers"),
  timeToLearn: z.number().describe("Estimated time to learn this sub-module in hours"),
  impact: z.number().min(1).max(10).describe("Impact score (1-10) indicating how important this sub-module is for learning the main topic"),
  learningOutcomes: z.array(z.string()).describe("What the learner will be able to do after completing this sub-module")
});

// Define the schema for a core module
const CoreModuleSchema = z.object({
  id: z.string().describe("Unique identifier for the core module"),
  title: z.string().describe("The title of the core module"),
  description: z.string().describe("Overview of what this core module covers"),
  totalTimeToLearn: z.number().describe("Total estimated time to learn this entire core module in hours"),
  totalImpact: z.number().describe("Total impact score for this core module (sum of all sub-module impacts)"),
  cumulativeTime: z.number().describe("Cumulative time in hours up to and including this module"),
  cumulativeImpact: z.number().describe("Cumulative impact score up to and including this module"),
  order: z.number().describe("Suggested order in the learning curve (1 for first, 2 for second, etc.)"),
  steepness: z.number().min(0.1).max(5.0).describe("Learning steepness factor (0.1-5.0) based on impact-to-time ratio - higher values indicate more impact gain per hour"),
  subModules: z.array(SubModuleSchema).describe("Array of sub-modules within this core module")
});

// Define the schema for the complete learning curve
const LearningCurveSchema = z.object({
  topic: z.string().describe("The main topic being learned"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).describe("The difficulty level"),
  totalEstimatedHours: z.number().describe("Total estimated hours to complete the entire learning curve"),
  totalImpact: z.number().describe("Total impact score achievable"),
  coreModules: z.array(CoreModuleSchema).describe("Array of core modules ordered by learning progression")
});

export type SubModule = z.infer<typeof SubModuleSchema>;
export type CoreModule = z.infer<typeof CoreModuleSchema>;
export type LearningCurve = z.infer<typeof LearningCurveSchema>;

export async function generateLearningCurve(
  topic: string,
  difficulty: "beginner" | "intermediate" | "advanced",
  model: LanguageModelV1
): Promise<LearningCurve> {
  try {
    const { object } = await generateObject({
      model,
      schema: LearningCurveSchema,
      prompt: `Create a comprehensive learning curve for "${topic}" at ${difficulty} level that generates core modules with varying steepness values for optimal time vs. impact visualization.

Design this as a flexible, data-driven learning journey where:
- The NUMBER of core modules varies based on difficulty (not fixed at 4-6)
- The NUMBER of sub-modules per core module varies based on complexity
- Steepness is calculated as IMPACT-TO-TIME RATIO for each core module

FLEXIBLE MODULE GENERATION:
Based on ${difficulty} level, generate:
${difficulty === "beginner" ? 
  `- 3-5 core modules (simpler topic breakdown)
  - 2-4 sub-modules per core module
  - Time per module: 8-25 hours
  - Focus on foundational concepts with clear progression` : 
  difficulty === "intermediate" ? 
  `- 4-7 core modules (balanced complexity)
  - 3-6 sub-modules per core module  
  - Time per module: 15-40 hours
  - Balance theory with practical application` :
  `- 5-8 core modules (comprehensive coverage)
  - 4-8 sub-modules per core module
  - Time per module: 25-60 hours
  - Deep theoretical understanding with advanced applications`}

STEEPNESS CALCULATION:
For each core module, calculate steepness as: totalImpact / totalTimeToLearn
- This represents impact gained per hour of learning
- Range: 0.1 to 5.0
- Higher steepness = more impact per time invested
- Consider learning efficiency, not difficulty

STEEPNESS PATTERNS:
- Foundation modules: Often high steepness (1.5-3.0) - big impact from basics
- Skill-building modules: Moderate steepness (1.0-2.0) - steady progression  
- Application modules: Variable steepness (0.8-2.5) - depends on complexity
- Mastery modules: Often lower steepness (0.5-1.5) - diminishing returns

CORE MODULE REQUIREMENTS:
Each core module must include:
- Accurate totalTimeToLearn (sum of all sub-module times)
- Accurate totalImpact (sum of all sub-module impacts)
- Correct cumulativeTime (running total including this module)
- Correct cumulativeImpact (running total including this module)
- Proper order (1, 2, 3, etc.)
- Calculated steepness (totalImpact / totalTimeToLearn)

SUB-MODULE REQUIREMENTS:
- timeToLearn: Realistic hours based on complexity
- impact: Score 1-10 indicating importance for topic mastery
- learningOutcomes: 2-4 specific, actionable outcomes
- No prerequisites or difficulty fields needed

CUMULATIVE CALCULATIONS:
Ensure accurate progression:
1. Calculate each sub-module's time and impact
2. Sum to get core module totals
3. Calculate cumulative values across all modules
4. Verify steepness = totalImpact / totalTimeToLearn for each module

ID NAMING CONVENTION:
- Core modules: "${topic.toLowerCase().replace(/\s+/g, '-')}-module-{number}"
- Sub-modules: "${topic.toLowerCase().replace(/\s+/g, '-')}-sub-{number}"

OUTPUT OPTIMIZATION:
Generate only the fields needed for time vs. impact curve visualization:
- Remove any category, phase, or business-related fields
- Focus on time, impact, steepness, and cumulative values
- Ensure data supports smooth curve generation

The result should provide all necessary data for creating a dynamic learning curve where steepness drives the visual shape of the time vs. impact progression.`,
    });

    return object;
  } catch (error) {
    console.error("Error in generateLearningCurve:", error);
    throw new Error(`Failed to generate learning curve: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

