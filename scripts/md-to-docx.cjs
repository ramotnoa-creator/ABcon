const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  convertInchesToTwip,
} = require('docx');

// Read the markdown file
const mdPath = path.join(__dirname, '..', 'MODULE_SPECIFICATION.md');
const mdContent = fs.readFileSync(mdPath, 'utf-8');

// Parse markdown to elements
function parseMarkdown(content) {
  const lines = content.split('\n');
  const elements = [];
  let inTable = false;
  let tableRows = [];
  let inCodeBlock = false;
  let codeLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push({ type: 'code', content: codeLines.join('\n') });
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Handle tables
    if (line.startsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      // Skip separator rows
      if (line.match(/^\|[\s-:|]+\|$/)) continue;

      const cells = line.split('|').filter(c => c.trim() !== '');
      tableRows.push(cells.map(c => c.trim()));
      continue;
    } else if (inTable) {
      elements.push({ type: 'table', rows: tableRows });
      tableRows = [];
      inTable = false;
    }

    // Handle headers
    if (line.startsWith('# ')) {
      elements.push({ type: 'h1', content: line.substring(2) });
    } else if (line.startsWith('## ')) {
      elements.push({ type: 'h2', content: line.substring(3) });
    } else if (line.startsWith('### ')) {
      elements.push({ type: 'h3', content: line.substring(4) });
    } else if (line.startsWith('#### ')) {
      elements.push({ type: 'h4', content: line.substring(5) });
    } else if (line.startsWith('---')) {
      elements.push({ type: 'hr' });
    } else if (line.startsWith('- ')) {
      elements.push({ type: 'bullet', content: line.substring(2) });
    } else if (line.match(/^\d+\.\s/)) {
      elements.push({ type: 'numbered', content: line.replace(/^\d+\.\s/, '') });
    } else if (line.trim() !== '') {
      elements.push({ type: 'paragraph', content: line });
    }
  }

  // Handle remaining table
  if (inTable && tableRows.length > 0) {
    elements.push({ type: 'table', rows: tableRows });
  }

  return elements;
}

// Create text runs with formatting
function createTextRuns(text) {
  const runs = [];
  const parts = text.split(/(\*\*[^*]+\*\*|\`[^`]+\`)/g);

  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, rightToLeft: true }));
    } else if (part.startsWith('`') && part.endsWith('`')) {
      runs.push(new TextRun({
        text: part.slice(1, -1),
        font: 'Consolas',
        shading: { type: ShadingType.SOLID, color: 'E0E0E0' },
        rightToLeft: false
      }));
    } else if (part.trim()) {
      runs.push(new TextRun({ text: part, rightToLeft: true }));
    }
  }

  return runs;
}

// Create document elements
function createDocElements(elements) {
  const docElements = [];

  for (const el of elements) {
    switch (el.type) {
      case 'h1':
        docElements.push(
          new Paragraph({
            children: [new TextRun({ text: el.content, bold: true, size: 36, rightToLeft: true })],
            heading: HeadingLevel.HEADING_1,
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            spacing: { before: 400, after: 200 },
          })
        );
        break;
      case 'h2':
        docElements.push(
          new Paragraph({
            children: [new TextRun({ text: el.content, bold: true, size: 28, rightToLeft: true, color: '2E74B5' })],
            heading: HeadingLevel.HEADING_2,
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            spacing: { before: 300, after: 150 },
          })
        );
        break;
      case 'h3':
        docElements.push(
          new Paragraph({
            children: [new TextRun({ text: el.content, bold: true, size: 24, rightToLeft: true })],
            heading: HeadingLevel.HEADING_3,
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            spacing: { before: 200, after: 100 },
          })
        );
        break;
      case 'h4':
        docElements.push(
          new Paragraph({
            children: [new TextRun({ text: el.content, bold: true, size: 22, rightToLeft: true })],
            heading: HeadingLevel.HEADING_4,
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            spacing: { before: 150, after: 80 },
          })
        );
        break;
      case 'paragraph':
        docElements.push(
          new Paragraph({
            children: createTextRuns(el.content),
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            spacing: { after: 100 },
          })
        );
        break;
      case 'bullet':
        docElements.push(
          new Paragraph({
            children: createTextRuns(el.content),
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            bullet: { level: 0 },
            spacing: { after: 50 },
          })
        );
        break;
      case 'numbered':
        docElements.push(
          new Paragraph({
            children: createTextRuns(el.content),
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            numbering: { reference: 'numbered-list', level: 0 },
            spacing: { after: 50 },
          })
        );
        break;
      case 'code':
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: el.content,
                font: 'Consolas',
                size: 18,
                rightToLeft: false,
              }),
            ],
            alignment: AlignmentType.LEFT,
            shading: { type: ShadingType.SOLID, color: 'F5F5F5' },
            spacing: { before: 100, after: 100 },
            indent: { left: convertInchesToTwip(0.25) },
          })
        );
        break;
      case 'table':
        if (el.rows.length > 0) {
          const tableRows = el.rows.map((row, rowIndex) =>
            new TableRow({
              children: row.map(cell =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: createTextRuns(cell),
                      bidirectional: true,
                      alignment: AlignmentType.RIGHT,
                    }),
                  ],
                  shading: rowIndex === 0
                    ? { type: ShadingType.SOLID, color: 'E7E6E6' }
                    : undefined,
                })
              ),
            })
          );

          docElements.push(
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              },
            })
          );
          docElements.push(new Paragraph({ spacing: { after: 200 } }));
        }
        break;
      case 'hr':
        docElements.push(
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' } },
            spacing: { before: 200, after: 200 },
          })
        );
        break;
    }
  }

  return docElements;
}

// Main execution
const elements = parseMarkdown(mdContent);
const docElements = createDocElements(elements);

const doc = new Document({
  sections: [
    {
      properties: {
        bidi: true, // RTL document
      },
      children: docElements,
    },
  ],
  numbering: {
    config: [
      {
        reference: 'numbered-list',
        levels: [
          {
            level: 0,
            format: 'decimal',
            text: '%1.',
            alignment: AlignmentType.RIGHT,
          },
        ],
      },
    ],
  },
});

// Save the document
const outputPath = path.join(__dirname, '..', 'MODULE_SPECIFICATION.docx');
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log('Document saved to:', outputPath);
});
