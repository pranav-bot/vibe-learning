// Define the topic type for a single topic
export type TopicData = {
  topic_name: string;
  topic_page_start: number;
  topic_page_end: number;
  topic_summary: string;
};

// Function to fetch page content from FastAPI backend
export async function fetchPageContent(contentId: string, pageNumber: number): Promise<string> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/content/${contentId}/page/${pageNumber}`);
    if (!response.ok) {
      console.warn(`Failed to fetch page ${pageNumber} for content ${contentId}: ${response.status}`);
      return '';
    }
    const data = await response.json() as { success: boolean; data?: { text?: string } };
    return data.data?.text ?? '';
  } catch (error) {
    console.warn(`Error fetching page ${pageNumber} for content ${contentId}:`, error);
    return '';
  }
}

// Function to fetch content for a page range
export async function fetchTopicContent(contentId: string, startPage: number, endPage: number): Promise<string> {
  const pagePromises = [];
  
  for (let page = startPage; page <= endPage; page++) {
    pagePromises.push(fetchPageContent(contentId, page));
  }
  
  const pageContents = await Promise.all(pagePromises);
  return pageContents
    .filter(content => content.trim().length > 0) // Filter out empty pages
    .map((content, index) => `[Page ${startPage + index}]\n${content}`)
    .join('\n\n');
}