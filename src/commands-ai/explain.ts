import { generateText, type LanguageModelV1 } from "ai";
import { z } from "zod";

const explain = async (user_prompt: string, model: LanguageModelV1, topic?: string) => {
    const response = await generateText({
        model: model,
        prompt: `Explain the following content in detail, focusing on the main themes, concepts, and any important details. Provide a comprehensive overview that captures the essence of the content.\n\nContent:\n${topic? `Topic: ${topic}\n\n` : ''}${user_prompt}`,
    });
};

export default explain;