import { generateObject, type LanguageModelV1 } from "ai";
import z from "zod";

/**
 * YouTube Resources Module
 * 
 * This module provides functionality to search YouTube for educational videos
 * and uses AI to select the most relevant videos for a given topic.
 * 
 * Features:
 * - Searches YouTube using the YouTube Data API v3
 * - Uses AI to analyze and rank videos by relevance
 * - Returns top 5 videos with detailed information
 * - Considers difficulty level and topic summary for better matching
 * 
 * Prerequisites:
 * - YOUTUBE_SEARCH_API_KEY environment variable must be set
 * - A language model instance for AI analysis
 * 
 * @see https://developers.google.com/youtube/v3/docs/search/list
 */

// YouTube API types
interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
  };
}

interface YouTubeSearchResponse {
  items: YouTubeSearchItem[];
}

// Schema for the AI agent response
const youtubeResourceSchema = z.object({
  selectedVideos: z.array(z.object({
    videoId: z.string(),
    title: z.string(),
    description: z.string(),
    channelTitle: z.string(),
    publishedAt: z.string(),
    thumbnailUrl: z.string(),
    relevanceScore: z.number().min(1).max(10),
    relevanceReason: z.string(),
    url: z.string()
  })),
  summary: z.string()
});

/**
 * Search YouTube for videos related to a topic
 */
const searchYouTubeVideos = async (topic: string, maxResults = 20): Promise<YouTubeSearchItem[]> => {
  const apiKey = process.env.YOUTUBE_SEARCH_API_KEY;
  
  if (!apiKey) {
    throw new Error("YouTube API key not found in environment variables");
  }

  const searchQuery = encodeURIComponent(topic);
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${searchQuery}&maxResults=${maxResults}&key=${apiKey}&order=relevance&videoDuration=medium&videoDefinition=high`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as YouTubeSearchResponse;
    return data.items || [];
  } catch (error) {
    console.error("Error searching YouTube videos:", error);
    throw new Error("Failed to search YouTube videos");
  }
};

/**
 * Use AI to select the top 5 most relevant videos from YouTube search results
 */
const selectRelevantVideos = async (
  videos: YouTubeSearchItem[],
  topic: string,
  difficulty: string,
  topicSummary: string,
  model: LanguageModelV1
) => {
  const videoDescriptions = videos.map((video, index) => ({
    index,
    videoId: video.id.videoId,
    title: video.snippet.title,
    description: video.snippet.description,
    channelTitle: video.snippet.channelTitle,
    publishedAt: video.snippet.publishedAt,
    thumbnailUrl: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default.url
  }));

  const prompt = `
You are an educational content curator. Your task is to select the top 5 most relevant YouTube videos for learning about a specific topic.

Topic: "${topic}"
Difficulty Level: ${difficulty}
Topic Summary: ${topicSummary}

Here are the YouTube videos found (${videos.length} total):
${videoDescriptions.map((video, i) => `
${i + 1}. Title: ${video.title}
   Channel: ${video.channelTitle}
   Description: ${video.description.substring(0, 200)}...
   Video ID: ${video.videoId}
   Published: ${video.publishedAt}
`).join('\n')}

Please select the top 5 videos that are most relevant for learning about "${topic}" at the ${difficulty} level.

Consider the following criteria:
1. Relevance to the topic and topic summary
2. Appropriate difficulty level
3. Educational value (prefer tutorial/educational content over entertainment)
4. Channel credibility (prefer educational channels, universities, or well-known instructors)
5. Content quality indicators (clear titles, detailed descriptions)
6. Recency (prefer more recent content when quality is similar)

For each selected video, provide:
- A relevance score from 1-10
- A brief explanation of why it's relevant
- The complete video information

Provide a summary explaining your selection criteria and how these videos complement each other for learning about the topic.
`;

  const response = await generateObject({
    model,
    prompt,
    schema: youtubeResourceSchema
  });

  return response.object;
};

/**
 * Main function to get YouTube resources for a topic
 */
const youtubeResources = async (topic: string, difficulty: string, topicSummary: string, model: LanguageModelV1) => {
  try {
    // Step 1: Search YouTube for videos
    console.log(`Searching YouTube for videos about: ${topic}`);
    const searchResults = await searchYouTubeVideos(topic, 20);
    
    if (searchResults.length === 0) {
      throw new Error("No YouTube videos found for the given topic");
    }

    console.log(`Found ${searchResults.length} videos, selecting top 5 most relevant...`);
    
    // Step 2: Use AI to select the most relevant videos
    const selectedVideos = await selectRelevantVideos(
      searchResults,
      topic,
      difficulty,
      topicSummary,
      model
    );

    // Step 3: Add YouTube URLs to the selected videos
    const videosWithUrls = selectedVideos.selectedVideos.map(video => ({
      ...video,
      url: `https://www.youtube.com/watch?v=${video.videoId}`
    }));

    return {
      ...selectedVideos,
      selectedVideos: videosWithUrls,
      totalSearchResults: searchResults.length
    };

  } catch (error) {
    console.error("Error getting YouTube resources:", error);
    throw error;
  }
};

export { youtubeResources };

// Usage example:
/*
import { google } from "@ai-sdk/google";
import { youtubeResources } from "./resources";

const model = google("gemini-1.5-flash");

const result = await youtubeResources(
  "React hooks tutorial",
  "beginner", 
  "Introduction to React hooks for state management",
  model
);

console.log(result.selectedVideos); // Top 5 relevant videos
console.log(result.summary); // AI-generated summary of selection
*/