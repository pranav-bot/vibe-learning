# Vibe Learning Backend

## Setup Instructions

### 1. Install Dependencies

Navigate to the python-backend directory and run:

```bash
cd src/python-backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Start the Server

You can start the server in two ways:

#### Option A: Using the provided script
```bash
./start-server.sh
```

#### Option B: Manual start
```bash
python app.py
```

The server will start on `http://localhost:8000`

### 3. API Documentation

Once the server is running, you can view the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Supported Content Types

### 1. PDF Files
- Upload PDF files directly (up to 50MB)
- Files are stored but not processed

### 2. PDF Links
- Receive PDFs from direct URLs
- URLs are validated but not downloaded

### 3. YouTube Videos
- Receive YouTube video URLs
- URLs are validated but transcripts are not extracted

### 4. Websites
- Receive website URLs
- URLs are validated but content is not scraped

## API Endpoints

### Upload PDF File
```
POST /upload-pdf
Content-Type: multipart/form-data
Body: file (PDF file)
```

### Receive Content from URL
```
POST /upload-content
Content-Type: application/x-www-form-urlencoded
Body:
  - url: string (URL to process)
  - content_type: string (pdf-link, youtube, or website)
```

### Get Content Info
```
GET /content/{content_id}
```

### Delete Content
```
DELETE /content/{content_id}
```

## File Storage

Uploaded PDF files are stored in the `uploads/` directory with unique IDs to prevent conflicts.

## Development Notes

- CORS is configured to allow requests from `http://localhost:3000` (Next.js dev server)
- All uploads are logged for debugging
- File size limit: 50MB for direct uploads
- No content processing is performed - this is a receive-only API
- URLs are validated for format but content is not fetched or processed
