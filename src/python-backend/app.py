from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os
import shutil
import json
from pathlib import Path
from typing import Dict, Any
import logging
from urllib.parse import urlparse
import uuid

# Import our PDF parser
from pdf_parser import process_pdf_file
from youtube_transcript import extract_youtube_transcript

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Vibe Learning Content API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000",  "https://vibe-learning-theta.vercel.app"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories
UPLOAD_DIR = Path("uploads")
DATA_DIR = Path("data")
IMAGES_DIR = DATA_DIR / "images"

UPLOAD_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)
IMAGES_DIR.mkdir(exist_ok=True)

# Mount static files for serving uploads and images
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")



@app.get("/")
async def root():
    return {"message": "Vibe Learning Content API is running!"}

@app.post("/upload-content")
async def upload_content(
    url: str = Form(...),
    content_type: str = Form(...)
) -> Dict[str, Any]:
    """
    Receive content URLs for processing (no processing done here)
    """
    try:
        # Validate content type
        if content_type not in ['pdf-link', 'youtube', 'website']:
            raise HTTPException(status_code=400, detail="Invalid content type")
        
        # Validate URL
        try:
            parsed_url = urlparse(url)
            if not parsed_url.scheme or not parsed_url.netloc:
                raise HTTPException(status_code=400, detail="Invalid URL format")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid URL format")
        
        # Generate unique content ID
        import uuid
        content_id = str(uuid.uuid4())
        
        # Create mock response without processing
        content_data = {
            "content_id": content_id,
            "content_type": content_type,
            "title": f"{content_type.title()} Content",
            "url": url,
            "text_length": 0,
            "text_preview": "Content received but not processed",
            "status": "received"
        }
        
        logger.info(f"Received {content_type}: {url} (ID: {content_id})")
        
        return {
            "success": True,
            "message": f"{content_type.title()} received successfully",
            "data": content_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error receiving {content_type}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error receiving content: {str(e)}")

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Receive PDF file upload and process it to extract text and images page-wise
    """
    try:
        # Validate file type
        if not file.filename or not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Validate file size (50MB limit)
        file_size = 0
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning
        
        if file_size > 50 * 1024 * 1024:  # 50MB in bytes
            raise HTTPException(status_code=400, detail="File size exceeds 50MB limit")
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        file_path = UPLOAD_DIR / f"{file_id}_{file.filename}"
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"Saved PDF file: {file_path}")
        
        # Process the PDF file
        try:
            processed_data = process_pdf_file(file_path, file_id, image_dir=IMAGES_DIR, data_dir=DATA_DIR)
            
            # Create summary response
            file_info = {
                "content_id": file_id,
                "content_type": "pdf-file", 
                "title": file.filename,
                "file_size": file_size,
                "total_pages": processed_data["total_pages"],
                "total_text_length": sum(page["text_length"] for page in processed_data["pages"]),
                "total_images": sum(page["image_count"] for page in processed_data["pages"]),
                "text_preview": (processed_data["pages"][0]["text"][:200] + "..." 
                               if processed_data["pages"] and len(processed_data["pages"][0]["text"]) > 200
                               else processed_data["pages"][0]["text"] if processed_data["pages"] else ""),
                "status": "processed",
                "processed_at": processed_data["processed_at"],
                "data_file": f"data/{file_id}.json"
            }
            
            logger.info(f"Successfully processed PDF: {file.filename} (ID: {file_id}) - "
                       f"{processed_data['total_pages']} pages, "
                       f"{sum(page['text_length'] for page in processed_data['pages'])} chars, "
                       f"{sum(page['image_count'] for page in processed_data['pages'])} images")
            
            return {
                "success": True,
                "message": "PDF uploaded and processed successfully",
                "data": file_info
            }
            
        except ValueError as char_limit_error:
            # Handle character limit exceeded error specifically
            logger.warning(f"Character limit exceeded for PDF: {file.filename} - {str(char_limit_error)}")
            
            # Clean up all files related to this content ID
            cleanup_items = []
            
            # Clean up the uploaded PDF file
            try:
                if file_path.exists():
                    file_path.unlink()
                    cleanup_items.append(f"PDF file: {file_path.name}")
            except Exception as cleanup_error:
                logger.error(f"Failed to clean up PDF file {file_path}: {str(cleanup_error)}")
            
            # Clean up JSON data file if it exists
            try:
                json_file_path = DATA_DIR / f"{file_id}.json"
                if json_file_path.exists():
                    json_file_path.unlink()
                    cleanup_items.append(f"Data file: {json_file_path.name}")
            except Exception as cleanup_error:
                logger.error(f"Failed to clean up JSON file: {str(cleanup_error)}")
            
            # Clean up extracted images directory if it exists
            try:
                image_dir_path = IMAGES_DIR / file_id
                if image_dir_path.exists():
                    shutil.rmtree(image_dir_path)
                    cleanup_items.append(f"Images directory: {image_dir_path.name}")
            except Exception as cleanup_error:
                logger.error(f"Failed to clean up images directory: {str(cleanup_error)}")
            
            if cleanup_items:
                logger.info(f"Cleaned up files due to character limit: {cleanup_items}")
            
            # Return a user-friendly error message
            raise HTTPException(
                status_code=400, 
                detail=f"Document too large: {str(char_limit_error)}"
            )
            
        except Exception as processing_error:
            logger.error(f"Error processing PDF: {str(processing_error)}")
            # Return basic info even if processing failed
            file_info = {
                "content_id": file_id,
                "content_type": "pdf-file", 
                "title": file.filename,
                "file_size": file_size,
                "text_length": 0,
                "text_preview": f"Processing failed: {str(processing_error)}",
                "status": "processing_failed",
                "error": str(processing_error)
            }
            
            return {
                "success": False,
                "message": f"PDF uploaded but processing failed: {str(processing_error)}",
                "data": file_info
            }
        
    except Exception as e:
        logger.error(f"Error uploading PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading PDF: {str(e)}")

@app.post("/youtube-transcript")
async def get_youtube_transcript(
    url: str = Form(...),
) -> Dict[str, Any]:
    """
    Extract transcript from a YouTube video URL
    """
    try:
        # Validate URL format
        if not url or not isinstance(url, str):
            raise HTTPException(status_code=400, detail="URL is required")
        
        # Check if it's a valid YouTube URL pattern
        if "youtube.com" not in url and "youtu.be" not in url:
            raise HTTPException(status_code=400, detail="Invalid YouTube URL")
        
        logger.info(f"Extracting transcript for YouTube URL: {url}")
        
        # Extract transcript using the existing function
        transcript_text = extract_youtube_transcript(url)
        
        if not transcript_text:
            raise HTTPException(
                status_code=404, 
                detail="No transcript available for this video. The video may not have captions or transcripts enabled."
            )
        
        # Clean up the transcript (remove extra whitespace)
        transcript_text = " ".join(transcript_text.split())
        
        # Generate unique content ID
        content_id = str(uuid.uuid4())
        
        # Create content data structure similar to PDF processing
        content_data = {
            "content_id": content_id,
            "content_type": "youtube",
            "title": f"YouTube Video Transcript",
            "url": url,
            "text_length": len(transcript_text),
            "text_preview": (transcript_text[:200] + "..." 
                           if len(transcript_text) > 200 
                           else transcript_text),
            "status": "processed",
            "transcript": transcript_text,
            "processed_at": __import__('datetime').datetime.now().isoformat()
        }
        
        # Save transcript data to JSON file
        json_file_path = DATA_DIR / f"{content_id}.json"
        with open(json_file_path, 'w', encoding='utf-8') as f:
            json.dump(content_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Successfully extracted YouTube transcript: {url} (ID: {content_id}) - "
                   f"{len(transcript_text)} characters")
        
        return {
            "success": True,
            "message": "YouTube transcript extracted successfully",
            "data": {
                "content_id": content_id,
                "content_type": "youtube",
                "title": content_data["title"],
                "url": url,
                "text_length": len(transcript_text),
                "text_preview": content_data["text_preview"],
                "status": "processed",
                "data_file": f"data/{content_id}.json"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error extracting YouTube transcript: {str(e)}")
        
        # Check for specific transcript API errors
        if "No transcripts were found" in str(e):
            raise HTTPException(
                status_code=404, 
                detail="No transcript available for this video. The video may not have captions enabled."
            )
        elif "Video unavailable" in str(e) or "does not exist" in str(e):
            raise HTTPException(
                status_code=404, 
                detail="Video not found or unavailable. Please check the URL."
            )
        elif "TranscriptsDisabled" in str(e):
            raise HTTPException(
                status_code=404, 
                detail="Transcripts are disabled for this video."
            )
        else:
            raise HTTPException(
                status_code=500, 
                detail=f"Error extracting transcript: {str(e)}"
            )

@app.get("/content/{content_id}")
async def get_content_info(content_id: str):
    """
    Get information about uploaded content
    """
    try:
        # Check if JSON data file exists
        json_file_path = DATA_DIR / f"{content_id}.json"
        if not json_file_path.exists():
            raise HTTPException(status_code=404, detail="Content not found")
        
        # Load and return the processed data
        with open(json_file_path, 'r', encoding='utf-8') as f:
            content_data = json.load(f)
        
        return {
            "success": True,
            "data": content_data
        }
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Content not found")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid data file format")
    except Exception as e:
        logger.error(f"Error retrieving content {content_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving content: {str(e)}")

@app.get("/content/{content_id}/page/{page_number}")
async def get_page_content(content_id: str, page_number: int):
    """
    Get content for a specific page
    """
    try:
        # Load the processed data
        json_file_path = DATA_DIR / f"{content_id}.json"
        if not json_file_path.exists():
            raise HTTPException(status_code=404, detail="Content not found")
        
        with open(json_file_path, 'r', encoding='utf-8') as f:
            content_data = json.load(f)
        
        # Find the requested page
        page_data = None
        for page in content_data.get("pages", []):
            if page.get("page_number") == page_number:
                page_data = page
                break
        
        if not page_data:
            raise HTTPException(status_code=404, detail=f"Page {page_number} not found")
        
        return {
            "success": True,
            "data": page_data
        }
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Content not found")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid data file format")
    except Exception as e:
        logger.error(f"Error retrieving page {page_number} from content {content_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving page content: {str(e)}")

@app.get("/content/{content_id}/summary")
async def get_content_summary(content_id: str):
    """
    Get summary information about the content
    """
    try:
        # Load the processed data
        json_file_path = DATA_DIR / f"{content_id}.json"
        if not json_file_path.exists():
            raise HTTPException(status_code=404, detail="Content not found")
        
        with open(json_file_path, 'r', encoding='utf-8') as f:
            content_data = json.load(f)
        
        # Create summary
        summary = {
            "content_id": content_data.get("content_id"),
            "total_pages": content_data.get("total_pages", 0),
            "processed_at": content_data.get("processed_at"),
            "pdf_info": content_data.get("pdf_info", {}),
            "total_text_length": sum(page.get("text_length", 0) for page in content_data.get("pages", [])),
            "total_images": sum(page.get("image_count", 0) for page in content_data.get("pages", [])),
            "pages_summary": [
                {
                    "page_number": page.get("page_number"),
                    "text_length": page.get("text_length", 0),
                    "image_count": page.get("image_count", 0),
                    "text_preview": (page.get("text", "")[:100] + "..." 
                                   if len(page.get("text", "")) > 100 
                                   else page.get("text", ""))
                }
                for page in content_data.get("pages", [])
            ]
        }
        
        return {
            "success": True,
            "data": summary
        }
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Content not found")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid data file format")
    except Exception as e:
        logger.error(f"Error retrieving summary for content {content_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving content summary: {str(e)}")

@app.get("/pdf/{content_id}")
@app.head("/pdf/{content_id}")
async def get_pdf_file(content_id: str):
    """
    Serve PDF file by content ID
    """
    try:
        logger.info(f"Looking for PDF with content_id: {content_id}")
        
        # Find the PDF file with this content ID
        pdf_files = list(UPLOAD_DIR.glob(f"{content_id}_*.pdf"))
        logger.info(f"Found PDF files: {[str(f) for f in pdf_files]}")
        
        if not pdf_files:
            # List all files in upload directory for debugging
            all_files = list(UPLOAD_DIR.glob("*.pdf"))
            logger.info(f"All PDF files in upload dir: {[str(f) for f in all_files]}")
            raise HTTPException(status_code=404, detail="PDF file not found")
        
        pdf_file = pdf_files[0]
        logger.info(f"Serving PDF file: {pdf_file}")
        
        return FileResponse(
            path=pdf_file,
            media_type='application/pdf',
            filename=pdf_file.name.split('_', 1)[1]  # Remove UUID prefix
        )
    except Exception as e:
        logger.error(f"Error serving PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error serving PDF: {str(e)}")

@app.delete("/content/{content_id}")
async def delete_content(content_id: str):
    """
    Delete uploaded content including PDF files, JSON data, and extracted images
    """
    try:
        deleted_items = []
        
        # Delete PDF files
        for file_path in UPLOAD_DIR.glob(f"{content_id}_*"):
            file_path.unlink()
            deleted_items.append(f"PDF file: {file_path.name}")
        
        # Delete JSON data file
        json_file_path = DATA_DIR / f"{content_id}.json"
        if json_file_path.exists():
            json_file_path.unlink()
            deleted_items.append(f"Data file: {json_file_path.name}")
        
        # Delete image directory
        image_dir_path = IMAGES_DIR / content_id
        if image_dir_path.exists():
            shutil.rmtree(image_dir_path)
            deleted_items.append(f"Images directory: {image_dir_path.name}")
        
        if not deleted_items:
            raise HTTPException(status_code=404, detail="Content not found")
        
        logger.info(f"Deleted content {content_id}: {deleted_items}")
        
        return {
            "success": True, 
            "message": "Content deleted successfully",
            "deleted_items": deleted_items
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting content: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting content: {str(e)}")

@app.get("/content/{content_id}/topic-extractor-format")
async def topic_extractor_content(content_id: str):
    """
    Get content formatted for the TypeScript topic extractor
    """
    try:
        # Load the processed data
        json_file_path = DATA_DIR / f"{content_id}.json"
        if not json_file_path.exists():
            raise HTTPException(status_code=404, detail="Content not found")
        
        with open(json_file_path, 'r', encoding='utf-8') as f:
            content_data = json.load(f)
        
        # Format data for topic extractor
        formatted_content = {
            "total_pages": content_data.get("total_pages", 0),
            "pages": [
                {
                    "page_number": page.get("page_number"),
                    "content": page.get("text", "")
                }
                for page in content_data.get("pages", [])
            ]
        }
        
        return {
            "success": True,
            "data": formatted_content
        }
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Content not found")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid data file format")
    except Exception as e:
        logger.error(f"Error formatting content for topic extractor {content_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error formatting content: {str(e)}")

@app.get("/content/{content_id}/transcript")
async def get_transcript_text(content_id: str):
    """
    Get the full transcript text for YouTube content
    """
    try:
        # Load the processed data
        json_file_path = DATA_DIR / f"{content_id}.json"
        if not json_file_path.exists():
            raise HTTPException(status_code=404, detail="Content not found")
        
        with open(json_file_path, 'r', encoding='utf-8') as f:
            content_data = json.load(f)
        
        # Check if it's YouTube content
        if content_data.get("content_type") != "youtube":
            raise HTTPException(status_code=400, detail="Content is not a YouTube video")
        
        transcript = content_data.get("transcript")
        if not transcript:
            raise HTTPException(status_code=404, detail="No transcript available for this content")
        
        return {
            "success": True,
            "data": {
                "content_id": content_id,
                "url": content_data.get("url"),
                "title": content_data.get("title"),
                "transcript": transcript,
                "text_length": len(transcript),
                "processed_at": content_data.get("processed_at")
            }
        }
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Content not found")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid data file format")
    except Exception as e:
        logger.error(f"Error retrieving transcript for content {content_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving transcript: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)