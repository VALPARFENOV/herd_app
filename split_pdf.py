#!/usr/bin/env python3
"""
Split PDF into smaller parts for easier processing
"""
import os
import sys

try:
    from pypdf import PdfReader, PdfWriter
except ImportError:
    try:
        from PyPDF2 import PdfReader, PdfWriter
    except ImportError:
        print("Error: Please install pypdf or PyPDF2")
        print("Run: pip install pypdf")
        sys.exit(1)

def split_pdf(input_pdf, pages_per_part=10, output_dir="pdf_parts"):
    """Split PDF into parts with specified number of pages each"""

    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Read the PDF
    reader = PdfReader(input_pdf)
    total_pages = len(reader.pages)

    print(f"Total pages in PDF: {total_pages}")
    print(f"Splitting into parts of {pages_per_part} pages each")

    # Split into parts
    part_num = 1
    for start_page in range(0, total_pages, pages_per_part):
        end_page = min(start_page + pages_per_part, total_pages)

        # Create a new PDF writer for this part
        writer = PdfWriter()

        # Add pages to this part
        for page_num in range(start_page, end_page):
            writer.add_page(reader.pages[page_num])

        # Save this part
        output_filename = f"{output_dir}/part_{part_num:03d}_pages_{start_page+1}-{end_page}.pdf"
        with open(output_filename, 'wb') as output_file:
            writer.write(output_file)

        print(f"Created: {output_filename} (pages {start_page+1}-{end_page})")
        part_num += 1

    print(f"\nSuccessfully split into {part_num-1} parts in '{output_dir}/' directory")
    return part_num - 1

if __name__ == "__main__":
    input_pdf = "RUSHLP.pdf"

    if not os.path.exists(input_pdf):
        print(f"Error: {input_pdf} not found!")
        sys.exit(1)

    split_pdf(input_pdf, pages_per_part=10)
