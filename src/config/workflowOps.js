export const WORKFLOW_OPS = [
  {
    id: 'convert-image',
    name: 'Convert image format',
    summary: 'Write images as PNG, JPG or WebP.',
    runner: 'image-convert',
    kinds: ['image'],
    fields: [
      {
        name: 'format',
        label: 'Output format',
        type: 'select',
        default: 'png',
        options: [
          { value: 'png', label: 'PNG' },
          { value: 'jpg', label: 'JPG' },
          { value: 'webp', label: 'WebP' },
        ],
      },
      { name: 'quality', label: 'Quality', type: 'number', min: 35, max: 98, default: 90 },
    ],
  },
  {
    id: 'resize-image',
    name: 'Resize image',
    summary: 'Fit images inside a maximum width and height.',
    runner: 'image-resize',
    kinds: ['image'],
    fields: [
      { name: 'maxWidth', label: 'Maximum width (px)', type: 'number', min: 16, max: 12000, default: 1600 },
      { name: 'maxHeight', label: 'Maximum height (px)', type: 'number', min: 16, max: 12000, default: 1600 },
    ],
  },
  {
    id: 'compress-image',
    name: 'Compress image',
    summary: 'Re-encode images toward a target size in KB.',
    runner: 'image-compress',
    kinds: ['image'],
    fields: [
      { name: 'targetKb', label: 'Target size (KB)', type: 'number', min: 10, max: 20000, default: 200 },
    ],
  },
  {
    id: 'rotate-image',
    name: 'Rotate or flip image',
    summary: 'Turn images and mirror them.',
    runner: 'image-rotate',
    kinds: ['image'],
    fields: [
      {
        name: 'angle',
        label: 'Rotation',
        type: 'select',
        default: '90',
        options: [
          { value: '90', label: '90° clockwise' },
          { value: '180', label: '180°' },
          { value: '270', label: '90° counter-clockwise' },
          { value: '0', label: 'No rotation' },
        ],
      },
      { name: 'flipH', label: 'Flip horizontally', type: 'checkbox', default: false },
      { name: 'flipV', label: 'Flip vertically', type: 'checkbox', default: false },
    ],
  },
  {
    id: 'watermark-image',
    name: 'Watermark images',
    summary: 'Write text over each image.',
    runner: 'image-watermark',
    kinds: ['image'],
    fields: [
      { name: 'text', label: 'Watermark text', type: 'text', default: 'Filevra' },
      {
        name: 'position',
        label: 'Position',
        type: 'select',
        default: 'bottom-right',
        options: [
          { value: 'top-left', label: 'Top left' },
          { value: 'center', label: 'Centre' },
          { value: 'bottom-right', label: 'Bottom right' },
          { value: 'bottom-center', label: 'Bottom centre' },
        ],
      },
      { name: 'opacity', label: 'Opacity (percent)', type: 'number', min: 5, max: 100, default: 35 },
    ],
  },
  {
    id: 'strip-image',
    name: 'Remove image metadata',
    summary: 'Re-save images without EXIF, GPS or XMP data.',
    runner: 'image-strip',
    kinds: ['image'],
    fields: [],
  },
  {
    id: 'images-to-pdf',
    name: 'Combine images into a PDF',
    summary: 'Place every image on its own A4 page.',
    runner: 'doc-images-to-pdf',
    kinds: ['image'],
    fields: [],
  },
  {
    id: 'pdf-to-images',
    name: 'Render PDF pages as images',
    summary: 'Create one JPG or PNG per page.',
    runner: 'pdf-to-images',
    kinds: ['pdf'],
    preset: { format: 'jpg' },
    fields: [
      { name: 'dpi', label: 'Resolution (DPI)', type: 'number', min: 48, max: 300, default: 120 },
      {
        name: 'format',
        label: 'Image format',
        type: 'select',
        default: 'jpg',
        options: [
          { value: 'jpg', label: 'JPG' },
          { value: 'png', label: 'PNG' },
        ],
      },
    ],
  },
  {
    id: 'rotate-pdf',
    name: 'Rotate PDF pages',
    summary: 'Turn every page by 90, 180 or 270 degrees.',
    runner: 'pdf-rotate',
    kinds: ['pdf'],
    fields: [
      {
        name: 'angle',
        label: 'Rotation',
        type: 'select',
        default: '90',
        options: [
          { value: '90', label: '90° clockwise' },
          { value: '180', label: '180°' },
          { value: '270', label: '90° counter-clockwise' },
        ],
      },
    ],
  },
  {
    id: 'watermark-pdf',
    name: 'Watermark PDF',
    summary: 'Draw text over every PDF page.',
    runner: 'pdf-watermark',
    kinds: ['pdf'],
    fields: [
      { name: 'text', label: 'Watermark text', type: 'text', default: 'CONFIDENTIAL' },
      { name: 'size', label: 'Text size', type: 'number', min: 8, max: 160, default: 48 },
      { name: 'opacity', label: 'Opacity (percent)', type: 'number', min: 5, max: 90, default: 22 },
      { name: 'diagonal', label: 'Place diagonally', type: 'checkbox', default: true },
    ],
  },
  {
    id: 'number-pdf',
    name: 'Add page numbers',
    summary: 'Stamp numbers on the bottom of each page.',
    runner: 'pdf-page-numbers',
    kinds: ['pdf'],
    fields: [
      { name: 'size', label: 'Font size', type: 'number', min: 6, max: 36, default: 10 },
      { name: 'startAt', label: 'First number', type: 'number', min: 1, max: 9999, default: 1 },
    ],
  },
  {
    id: 'grayscale-pdf',
    name: 'Grayscale PDF',
    summary: 'Rebuild pages in black and white.',
    runner: 'pdf-grayscale',
    kinds: ['pdf'],
    fields: [{ name: 'dpi', label: 'Rendering resolution (DPI)', type: 'number', min: 72, max: 200, default: 120 }],
  },
  {
    id: 'compress-pdf',
    name: 'Compress PDF',
    summary: 'Re-render pages at a lower resolution.',
    runner: 'pdf-compress',
    kinds: ['pdf'],
    fields: [
      { name: 'dpi', label: 'Rendering resolution (DPI)', type: 'number', min: 72, max: 200, default: 120 },
      { name: 'quality', label: 'JPEG quality (percent)', type: 'number', min: 35, max: 95, default: 65 },
    ],
  },
]

export const WORKFLOW_OP_BY_ID = Object.fromEntries(WORKFLOW_OPS.map((op) => [op.id, op]))

const OUTPUT_KINDS = {
  'convert-image': 'image',
  'resize-image': 'image',
  'compress-image': 'image',
  'rotate-image': 'image',
  'watermark-image': 'image',
  'strip-image': 'image',
  'images-to-pdf': 'pdf',
  'pdf-to-images': 'image',
}

export function outputKindOf(op) {
  return OUTPUT_KINDS[op.id] || op.kinds[0]
}
