#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Convert ABcon_Client_Meeting_Guide.md to professional PDF
Handles bilingual content (English and Hebrew with RTL support)
"""

import markdown
from weasyprint import HTML, CSS
import re

# Read the markdown file
with open('C:\\Users\\ester\\ABcon\\ABcon_Client_Meeting_Guide.md', 'r', encoding='utf-8') as f:
    md_content = f.read()

# Configure markdown extensions for better rendering
md = markdown.Markdown(extensions=[
    'markdown.extensions.tables',
    'markdown.extensions.fenced_code',
    'markdown.extensions.nl2br',
    'markdown.extensions.sane_lists'
])

# Convert markdown to HTML
html_content = md.convert(md_content)

# Create a complete HTML document with professional styling
html_template = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ABcon System Review - Management Decisions Guide</title>
    <style>
        @page {
            size: A4;
            margin: 2cm 1.5cm;

            @top-center {
                content: "ABcon System Review - Management Decisions Guide";
                font-size: 9pt;
                color: #666;
                padding-bottom: 5px;
                border-bottom: 1px solid #ddd;
            }

            @bottom-center {
                content: "Page " counter(page) " of " counter(pages);
                font-size: 9pt;
                color: #666;
            }
        }

        @page :first {
            @top-center { content: none; }
        }

        body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #333;
            max-width: 100%;
        }

        /* Headings */
        h1 {
            font-size: 24pt;
            color: #0f2cbd;
            border-bottom: 3px solid #0f2cbd;
            padding-bottom: 0.3em;
            margin-top: 1.5em;
            margin-bottom: 0.8em;
            page-break-after: avoid;
        }

        h1:first-of-type {
            margin-top: 0;
            font-size: 26pt;
            text-align: center;
            border-bottom: none;
        }

        h2 {
            font-size: 18pt;
            color: #1a3a8a;
            margin-top: 1.5em;
            margin-bottom: 0.6em;
            page-break-after: avoid;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 0.2em;
        }

        h3 {
            font-size: 14pt;
            color: #2563eb;
            margin-top: 1.2em;
            margin-bottom: 0.5em;
            page-break-after: avoid;
        }

        h4 {
            font-size: 12pt;
            color: #4b5563;
            margin-top: 1em;
            margin-bottom: 0.5em;
            font-weight: 600;
            page-break-after: avoid;
        }

        /* Paragraphs */
        p {
            margin: 0.5em 0;
            text-align: justify;
        }

        /* Lists */
        ul, ol {
            margin: 0.5em 0;
            padding-left: 2em;
        }

        li {
            margin: 0.3em 0;
        }

        /* Code blocks */
        pre {
            background: #f5f5f5;
            padding: 1em;
            border-left: 4px solid #0f2cbd;
            border-radius: 4px;
            overflow-x: auto;
            font-family: 'Courier New', Consolas, monospace;
            font-size: 9pt;
            line-height: 1.4;
            margin: 1em 0;
            page-break-inside: avoid;
        }

        code {
            background: #f0f0f0;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', Consolas, monospace;
            font-size: 10pt;
            color: #d63384;
        }

        pre code {
            background: none;
            padding: 0;
            color: #333;
        }

        /* Tables */
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
            font-size: 10pt;
            page-break-inside: avoid;
        }

        th, td {
            border: 1px solid #d1d5db;
            padding: 8px 12px;
            text-align: left;
        }

        th {
            background: #f3f4f6;
            font-weight: 600;
            color: #1f2937;
        }

        tr:nth-child(even) {
            background: #f9fafb;
        }

        /* Horizontal rules */
        hr {
            border: none;
            border-top: 2px solid #e5e7eb;
            margin: 2em 0;
        }

        /* Blockquotes */
        blockquote {
            border-left: 4px solid #9ca3af;
            margin: 1em 0;
            padding-left: 1em;
            color: #6b7280;
            font-style: italic;
        }

        /* Emojis and special characters */
        .emoji {
            font-size: 1.2em;
        }

        /* Hebrew text support - RTL */
        [dir="rtl"], .rtl {
            direction: rtl;
            text-align: right;
            font-family: 'Arial', 'Times New Roman', sans-serif;
        }

        /* Strong emphasis */
        strong, b {
            font-weight: 600;
            color: #1f2937;
        }

        em, i {
            font-style: italic;
        }

        /* Links */
        a {
            color: #0f2cbd;
            text-decoration: none;
        }

        /* Section markers */
        .section-divider {
            text-align: center;
            margin: 2em 0;
            color: #9ca3af;
            font-size: 14pt;
        }

        /* Avoid breaking these elements across pages */
        h1, h2, h3, h4, h5, h6 {
            page-break-inside: avoid;
        }

        table, figure, img, pre {
            page-break-inside: avoid;
        }

        /* Ensure list items stay together */
        li {
            page-break-inside: avoid;
        }

        /* Cover page styling */
        .cover-title {
            text-align: center;
            padding: 2em 0;
            margin-bottom: 1em;
        }
    </style>
</head>
<body>
""" + html_content + """
</body>
</html>
"""

# Add RTL support for Hebrew sections
# Find Hebrew sections and wrap them in RTL div
def add_rtl_support(html):
    # Pattern to detect Hebrew characters
    hebrew_pattern = r'[\u0590-\u05FF]'

    # Split into paragraphs and process
    lines = html.split('\n')
    processed_lines = []

    for line in lines:
        if re.search(hebrew_pattern, line):
            # This line contains Hebrew, wrap paragraph tags with dir="rtl"
            line = re.sub(r'<p>', '<p dir="rtl">', line)
            line = re.sub(r'<h1>', '<h1 dir="rtl">', line)
            line = re.sub(r'<h2>', '<h2 dir="rtl">', line)
            line = re.sub(r'<h3>', '<h3 dir="rtl">', line)
            line = re.sub(r'<h4>', '<h4 dir="rtl">', line)
            line = re.sub(r'<li>', '<li dir="rtl">', line)
            line = re.sub(r'<td>', '<td dir="rtl">', line)
            line = re.sub(r'<th>', '<th dir="rtl">', line)
        processed_lines.append(line)

    return '\n'.join(processed_lines)

html_template = add_rtl_support(html_template)

# Generate PDF
print("Converting markdown to PDF...")
pdf_output = 'C:\\Users\\ester\\ABcon\\ABcon_Client_Meeting_Guide.pdf'

try:
    HTML(string=html_template).write_pdf(
        pdf_output,
        stylesheets=None,
        presentational_hints=True
    )
    print(f"✓ PDF successfully created: {pdf_output}")
    print(f"✓ File size: {round(len(open(pdf_output, 'rb').read()) / 1024, 1)} KB")
    print(f"✓ Document contains bilingual content (English & Hebrew)")
    print(f"✓ Professional formatting applied")

except Exception as e:
    print(f"✗ Error creating PDF: {e}")
    raise

print("\nPDF generation complete!")
