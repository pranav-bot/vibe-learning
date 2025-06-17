import { generateObject, type LanguageModelV1 } from "ai";
import z from "zod";
import type { TopicData } from "./utils";

// Response type that's compatible with MermaidDiagram component
export interface VisualizationResponse {
  mermaidCode: string;
  diagram_type: string;
  explanation: string;
  key_insights: string;
  educational_value: string;
}

const visualize = async (user_query: string, difficulty: string, model: LanguageModelV1, topic: TopicData): Promise<{ object: VisualizationResponse }> => {
  console.log(`🤖 Visualize: Processing user query for Mermaid diagram generation...`);

  // Prepare the prompt for Mermaid-based visualization
  const prompt = `Create a Mermaid diagram to visualize the following concept or query:
  
  ${user_query}
  
  Topic Context: ${topic.topic_name} (${topic.topic_summary})
  Difficulty Level: ${difficulty}

  Generate a comprehensive Mermaid diagram that best represents this concept. Choose the most appropriate Mermaid diagram type:
  
  - Flowchart: For processes, algorithms, decision trees, or step-by-step procedures
  - Graph: For relationships, connections, networks, or hierarchies  
  - Sequence Diagram: For interactions, communications, or time-based processes
  - Class Diagram: For object-oriented concepts, data structures, or system architecture
  - State Diagram: For state machines, lifecycle processes, or system states
  - Gantt Chart: For project timelines, schedules, or temporal relationships
  - Pie Chart: For proportions, distributions, or categorical data
  - Mindmap: For concepts, ideas, or knowledge structures
  - Timeline: For historical events, chronological processes, or development stages

  Provide:
  1. The complete Mermaid diagram code (properly formatted and syntactically correct)
  2. A brief explanation of why this diagram type was chosen
  3. Key insights that the visualization reveals about the concept
  4. How this visualization aids in understanding the topic at the ${difficulty} level

  Make the diagram comprehensive, educational, and visually clear. Include relevant labels, colors, and styling where appropriate.`;

  console.log(`🧠 Sending to AI model for Mermaid visualization generation...`);

  const response = await generateObject({
    model: model,
    prompt: prompt,
    schema: z.object({
      mermaidCode: z.string().describe("Complete Mermaid diagram code"),
      diagram_type: z.string().describe("Type of Mermaid diagram used (e.g., flowchart, graph, sequence, etc.)"),
      explanation: z.string().describe("Explanation of why this diagram type was chosen"),
      key_insights: z.string().describe("Key insights revealed by the visualization"),
      educational_value: z.string().describe("How this visualization aids understanding at the specified difficulty level")
    }),
  });

  console.log(`🎉 Mermaid visualization generated successfully!`);
  return response;
}

// Helper function to convert visualization response to MermaidDiagram props
export const createDiagramProps = (
  visualization: VisualizationResponse,
  customTitle?: string,
  customDescription?: string
) => {
  return {
    mermaidCode: visualization.mermaidCode,
    title: customTitle ?? `${visualization.diagram_type} Diagram`,
    description: customDescription ?? visualization.explanation,
    className: ""
  };
};

export default visualize;