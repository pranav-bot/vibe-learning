"""
PDF Text Extraction Module

This module provides comprehensive functions for extracting text from PDF files
using pypdf library with various extraction modes and options.
"""

from pypdf import PdfReader
from typing import List, Dict, Union, Optional, Tuple
import os
import base64
from io import BytesIO
from PIL import Image
import os
import json
from pathlib import Path
from typing import Dict, Any, Optional
import logging
from datetime import datetime
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)



class PDFTextExtractor:
    """
    A class for extracting text from PDF files with various options and modes.
    """
    
    def __init__(self, pdf_path: str):
        """
        Initialize the PDF text extractor.
        
        Args:
            pdf_path (str): Path to the PDF file
            
        Raises:
            FileNotFoundError: If the PDF file doesn't exist
            Exception: If the PDF file cannot be read
        """
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        
        try:
            self.reader = PdfReader(pdf_path)
            self.pdf_path = pdf_path
            self.num_pages = len(self.reader.pages)
        except Exception as e:
            raise Exception(f"Error reading PDF file: {str(e)}")
    
    def extract_text_from_page(self, page_number: int, 
                              orientations: Optional[Union[int, Tuple[int, ...]]] = None,
                              extraction_mode: str = "plain",
                              layout_mode_space_vertically: bool = True,
                              layout_mode_scale_weight: float = 1.0,
                              layout_mode_strip_rotated: bool = True) -> str:
        """
        Extract text from a specific page with various options.
        
        Args:
            page_number (int): Page number (0-indexed)
            orientations (int or tuple, optional): Text orientations to extract
                - None: Extract all text
                - 0: Extract only text oriented up
                - (0, 90): Extract text oriented up and turned left
            extraction_mode (str): Extraction mode ('plain' or 'layout')
            layout_mode_space_vertically (bool): Preserve vertical spacing (layout mode only)
            layout_mode_scale_weight (float): Horizontal spacing adjustment (layout mode only)
            layout_mode_strip_rotated (bool): Exclude rotated text (layout mode only)
            
        Returns:
            str: Extracted text from the page
            
        Raises:
            IndexError: If page number is out of range
        """
        if page_number < 0 or page_number >= self.num_pages:
            raise IndexError(f"Page number {page_number} out of range (0-{self.num_pages-1})")
        
        page = self.reader.pages[page_number]
        
        if extraction_mode == "plain":
            if orientations is None:
                return page.extract_text()
            else:
                return page.extract_text(orientations)
        elif extraction_mode == "layout":
            return page.extract_text(
                extraction_mode="layout",
                layout_mode_space_vertically=layout_mode_space_vertically,
                layout_mode_scale_weight=layout_mode_scale_weight,
                layout_mode_strip_rotated=layout_mode_strip_rotated
            )
        else:
            raise ValueError("extraction_mode must be 'plain' or 'layout'")
    
    def extract_text_all_pages(self, 
                              orientations: Optional[Union[int, Tuple[int, ...]]] = None,
                              extraction_mode: str = "plain",
                              layout_mode_space_vertically: bool = True,
                              layout_mode_scale_weight: float = 1.0,
                              layout_mode_strip_rotated: bool = True) -> List[str]:
        """
        Extract text from all pages in the PDF.
        
        Args:
            orientations (int or tuple, optional): Text orientations to extract
            extraction_mode (str): Extraction mode ('plain' or 'layout')
            layout_mode_space_vertically (bool): Preserve vertical spacing (layout mode only)
            layout_mode_scale_weight (float): Horizontal spacing adjustment (layout mode only)
            layout_mode_strip_rotated (bool): Exclude rotated text (layout mode only)
            
        Returns:
            List[str]: List of extracted text for each page
        """
        all_pages_text = []
        
        for page_num in range(self.num_pages):
            try:
                text = self.extract_text_from_page(
                    page_num,
                    orientations=orientations,
                    extraction_mode=extraction_mode,
                    layout_mode_space_vertically=layout_mode_space_vertically,
                    layout_mode_scale_weight=layout_mode_scale_weight,
                    layout_mode_strip_rotated=layout_mode_strip_rotated
                )
                all_pages_text.append(text)
            except Exception as e:
                print(f"Error extracting text from page {page_num}: {str(e)}")
                all_pages_text.append("")
        
        return all_pages_text
    
    def extract_text_page_range(self, start_page: int, end_page: int,
                               orientations: Optional[Union[int, Tuple[int, ...]]] = None,
                               extraction_mode: str = "plain",
                               layout_mode_space_vertically: bool = True,
                               layout_mode_scale_weight: float = 1.0,
                               layout_mode_strip_rotated: bool = True) -> List[str]:
        """
        Extract text from a range of pages.
        
        Args:
            start_page (int): Starting page number (0-indexed, inclusive)
            end_page (int): Ending page number (0-indexed, exclusive)
            orientations (int or tuple, optional): Text orientations to extract
            extraction_mode (str): Extraction mode ('plain' or 'layout')
            layout_mode_space_vertically (bool): Preserve vertical spacing (layout mode only)
            layout_mode_scale_weight (float): Horizontal spacing adjustment (layout mode only)
            layout_mode_strip_rotated (bool): Exclude rotated text (layout mode only)
            
        Returns:
            List[str]: List of extracted text for each page in the range
        """
        if start_page < 0 or end_page > self.num_pages or start_page >= end_page:
            raise ValueError(f"Invalid page range: {start_page}-{end_page}")
        
        pages_text = []
        
        for page_num in range(start_page, end_page):
            try:
                text = self.extract_text_from_page(
                    page_num,
                    orientations=orientations,
                    extraction_mode=extraction_mode,
                    layout_mode_space_vertically=layout_mode_space_vertically,
                    layout_mode_scale_weight=layout_mode_scale_weight,
                    layout_mode_strip_rotated=layout_mode_strip_rotated
                )
                pages_text.append(text)
            except Exception as e:
                print(f"Error extracting text from page {page_num}: {str(e)}")
                pages_text.append("")
        
        return pages_text
    
    def get_pdf_info(self) -> Dict[str, Union[str, int]]:
        """
        Get basic information about the PDF.
        
        Returns:
            Dict: PDF information including number of pages, metadata
        """
        info = {
            'file_path': self.pdf_path,
            'num_pages': self.num_pages,
        }
        
        # Add metadata if available
        if self.reader.metadata:
            metadata = self.reader.metadata
            info.update({
                'title': metadata.get('/Title', 'Unknown'),
                'author': metadata.get('/Author', 'Unknown'),
                'subject': metadata.get('/Subject', 'Unknown'),
                'creator': metadata.get('/Creator', 'Unknown'),
                'producer': metadata.get('/Producer', 'Unknown'),
                'creation_date': str(metadata.get('/CreationDate', 'Unknown')),
                'modification_date': str(metadata.get('/ModDate', 'Unknown'))
            })
        
        return info
    
    def extract_images_from_page(self, page_number: int, save_to_disk: bool = False, 
                                output_dir: str = "extracted_images") -> List[Dict[str, Union[str, bytes]]]:
        """
        Extract images from a specific page.
        
        Args:
            page_number (int): Page number (0-indexed)
            save_to_disk (bool): Whether to save images to disk
            output_dir (str): Directory to save images (if save_to_disk is True)
            
        Returns:
            List[Dict]: List of image information dictionaries containing:
                - name: Image filename
                - data: Image bytes
                - base64: Base64 encoded image data
                - format: Image format (if determinable)
                - size: Image size tuple (width, height) if available
        """
        if page_number < 0 or page_number >= self.num_pages:
            raise IndexError(f"Page number {page_number} out of range (0-{self.num_pages-1})")
        
        page = self.reader.pages[page_number]
        images = []
        
        if save_to_disk:
            os.makedirs(output_dir, exist_ok=True)
        
        for count, image_file_object in enumerate(page.images):
            try:
                image_data = image_file_object.data
                image_name = image_file_object.name or f"image_{count}"
                
                # Ensure image name has an extension
                if not any(image_name.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff']):
                    image_name += ".png"  # Default to PNG if no extension
                
                # Convert to base64 for easy transmission/storage
                base64_data = base64.b64encode(image_data).decode('utf-8')
                
                # Try to get image format and size using PIL
                image_format = None
                image_size = None
                try:
                    with BytesIO(image_data) as img_buffer:
                        with Image.open(img_buffer) as pil_image:
                            image_format = pil_image.format
                            image_size = pil_image.size
                except Exception:
                    pass  # If PIL can't read it, continue without format/size info
                
                image_info = {
                    'name': image_name,
                    'data': image_data,
                    'base64': base64_data,
                    'format': image_format,
                    'size': image_size,
                    'page_number': page_number
                }
                
                # Save to disk if requested
                if save_to_disk:
                    file_path = os.path.join(output_dir, f"page_{page_number}_{image_name}")
                    with open(file_path, "wb") as fp:
                        fp.write(image_data)
                    image_info['file_path'] = file_path
                
                images.append(image_info)
                
            except Exception as e:
                print(f"Error extracting image {count} from page {page_number}: {str(e)}")
                continue
        
        return images
    
    def extract_images_all_pages(self, save_to_disk: bool = False, 
                                output_dir: str = "extracted_images") -> Dict[int, List[Dict[str, Union[str, bytes]]]]:
        """
        Extract images from all pages in the PDF.
        
        Args:
            save_to_disk (bool): Whether to save images to disk
            output_dir (str): Directory to save images (if save_to_disk is True)
            
        Returns:
            Dict[int, List[Dict]]: Dictionary mapping page numbers to lists of image info dictionaries
        """
        all_images = {}
        
        for page_num in range(self.num_pages):
            try:
                images = self.extract_images_from_page(page_num, save_to_disk, output_dir)
                if images:  # Only add if images were found
                    all_images[page_num] = images
            except Exception as e:
                print(f"Error extracting images from page {page_num}: {str(e)}")
                continue
        
        return all_images
    
    def extract_content_from_page(self, page_number: int, 
                                 include_images: bool = True,
                                 save_images_to_disk: bool = False,
                                 output_dir: str = "extracted_images",
                                 orientations: Optional[Union[int, Tuple[int, ...]]] = None,
                                 extraction_mode: str = "plain",
                                 layout_mode_space_vertically: bool = True,
                                 layout_mode_scale_weight: float = 1.0,
                                 layout_mode_strip_rotated: bool = True) -> Dict[str, Union[str, List]]:
        """
        Extract both text and images from a specific page.
        
        Args:
            page_number (int): Page number (0-indexed)
            include_images (bool): Whether to extract images
            save_images_to_disk (bool): Whether to save images to disk
            output_dir (str): Directory to save images
            (other args same as extract_text_from_page)
            
        Returns:
            Dict containing:
                - text: Extracted text
                - images: List of image info dictionaries (if include_images=True)
                - page_number: Page number
        """
        result = {
            'page_number': page_number,
            'text': self.extract_text_from_page(
                page_number, orientations, extraction_mode,
                layout_mode_space_vertically, layout_mode_scale_weight,
                layout_mode_strip_rotated
            ),
            'images': []
        }
        
        if include_images:
            result['images'] = self.extract_images_from_page(
                page_number, save_images_to_disk, output_dir
            )
        
        return result
    
    def extract_content_all_pages(self, 
                                 include_images: bool = True,
                                 save_images_to_disk: bool = False,
                                 output_dir: str = "extracted_images",
                                 orientations: Optional[Union[int, Tuple[int, ...]]] = None,
                                 extraction_mode: str = "plain",
                                 layout_mode_space_vertically: bool = True,
                                 layout_mode_scale_weight: float = 1.0,
                                 layout_mode_strip_rotated: bool = True) -> List[Dict[str, Union[str, List]]]:
        """
        Extract both text and images from all pages.
        
        Args:
            include_images (bool): Whether to extract images
            save_images_to_disk (bool): Whether to save images to disk
            output_dir (str): Directory to save images
            (other args same as extract_text_from_page)
            
        Returns:
            List[Dict]: List of page content dictionaries
        """
        all_content = []
        
        for page_num in range(self.num_pages):
            try:
                content = self.extract_content_from_page(
                    page_num, include_images, save_images_to_disk, output_dir,
                    orientations, extraction_mode, layout_mode_space_vertically,
                    layout_mode_scale_weight, layout_mode_strip_rotated
                )
                all_content.append(content)
            except Exception as e:
                print(f"Error extracting content from page {page_num}: {str(e)}")
                # Add empty content for failed pages
                all_content.append({
                    'page_number': page_num,
                    'text': '',
                    'images': []
                })
        
        return all_content


# Standalone functions for quick usage
def extract_text_from_pdf_page(pdf_path: str, page_number: int, 
                              orientations: Optional[Union[int, Tuple[int, ...]]] = None,
                              extraction_mode: str = "plain") -> str:
    """
    Quick function to extract text from a single page.
    
    Args:
        pdf_path (str): Path to the PDF file
        page_number (int): Page number (0-indexed)
        orientations (int or tuple, optional): Text orientations to extract
        extraction_mode (str): Extraction mode ('plain' or 'layout')
        
    Returns:
        str: Extracted text from the page
    """
    extractor = PDFTextExtractor(pdf_path)
    return extractor.extract_text_from_page(page_number, orientations, extraction_mode)


def extract_text_from_all_pages(pdf_path: str, 
                               orientations: Optional[Union[int, Tuple[int, ...]]] = None,
                               extraction_mode: str = "plain") -> List[str]:
    """
    Quick function to extract text from all pages.
    
    Args:
        pdf_path (str): Path to the PDF file
        orientations (int or tuple, optional): Text orientations to extract
        extraction_mode (str): Extraction mode ('plain' or 'layout')
        
    Returns:
        List[str]: List of extracted text for each page
    """
    extractor = PDFTextExtractor(pdf_path)
    return extractor.extract_text_all_pages(orientations, extraction_mode)


def extract_images_from_pdf_page(pdf_path: str, page_number: int, 
                                save_to_disk: bool = False, 
                                output_dir: str = "extracted_images") -> List[Dict[str, Union[str, bytes]]]:
    """
    Quick function to extract images from a single page.
    
    Args:
        pdf_path (str): Path to the PDF file
        page_number (int): Page number (0-indexed)
        save_to_disk (bool): Whether to save images to disk
        output_dir (str): Directory to save images
        
    Returns:
        List[Dict]: List of image info dictionaries
    """
    extractor = PDFTextExtractor(pdf_path)
    return extractor.extract_images_from_page(page_number, save_to_disk, output_dir)


def extract_content_from_pdf_page(pdf_path: str, page_number: int, 
                                 include_images: bool = True,
                                 save_images_to_disk: bool = False,
                                 extraction_mode: str = "plain") -> Dict[str, Union[str, List]]:
    """
    Quick function to extract both text and images from a single page.
    
    Args:
        pdf_path (str): Path to the PDF file
        page_number (int): Page number (0-indexed)
        include_images (bool): Whether to extract images
        save_images_to_disk (bool): Whether to save images to disk
        extraction_mode (str): Extraction mode ('plain' or 'layout')
        
    Returns:
        Dict: Page content dictionary with text and images
    """
    extractor = PDFTextExtractor(pdf_path)
    return extractor.extract_content_from_page(
        page_number, include_images, save_images_to_disk, 
        extraction_mode=extraction_mode
    )


def demonstrate_extraction_modes(pdf_path: str, page_number: int = 0) -> Dict[str, str]:
    """
    Demonstrate different text extraction modes on a specific page.
    
    Args:
        pdf_path (str): Path to the PDF file
        page_number (int): Page number to demonstrate on (0-indexed)
        
    Returns:
        Dict[str, str]: Dictionary with different extraction results
    """
    extractor = PDFTextExtractor(pdf_path)
    
    results = {}
    
    try:
        # Basic text extraction
        results['basic'] = extractor.extract_text_from_page(page_number)
        
        # Extract only text oriented up
        results['oriented_up'] = extractor.extract_text_from_page(page_number, orientations=0)
        
        # Extract text oriented up and turned left
        results['up_and_left'] = extractor.extract_text_from_page(page_number, orientations=(0, 90))
        
        # Layout mode - default settings
        results['layout_default'] = extractor.extract_text_from_page(
            page_number, extraction_mode="layout"
        )
        
        # Layout mode - no vertical spacing
        results['layout_no_vertical_space'] = extractor.extract_text_from_page(
            page_number, 
            extraction_mode="layout",
            layout_mode_space_vertically=False
        )
        
        # Layout mode - adjusted horizontal spacing
        results['layout_adjusted_spacing'] = extractor.extract_text_from_page(
            page_number,
            extraction_mode="layout",
            layout_mode_scale_weight=1.0
        )
        
        # Layout mode - include rotated text
        results['layout_include_rotated'] = extractor.extract_text_from_page(
            page_number,
            extraction_mode="layout",
            layout_mode_strip_rotated=False
        )
        
    except Exception as e:
        results['error'] = f"Error demonstrating extraction modes: {str(e)}"
    
    return results


# Example usage
if __name__ == "__main__":
    # Example usage of the PDF text extraction functions
    pdf_file = "example.pdf"  # Replace with your PDF file path
    
    try:
        # Initialize extractor
        extractor = PDFTextExtractor(pdf_file)
        
        # Get PDF info
        print("PDF Info:")
        info = extractor.get_pdf_info()
        for key, value in info.items():
            print(f"  {key}: {value}")
        print()
        
        # Extract text from first page using different methods
        print("=== Different Extraction Methods for Page 0 ===")
        
        # Basic extraction
        print("1. Basic text extraction:")
        text = extractor.extract_text_from_page(0)
        print(text[:200] + "..." if len(text) > 200 else text)
        print()
        
        # Extract only upward-oriented text
        print("2. Extract only text oriented up:")
        text = extractor.extract_text_from_page(0, orientations=0)
        print(text[:200] + "..." if len(text) > 200 else text)
        print()
        
        # Extract text oriented up and turned left
        print("3. Extract text oriented up and turned left:")
        text = extractor.extract_text_from_page(0, orientations=(0, 90))
        print(text[:200] + "..." if len(text) > 200 else text)
        print()
        
        # Layout mode extraction
        print("4. Layout mode extraction:")
        text = extractor.extract_text_from_page(0, extraction_mode="layout")
        print(text[:200] + "..." if len(text) > 200 else text)
        print()
        
        # Layout mode without vertical spacing
        print("5. Layout mode without excess vertical whitespace:")
        text = extractor.extract_text_from_page(
            0, 
            extraction_mode="layout",
            layout_mode_space_vertically=False
        )
        print(text[:200] + "..." if len(text) > 200 else text)
        print()
        
        # Layout mode with adjusted horizontal spacing
        print("6. Layout mode with adjusted horizontal spacing:")
        text = extractor.extract_text_from_page(
            0,
            extraction_mode="layout",
            layout_mode_scale_weight=1.0
        )
        print(text[:200] + "..." if len(text) > 200 else text)
        print()
        
        # Layout mode including rotated text
        print("7. Layout mode including rotated text:")
        text = extractor.extract_text_from_page(
            0,
            extraction_mode="layout",
            layout_mode_strip_rotated=False
        )
        print(text[:200] + "..." if len(text) > 200 else text)
        print()
        
        # Extract text from all pages
        print("=== Extracting Text from All Pages ===")
        all_pages = extractor.extract_text_all_pages()
        for i, page_text in enumerate(all_pages):
            print(f"Page {i+1} (first 100 chars): {page_text[:100]}...")
        print()
        
        # Extract images from first page
        print("=== Extracting Images from Page 0 ===")
        images = extractor.extract_images_from_page(0, save_to_disk=False)
        if images:
            for i, img_info in enumerate(images):
                print(f"Image {i+1}:")
                print(f"  - Name: {img_info['name']}")
                print(f"  - Format: {img_info['format']}")
                print(f"  - Size: {img_info['size']}")
                print(f"  - Data size: {len(img_info['data'])} bytes")
                print(f"  - Base64 preview: {img_info['base64'][:50]}...")
        else:
            print("No images found on page 0")
        print()
        
        # Extract combined content (text + images) from first page
        print("=== Extracting Combined Content from Page 0 ===")
        content = extractor.extract_content_from_page(0, include_images=True)
        print(f"Page {content['page_number']}:")
        print(f"Text (first 200 chars): {content['text'][:200]}...")
        print(f"Number of images: {len(content['images'])}")
        for i, img in enumerate(content['images']):
            print(f"  Image {i+1}: {img['name']} ({img['format']}, {img['size']})")
        print()
        
        # Extract all content from all pages
        print("=== Extracting All Content from All Pages ===")
        all_content = extractor.extract_content_all_pages(include_images=True)
        for page_content in all_content:
            page_num = page_content['page_number']
            text_preview = page_content['text'][:100] if page_content['text'] else "No text"
            image_count = len(page_content['images'])
            print(f"Page {page_num+1}: {text_preview}... ({image_count} images)")
        
    except FileNotFoundError:
        print(f"PDF file '{pdf_file}' not found. Please provide a valid PDF file path.")
    except Exception as e:
        print(f"Error: {str(e)}")
        
    # Demonstrate standalone functions
    print("\n=== Demonstrating Standalone Functions ===")
    try:
        # Quick image extraction from a page
        images = extract_images_from_pdf_page(pdf_file, 0, save_to_disk=False)
        print(f"Found {len(images)} images on page 0 using standalone function")
        
        # Quick combined content extraction
        content = extract_content_from_pdf_page(pdf_file, 0, include_images=True)
        print(f"Extracted combined content: {len(content['text'])} chars text, {len(content['images'])} images")
        
    except Exception as e:
        print(f"Standalone function demo error: {str(e)}")




def process_pdf_file(file_path: Path, content_id: str, image_dir: Path, data_dir: Path) -> Dict[str, Any]:
    """
    Process PDF file and extract text and images page-wise
    """
    try:
        # Initialize PDF extractor
        extractor = PDFTextExtractor(str(file_path))
        
        # Get PDF info
        pdf_info = extractor.get_pdf_info()
        
        # Extract content from all pages
        all_content = extractor.extract_content_all_pages(
            include_images=True,
            save_images_to_disk=True,
            output_dir=str(image_dir / content_id),
            extraction_mode="layout"
        )
        
        # Check total character count to avoid quota limits
        total_characters = sum(len(str(page_content.get("text", ""))) for page_content in all_content)
        if total_characters > 100000:  # 100k character limit
            logger.warning(f"Document {content_id} exceeds character limit: {total_characters:,} characters")
            raise ValueError(f"Document exceeds 100,000 character limit ({total_characters:,} characters). Please use a smaller document.")
        
        logger.info(f"Document {content_id} character count: {total_characters:,} characters (within limit)")
        
        # Process and organize the data
        processed_data = {
            "content_id": content_id,
            "pdf_info": pdf_info,
            "total_pages": len(all_content),
            "processed_at": datetime.now().isoformat(),
            "pages": []
        }
        
        for page_content in all_content:
            # Safely extract page number
            page_num = page_content.get("page_number", 0)
            if isinstance(page_num, (int, float)):
                page_number = int(page_num) + 1
            else:
                page_number = 1  # Default fallback
            
            page_data = {
                "page_number": page_number,
                "text": str(page_content.get("text", "")),
                "text_length": len(str(page_content.get("text", ""))),
                "images": []
            }
            
            # Process images for this page
            images_list = page_content.get("images", [])
            if isinstance(images_list, list):
                for img_idx, img_info in enumerate(images_list):
                    if isinstance(img_info, dict):
                        image_data = {
                            "image_index": img_idx + 1,
                            "image_name": img_info.get("name", f"image_{img_idx + 1}"),
                            "image_format": img_info.get("format", "unknown"),
                            "image_size": img_info.get("size", None),
                            "image_path": img_info.get("file_path", ""),
                            "base64_preview": (img_info.get("base64", "")[:100] + "..." 
                                             if len(img_info.get("base64", "")) > 100 
                                             else img_info.get("base64", ""))
                        }
                        page_data["images"].append(image_data)
            
            page_data["image_count"] = len(page_data["images"])
            processed_data["pages"].append(page_data)
        
        # Save processed data as JSON
        json_file_path = data_dir / f"{content_id}.json"
        with open(json_file_path, 'w', encoding='utf-8') as f:
            json.dump(processed_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Processed PDF {content_id}: {len(all_content)} pages, saved to {json_file_path}")
        
        return processed_data
        
    except Exception as e:
        logger.error(f"Error processing PDF {content_id}: {str(e)}")
        raise e