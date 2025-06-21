from youtube_transcript_api import YouTubeTranscriptApi
import re

YOUTUBE_REGEX = re.compile(
    r"(?:youtu\.be/|youtube\.com/(?:watch\?v=|embed/|v/))"
    r"(?P<id>[0-9A-Za-z_-]{11})"
)

def extract_youtube_transcript(url: str) -> str | None:
    """
    Uses regex to extract the 11-character YouTube video ID.
    """
    m = YOUTUBE_REGEX.search(url)
    v_id = m.group("id") if m else None

    if v_id:
        ytt_api = YouTubeTranscriptApi()
        fetched_transcript = ytt_api.fetch(v_id)

        final_transcript = ""

        if fetched_transcript:
            # is iterable
            for snippet in fetched_transcript:
                final_transcript += " " + snippet.text
    return final_transcript
