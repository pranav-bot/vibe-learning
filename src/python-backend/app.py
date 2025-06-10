from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import shutil
from pathlib import Path
from typing import Dict, Any, Optional
import logging
from urllib.parse import urlparse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Vibe Learning Content API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

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
    Receive PDF file upload (no processing done here)
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
        import uuid
        file_id = str(uuid.uuid4())
        file_path = UPLOAD_DIR / f"{file_id}_{file.filename}"
        
        # Save file without processing
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create response without text extraction
        file_info = {
            "content_id": file_id,
            "content_type": "pdf-file", 
            "title": file.filename,
            "file_size": file_size,
            "text_length": 0,
            "text_preview": "PDF received but not processed",
            "status": "received"
        }
        
        logger.info(f"Received PDF: {file.filename} (ID: {file_id})")
        
        return {
            "success": True,
            "message": "PDF received successfully",
            "data": file_info
        }
        
    except Exception as e:
        logger.error(f"Error receiving PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error receiving PDF: {str(e)}")

@app.get("/content/{content_id}")
async def get_content_info(content_id: str):
    """
    Get information about uploaded content
    """
    # This is a placeholder - in a real app, you'd store content metadata in a database
    return {"message": f"Content info for {content_id} - implement database storage"}

@app.delete("/content/{content_id}")
async def delete_content(content_id: str):
    """
    Delete uploaded content
    """
    try:
        # Find and delete files
        deleted_files = 0
        for file_path in UPLOAD_DIR.glob(f"{content_id}_*"):
            file_path.unlink()
            deleted_files += 1
        
        if deleted_files == 0:
            raise HTTPException(status_code=404, detail="Content not found")
            
        return {"success": True, "message": "Content deleted successfully"}
    
    except Exception as e:
        logger.error(f"Error deleting content: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting content: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)