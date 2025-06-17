import { createGoogleGenerativeAI } from '@ai-sdk/google'

interface LLMs {
    gemini: ReturnType<typeof createGoogleGenerativeAI>;
}

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not defined in environment variables");
}

const gemini = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const llms: LLMs = {
    gemini,
};

export default llms;
