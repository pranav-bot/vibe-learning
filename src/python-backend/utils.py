import json
import re


def format_text(text):
    """
    Formats and cleans up text by handling escape sequences and normalizing whitespace.
    
    Args:
        text (str): Raw text to be formatted.
        
    Returns:
        str: Cleaned and formatted text.
    """
    if not text:
        return text
    
    # Handle common escape sequences
    text = text.replace('\\n', '\n')
    text = text.replace('\\t', '\t')
    text = text.replace('\\r', '\r')
    
    # Remove or replace problematic Unicode characters
    # Replace common Unicode characters with their ASCII equivalents
    unicode_replacements = {
        '\u2013': '-',  # en dash
        '\u2014': '--', # em dash
        '\u2018': "'",  # left single quotation mark
        '\u2019': "'",  # right single quotation mark
        '\u201c': '"',  # left double quotation mark
        '\u201d': '"',  # right double quotation mark
        '\u2022': '•',  # bullet point
        '\u00a0': ' ',  # non-breaking space
        '\u2026': '...', # horizontal ellipsis
        '\u00e9': 'e',  # é
        '\u00ed': 'i',  # í
        '\u00f3': 'o',  # ó
        '\u00fa': 'u',  # ú
        '\u00e1': 'a',  # á
        '\u00c1': 'A',  # Á
        '\u00c9': 'E',  # É
        '\u00cd': 'I',  # Í
        '\u00d3': 'O',  # Ó
        '\u00da': 'U',  # Ú
        '\u0142': 'l',  # ł (Polish l)
        '\u2197': '^',  # up-right arrow (often used as superscript)
        '\u2217': '*',  # asterisk operator
        '\u2020': '+',  # dagger
        '\u00b7': '·',  # middle dot
    }
    
    for unicode_char, replacement in unicode_replacements.items():
        text = text.replace(unicode_char, replacement)
    
    # Remove other problematic Unicode characters that can't be easily replaced
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)
    
    # Normalize whitespace
    # Replace multiple spaces with single space
    text = re.sub(r' +', ' ', text)
    
    # Replace multiple newlines with double newlines (paragraph breaks)
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
    
    # Clean up leading/trailing whitespace on each line
    lines = text.split('\n')
    cleaned_lines = [line.strip() for line in lines]
    
    # Remove empty lines at the beginning and end, but preserve paragraph breaks
    while cleaned_lines and not cleaned_lines[0]:
        cleaned_lines.pop(0)
    while cleaned_lines and not cleaned_lines[-1]:
        cleaned_lines.pop()
    
    # Join lines back together
    text = '\n'.join(cleaned_lines)
    
    return text


def topic_extractor_content(json_data_path):
    """
    Extracts the 'total_pages' and 'pages' fields from the given JSON data.
    
    Args:
        json_data_path (str): Path to the JSON file containing the data.
        
    Returns:
        dict: A dictionary containing 'total_pages' and 'pages_array' fields.
    """
    with open(json_data_path, 'r') as file:
        json_data = json.load(file)
    
    result = {
        'total_pages': json_data['total_pages'],
        'pages': [{'page_number': page['page_number'], 'text': format_text(page['text'])} for page in json_data['pages']]
    }
    
    return result