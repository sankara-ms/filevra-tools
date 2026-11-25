export const TOOLS = [
  {
    id: 'image-compressor',
    path: '/image-compressor',
    name: 'Image Compressor',
    action: 'Compress an image',
    icon: 'ImageDown',
    description: 'Reduce JPG, PNG and WebP photos to a target file size without visible quality loss.',
    keywords: ['compress image', 'reduce image size', 'image to 100kb', 'jpeg compressor', 'compress photo'],
  },
  {
    id: 'photo-signature-resizer',
    path: '/photo-signature-resizer',
    name: 'Photo and Signature Resizer',
    action: 'Resize a photo',
    icon: 'Scaling',
    description: 'Set exact pixel width and height for photos and signatures, with an optional file-size limit.',
    keywords: ['resize image', 'signature resizer', 'photo size in pixels', 'resize signature'],
  },
  {
    id: 'image-to-pdf',
    path: '/image-to-pdf',
    name: 'Image to PDF',
    action: 'Convert images to PDF',
    icon: 'FileImage',
    description: 'Combine photos and scans into one neat A4 PDF, in the order you choose.',
    keywords: ['image to pdf', 'jpg to pdf', 'photo to pdf', 'convert images to pdf'],
  },
  {
    id: 'merge-pdf',
    path: '/merge-pdf',
    name: 'PDF Merger',
    action: 'Merge PDF files',
    icon: 'Layers',
    description: 'Join several PDF files into a single document and arrange the page order.',
    keywords: ['merge pdf', 'combine pdf', 'join pdf files', 'pdf merger'],
  },
  {
    id: 'compress-pdf',
    path: '/compress-pdf',
    name: 'PDF Compressor',
    action: 'Compress a PDF',
    icon: 'Archive',
    description: 'Shrink scanned and image-heavy PDFs by re-encoding their pages at a lower resolution.',
    keywords: ['compress pdf', 'reduce pdf size', 'pdf compressor', 'shrink pdf'],
  },
]

export const GUIDES = [
  {
    id: 'image-preparation-guide',
    path: '/image-preparation-guide',
    name: 'Image Preparation Guide',
    description: 'How pixel dimensions, file size and compression interact when preparing a photo or signature.',
    icon: 'Image',
  },
  {
    id: 'pdf-preparation-guide',
    path: '/pdf-preparation-guide',
    name: 'PDF Preparation Guide',
    description: 'A practical explanation of PDF structure, size limits, merging and compression trade-offs.',
    icon: 'FileText',
  },
]

export const TOOL_BY_ID = Object.fromEntries(TOOLS.map((tool) => [tool.id, tool]))

export function getRelatedTools(currentId, count = 3) {
  return TOOLS.filter((tool) => tool.id !== currentId).slice(0, count)
}
