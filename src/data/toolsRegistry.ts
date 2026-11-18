export type ToolCategoryId =
  | 'all'
  | 'image'
  | 'pdf'
  | 'text'
  | 'developer'
  | 'security'
  | 'utility'
  | 'productivity';

export interface ToolCategory {
  id: Exclude<ToolCategoryId, 'all'>;
  name: string;
  description: string;
}

export interface ToolDefinition {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: Exclude<ToolCategoryId, 'all'>;
  categoryLabel: string;
  iconName:
    | 'QrCode'
    | 'Minimize2'
    | 'Maximize2'
    | 'RefreshCw'
    | 'Files'
    | 'FileImage'
    | 'FileText'
    | 'CaseSensitive'
    | 'KeyRound'
    | 'Percent'
    | 'Crop'
    | 'FilePlus2'
    | 'Pipette'
    | 'Scissors'
    | 'LayoutGrid'
    | 'Eraser'
    | 'ListFilter'
    | 'GitCompare'
    | 'Braces'
    | 'Binary'
    | 'Link2'
    | 'Fingerprint'
    | 'Cake'
    | 'Scale'
    | 'ArrowLeftRight'
    | 'Layers'
    | 'Stamp'
    | 'FileSearch'
    | 'AppWindow'
    | 'Grid3x3'
    | 'RotateCw'
    | 'Hash'
    | 'FileBadge'
    | 'FileCog'
    | 'Scaling'
    | 'FileCode'
    | 'IndentIncrease'
    | 'Palette'
    | 'SwatchBook'
    | 'Code2'
    | 'Landmark'
    | 'TrendingUp'
    | 'Receipt'
    | 'Tag'
    | 'CalendarDays'
    | 'FileEdit'
    | 'AlignLeft'
    | 'Dices'
    | 'Timer'
    | 'Hourglass';
  popular: boolean;
  keywords: string[];
  processingMode: string;
  acceptedInputs: string;
  seoTitle: string;
  seoDescription: string;
  instructions: string[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'image',
    name: 'Image Tools',
    description: 'Compress, resize, crop, convert, pick colors, and compile images into PDFs.',
  },
  {
    id: 'pdf',
    name: 'PDF Tools',
    description: 'Merge, split, organize, rotate, and export PDF pages privately on your device.',
  },
  {
    id: 'text',
    name: 'Text Tools',
    description: 'Count words, convert casing, clean whitespace, deduplicate lists, and diff text.',
  },
  {
    id: 'developer',
    name: 'Developer Tools',
    description: 'Format JSON, encode Base64 or URLs, and generate RFC 4122 UUID v4 identifiers.',
  },
  {
    id: 'security',
    name: 'Security Tools',
    description: 'Generate high-entropy cryptographic passwords using native browser randomness.',
  },
  {
    id: 'utility',
    name: 'Calculators & QR',
    description: 'Build custom QR codes and calculate EMI, compound interest, GST, discounts, dates, age, BMI, and units.',
  },
  {
    id: 'productivity',
    name: 'Productivity',
    description: 'Draft sanitized Markdown, generate Lorem Ipsum or random numbers, and track time accurately.',
  },
];

export const TOOLS_REGISTRY: ToolDefinition[] = [
  {
    id: 'qr-code-generator',
    slug: 'qr-code-generator',
    name: 'QR Code Generator',
    shortDescription: 'Generate custom QR codes for URLs, Wi-Fi networks, and contact cards.',
    description:
      'Create scannable PNG QR codes for website links, plain text, Wi-Fi credentials, and vCard contacts with custom foreground and background colors.',
    category: 'utility',
    categoryLabel: 'Calculators & QR',
    iconName: 'QrCode',
    popular: true,
    keywords: ['qr', 'barcode', 'wifi', 'vcard', 'contact', 'url', 'link', 'png'],
    processingMode: 'Runs locally',
    acceptedInputs: 'Text, URL, Wi-Fi, vCard',
    seoTitle: 'QR Code Generator – Custom URL, Wi-Fi & Contact QR | ToolNova',
    seoDescription:
      'Generate custom QR codes for URLs, Wi-Fi networks, and vCard contacts with custom colors and instant PNG download in your browser.',
    instructions: [
      'Choose Text / URL, Wi-Fi Network, or Contact (vCard) at the top of the workspace.',
      'Fill in your destination link, network credentials, or contact fields.',
      'Adjust foreground/background colors, output PNG size, and error correction level.',
      'Click Download PNG to save your scannable QR image locally.',
    ],
  },
  {
    id: 'image-compressor',
    slug: 'image-compressor',
    name: 'Image Compressor',
    shortDescription: 'Shrink JPG, PNG, and WebP file sizes with live before-and-after inspection.',
    description:
      'Reduce image file weight directly on your device with an adjustable quality slider, byte-savings breakdown, and side-by-side preview.',
    category: 'image',
    categoryLabel: 'Image Tools',
    iconName: 'Minimize2',
    popular: true,
    keywords: ['compress', 'optimize', 'shrink', 'jpg', 'jpeg', 'png', 'webp', 'photo'],
    processingMode: 'Runs locally',
    acceptedInputs: 'JPG, PNG, WebP',
    seoTitle: 'Image Compressor – Reduce JPG, PNG & WebP Size | ToolNova',
    seoDescription:
      'Compress JPG, PNG, and WebP images privately in your browser with adjustable quality and instant before-and-after comparison.',
    instructions: [
      'Drop or choose a JPG, PNG, or WebP image from your device.',
      'Drag the compression quality slider and pick an output format (WebP or JPG yields maximum savings).',
      'Compare original vs. compressed size and visual clarity side by side.',
      'Click Download to save the smaller image.',
    ],
  },
  {
    id: 'image-resizer',
    slug: 'image-resizer',
    name: 'Image Resizer',
    shortDescription: 'Resize images to exact pixel dimensions with optional aspect ratio lock.',
    description:
      'Scale photos and graphics to custom widths and heights while maintaining crisp proportions or choosing common social presets.',
    category: 'image',
    categoryLabel: 'Image Tools',
    iconName: 'Maximize2',
    popular: false,
    keywords: ['resize', 'dimensions', 'width', 'height', 'scale', 'aspect ratio'],
    processingMode: 'Runs locally',
    acceptedInputs: 'JPG, PNG, WebP, GIF',
    seoTitle: 'Image Resizer – Exact Pixel Scaling & Aspect Lock | ToolNova',
    seoDescription:
      'Resize images to exact pixel dimensions in your browser with aspect ratio locking, instant preview, and lossless download.',
    instructions: [
      'Upload any JPG, PNG, WebP, GIF, or BMP image.',
      'Enter your target pixel width or height, or click a quick percentage scale button.',
      'Toggle Aspect Ratio Locked if you want to stretch dimensions independently.',
      'Select your export format and click Download Resized.',
    ],
  },
  {
    id: 'image-converter',
    slug: 'image-converter',
    name: 'Image Converter',
    shortDescription: 'Convert images seamlessly between PNG, JPG, and WebP formats.',
    description:
      'Transform uploaded images into web-ready WebP, universal JPG, or transparent PNG formats without sending files to external servers.',
    category: 'image',
    categoryLabel: 'Image Tools',
    iconName: 'RefreshCw',
    popular: false,
    keywords: ['convert', 'format', 'png to jpg', 'jpg to webp', 'webp to png', 'export'],
    processingMode: 'Runs locally',
    acceptedInputs: 'JPG, PNG, WebP, BMP, GIF',
    seoTitle: 'Image Converter – Convert PNG, JPG & WebP Online | ToolNova',
    seoDescription:
      'Convert images between PNG, JPG, and WebP formats privately inside your browser with adjustable export quality.',
    instructions: [
      'Select or drop an image file from your computer or phone.',
      'Pick your target output format: PNG, JPG, or WebP.',
      'Adjust export quality when saving as JPG or WebP.',
      'Inspect the preview and click Download to save the converted file.',
    ],
  },
  {
    id: 'image-cropper',
    slug: 'image-cropper',
    name: 'Image Cropper',
    shortDescription: 'Crop and rotate images interactively with aspect ratio presets.',
    description:
      'Frame your photos using touch-ready crop handles, standard aspect ratios (1:1, 4:3, 16:9, 3:2), and 90-degree rotation controls.',
    category: 'image',
    categoryLabel: 'Image Tools',
    iconName: 'Crop',
    popular: true,
    keywords: ['crop', 'trim', 'rotate', 'aspect ratio', 'square', '16:9', 'photo'],
    processingMode: 'Runs locally',
    acceptedInputs: 'JPG, PNG, WebP, GIF, BMP',
    seoTitle: 'Image Cropper – Interactive Crop & Rotate Online | ToolNova',
    seoDescription:
      'Crop and rotate images directly in your browser with interactive drag handles, aspect ratio presets, and PNG, JPG, or WebP export.',
    instructions: [
      'Upload an image from your device to load the interactive crop stage.',
      'Choose an aspect ratio preset (Free, 1:1, 4:3, 16:9, 3:2) and rotate 90° if needed.',
      'Drag the crop frame or corner handles to select the exact region you want to keep.',
      'Choose PNG, JPG, or WebP and click Download Crop.',
    ],
  },
  {
    id: 'image-to-pdf',
    slug: 'image-to-pdf',
    name: 'Image to PDF',
    shortDescription: 'Combine multiple images into a multi-page PDF with page sizing options.',
    description:
      'Turn photos, scans, and screenshots into a single PDF document with custom ordering, A4 or US Letter sizing, and portrait or landscape layout.',
    category: 'image',
    categoryLabel: 'Image Tools',
    iconName: 'FilePlus2',
    popular: false,
    keywords: ['image to pdf', 'jpg to pdf', 'png to pdf', 'photos', 'scan', 'a4', 'letter'],
    processingMode: 'Runs locally',
    acceptedInputs: 'Multiple JPG, PNG, WebP',
    seoTitle: 'Image to PDF – Convert JPG & PNG Photos to PDF | ToolNova',
    seoDescription:
      'Convert and reorder multiple JPG, PNG, or WebP images into a custom A4 or Letter PDF document locally in your browser.',
    instructions: [
      'Add one or more JPG, PNG, WebP, GIF, or BMP images using the dropzone.',
      'Reorder images using the up and down arrows to set page order.',
      'Choose A4, US Letter, or Fit Page to Each Image along with Portrait or Landscape orientation.',
      'Click Generate PDF to build and download your document.',
    ],
  },
  {
    id: 'image-color-picker',
    slug: 'image-color-picker',
    name: 'Image Color Picker',
    shortDescription: 'Sample exact HEX, RGB, and HSL color values from any image pixel.',
    description:
      'Inspect photos, logos, and UI screenshots by clicking or tapping any pixel to extract accurate HEX, RGB, and HSL codes with palette history.',
    category: 'image',
    categoryLabel: 'Image Tools',
    iconName: 'Pipette',
    popular: false,
    keywords: ['color picker', 'eyedropper', 'hex', 'rgb', 'hsl', 'palette', 'swatch'],
    processingMode: 'Runs locally',
    acceptedInputs: 'JPG, PNG, WebP, GIF, BMP',
    seoTitle: 'Image Color Picker – Extract HEX, RGB & HSL Codes | ToolNova',
    seoDescription:
      'Click or tap any pixel in an uploaded image to sample exact HEX, RGB, and HSL color codes privately in your browser.',
    instructions: [
      'Upload any image or graphic into the color picker canvas.',
      'Click or tap anywhere on the image to inspect the exact pixel color.',
      'Copy the generated HEX, RGB, or HSL code with a single click.',
      'Revisit recently sampled colors in the Picked Palette tray.',
    ],
  },
  {
    id: 'pdf-merger',
    slug: 'pdf-merger',
    name: 'PDF Merger',
    shortDescription: 'Combine multiple PDF files in custom order into a single document.',
    description:
      'Upload two or more PDF documents, reorder them precisely, verify page counts, and export one merged PDF directly on your device.',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    iconName: 'Files',
    popular: true,
    keywords: ['pdf', 'merge', 'combine', 'join', 'documents', 'pages'],
    processingMode: 'Runs locally',
    acceptedInputs: 'Multiple PDF files',
    seoTitle: 'PDF Merger – Combine PDF Documents Locally | ToolNova',
    seoDescription:
      'Merge multiple PDF files in your browser with custom ordering and instant download. Your private documents never leave your device.',
    instructions: [
      'Select two or more unencrypted PDF files to add them to the merge queue.',
      'Verify each file’s page count and reorder documents using the arrow buttons.',
      'Click Merge & Download PDF to combine all pages locally.',
    ],
  },
  {
    id: 'pdf-to-image',
    slug: 'pdf-to-image',
    name: 'PDF to Image',
    shortDescription: 'Render any PDF page into a crisp PNG or JPG image ready to download.',
    description:
      'Inspect multi-page PDF documents page by page, pick an output resolution scale, and save individual pages as clean PNG or JPG images.',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    iconName: 'FileImage',
    popular: false,
    keywords: ['pdf', 'image', 'png', 'jpg', 'extract', 'render', 'page'],
    processingMode: 'Runs locally',
    acceptedInputs: 'PDF document',
    seoTitle: 'PDF to Image – Export PDF Pages as PNG or JPG | ToolNova',
    seoDescription:
      'Select any page from a PDF file and render it as a high-resolution PNG or JPG image directly inside your browser.',
    instructions: [
      'Upload a PDF file to render its pages locally.',
      'Navigate to the page number you want to capture.',
      'Select 1×, 2×, or 3× resolution and choose PNG or JPG format.',
      'Click Download Page to save the rendered image.',
    ],
  },
  {
    id: 'pdf-splitter',
    slug: 'pdf-splitter',
    name: 'PDF Splitter',
    shortDescription: 'Extract specific page ranges or individual pages from any PDF.',
    description:
      'Split large PDF documents into smaller files by entering page ranges like 1-3, 5 or tapping individual pages, then export together or separately.',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    iconName: 'Scissors',
    popular: false,
    keywords: ['pdf', 'split', 'extract', 'pages', 'range', 'separate', 'cut'],
    processingMode: 'Runs locally',
    acceptedInputs: 'PDF document',
    seoTitle: 'PDF Splitter – Extract PDF Pages & Ranges Locally | ToolNova',
    seoDescription:
      'Split PDF files by page ranges or individual pages directly in your browser without uploading sensitive documents.',
    instructions: [
      'Upload an unencrypted PDF file to inspect its total page count.',
      'Type page ranges (e.g. 1-3, 5, 8) or tap page numbers directly in the grid.',
      'Export all selected pages as one new PDF or download separate PDFs per range.',
    ],
  },
  {
    id: 'pdf-page-organizer',
    slug: 'pdf-page-organizer',
    name: 'PDF Page Organizer',
    shortDescription: 'Preview thumbnails, reorder, rotate 90°, and delete PDF pages.',
    description:
      'Visually inspect every page of a PDF document, rearrange page sequence, fix sideways scans by rotating, remove unwanted pages, and save.',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    iconName: 'LayoutGrid',
    popular: false,
    keywords: ['pdf', 'organize', 'reorder', 'rotate', 'delete', 'pages', 'thumbnail'],
    processingMode: 'Runs locally',
    acceptedInputs: 'PDF document',
    seoTitle: 'PDF Page Organizer – Reorder, Rotate & Delete Pages | ToolNova',
    seoDescription:
      'Preview PDF page thumbnails, rearrange page order, rotate individual pages 90 degrees, and delete unwanted pages in your browser.',
    instructions: [
      'Upload a PDF to generate live visual thumbnails for every page.',
      'Use the left/right arrows on any card to move pages earlier or later.',
      'Click the rotate icon to turn a page 90° clockwise, or the trash icon to remove it.',
      'Click Export PDF to download your updated document.',
    ],
  },
  {
    id: 'word-counter',
    slug: 'word-counter',
    name: 'Word Counter',
    shortDescription: 'Measure words, characters, sentences, paragraphs, and reading time live.',
    description:
      'Paste or draft copy to inspect real-time word counts, character totals with and without spaces, sentence structure, and estimated reading time.',
    category: 'text',
    categoryLabel: 'Text Tools',
    iconName: 'FileText',
    popular: true,
    keywords: ['word', 'character', 'sentence', 'paragraph', 'reading time', 'count', 'essay'],
    processingMode: 'Instant',
    acceptedInputs: 'Plain text',
    seoTitle: 'Word Counter – Live Word, Character & Reading Time | ToolNova',
    seoDescription:
      'Count words, characters, sentences, paragraphs, and estimated reading time in real time with zero tracking.',
    instructions: [
      'Type or paste your article, essay, or notes into the text area.',
      'Review live word, character, sentence, paragraph, and reading time metrics above.',
      'Use Copy or Clear whenever you are ready to move on.',
    ],
  },
  {
    id: 'case-converter',
    slug: 'case-converter',
    name: 'Case Converter',
    shortDescription: 'Transform text between UPPERCASE, lowercase, Title Case, and Sentence case.',
    description:
      'Clean up headings, notes, and lists by switching between uppercase, lowercase, title case, and sentence case with one-click clipboard copy.',
    category: 'text',
    categoryLabel: 'Text Tools',
    iconName: 'CaseSensitive',
    popular: false,
    keywords: ['case', 'uppercase', 'lowercase', 'title case', 'sentence case', 'capitalize'],
    processingMode: 'Instant',
    acceptedInputs: 'Plain text',
    seoTitle: 'Case Converter – Uppercase, Lowercase & Title Case | ToolNova',
    seoDescription:
      'Convert text effortlessly between UPPERCASE, lowercase, Title Case, and Sentence case directly in your browser.',
    instructions: [
      'Paste or enter text in the workspace editor.',
      'Click UPPERCASE, lowercase, Title Case, or Sentence case to transform your copy.',
      'Use Undo to revert the last change, or Copy Output / Save .txt.',
    ],
  },
  {
    id: 'text-cleaner',
    slug: 'text-cleaner',
    name: 'Text Cleaner',
    shortDescription: 'Strip extra spaces, blank lines, tabs, and messy whitespace.',
    description:
      'Normalize copied text from PDFs, emails, and spreadsheets by trimming line edges, collapsing repeated spaces, and removing empty lines.',
    category: 'text',
    categoryLabel: 'Text Tools',
    iconName: 'Eraser',
    popular: false,
    keywords: ['clean', 'trim', 'whitespace', 'spaces', 'blank lines', 'format', 'strip'],
    processingMode: 'Instant',
    acceptedInputs: 'Plain text',
    seoTitle: 'Text Cleaner – Remove Extra Spaces & Blank Lines | ToolNova',
    seoDescription:
      'Clean pasted text by removing duplicate spaces, blank lines, tabs, and trailing whitespace instantly in your browser.',
    instructions: [
      'Toggle the cleanup rules you need (duplicate spaces, blank lines, trim lines, tabs).',
      'Paste your raw text into the left input panel.',
      'Copy the cleaned output immediately from the right panel.',
    ],
  },
  {
    id: 'duplicate-line-remover',
    slug: 'duplicate-line-remover',
    name: 'Duplicate Line Remover',
    shortDescription: 'Deduplicate lists while preserving original line order and counts.',
    description:
      'Remove repeated rows from email lists, keywords, logs, or CSV columns without scrambling the original sequence, with case sensitivity toggles.',
    category: 'text',
    categoryLabel: 'Text Tools',
    iconName: 'ListFilter',
    popular: false,
    keywords: ['duplicate', 'dedupe', 'unique', 'lines', 'list', 'remove duplicates'],
    processingMode: 'Instant',
    acceptedInputs: 'Line-separated text',
    seoTitle: 'Duplicate Line Remover – Keep Unique Lines in Order | ToolNova',
    seoDescription:
      'Remove duplicate lines from any text list while preserving original order and viewing exact removed line counts.',
    instructions: [
      'Paste line-separated text into the Original List panel.',
      'Configure case-sensitivity, whitespace trimming, or blank-line removal.',
      'Inspect the Unique Kept and Removed counts, then copy the deduplicated result.',
    ],
  },
  {
    id: 'text-diff-checker',
    slug: 'text-diff-checker',
    name: 'Text Diff Checker',
    shortDescription: 'Compare two texts line by line and highlight additions and removals.',
    description:
      'Paste original and modified drafts, code snippets, or configuration files side by side to inspect added lines, removed lines, and summary stats.',
    category: 'text',
    categoryLabel: 'Text Tools',
    iconName: 'GitCompare',
    popular: false,
    keywords: ['diff', 'compare', 'changes', 'added', 'removed', 'text comparison'],
    processingMode: 'Instant',
    acceptedInputs: 'Two plain-text inputs',
    seoTitle: 'Text Diff Checker – Compare Two Texts Side by Side | ToolNova',
    seoDescription:
      'Compare two blocks of text or code line by line in your browser with highlighted additions, removals, and difference stats.',
    instructions: [
      'Paste your baseline content into Original Text and the revised version into Modified Text.',
      'Optionally enable "Ignore leading/trailing whitespace" for cleaner comparisons.',
      'Review line-numbered additions (+), removals (-), and total change counts below.',
    ],
  },
  {
    id: 'json-formatter',
    slug: 'json-formatter',
    name: 'JSON Formatter',
    shortDescription: 'Format, validate, and minify JSON with line-level error reporting.',
    description:
      'Pretty-print payloads with 2 spaces, 4 spaces, or tabs, minify JSON for production, and pinpoint syntax errors with line and column coordinates.',
    category: 'developer',
    categoryLabel: 'Developer Tools',
    iconName: 'Braces',
    popular: true,
    keywords: ['json', 'format', 'validate', 'minify', 'pretty print', 'lint', 'parser'],
    processingMode: 'Instant',
    acceptedInputs: 'JSON string',
    seoTitle: 'JSON Formatter & Validator – Pretty Print & Minify | ToolNova',
    seoDescription:
      'Validate, format, and minify JSON locally in your browser with exact line and column syntax error detection.',
    instructions: [
      'Paste raw or minified JSON into the JSON Input panel.',
      'Pick 2 Spaces, 4 Spaces, Tabs, or Minify to format valid payloads immediately.',
      'If invalid, read the status banner for the exact line and column of the syntax error.',
    ],
  },
  {
    id: 'base64-encoder-decoder',
    slug: 'base64-encoder-decoder',
    name: 'Base64 Encoder Decoder',
    shortDescription: 'Encode UTF-8 text to Base64 or decode Base64 strings safely.',
    description:
      'Convert plain text, Unicode strings, and tokens to standard or URL-safe Base64 and decode Base64 back to readable text with validation.',
    category: 'developer',
    categoryLabel: 'Developer Tools',
    iconName: 'Binary',
    popular: false,
    keywords: ['base64', 'encode', 'decode', 'utf8', 'url safe', 'token'],
    processingMode: 'Instant',
    acceptedInputs: 'UTF-8 text or Base64',
    seoTitle: 'Base64 Encoder & Decoder – UTF-8 Safe Online Tool | ToolNova',
    seoDescription:
      'Encode UTF-8 text to standard or URL-safe Base64 and decode Base64 strings safely with instant error checking.',
    instructions: [
      'Select Encode (Text → Base64) or Decode (Base64 → Text).',
      'Optionally enable URL-safe Base64 (- and _) when encoding tokens or query values.',
      'Paste your input and copy the converted result or click Swap to reverse direction.',
    ],
  },
  {
    id: 'url-encoder-decoder',
    slug: 'url-encoder-decoder',
    name: 'URL Encoder Decoder',
    shortDescription: 'Encode or decode URL components and query strings safely.',
    description:
      'Percent-encode query parameter values or full URLs and safely decode malformed percent sequences with clear error notifications.',
    category: 'developer',
    categoryLabel: 'Developer Tools',
    iconName: 'Link2',
    popular: false,
    keywords: ['url', 'encode', 'decode', 'percent', 'uri', 'query string', 'encodeURIComponent'],
    processingMode: 'Instant',
    acceptedInputs: 'URL or query string',
    seoTitle: 'URL Encoder & Decoder – Safe Percent Encoding Tool | ToolNova',
    seoDescription:
      'Encode and decode URL components or full URLs cleanly in your browser with malformed sequence protection.',
    instructions: [
      'Switch between Encode and Decode modes.',
      'Choose Component mode for query parameter values or Full URL mode to preserve /, :, ?, and &.',
      'Paste your text and copy the encoded or decoded result.',
    ],
  },
  {
    id: 'uuid-generator',
    slug: 'uuid-generator',
    name: 'UUID Generator',
    shortDescription: 'Generate cryptographically random RFC 4122 v4 UUIDs in bulk.',
    description:
      'Create single or batch Version 4 UUIDs using crypto.randomUUID with a secure Web Crypto fallback, uppercase/hyphen toggles, and instant copy.',
    category: 'developer',
    categoryLabel: 'Developer Tools',
    iconName: 'Fingerprint',
    popular: false,
    keywords: ['uuid', 'guid', 'v4', 'random', 'identifier', 'crypto', 'batch'],
    processingMode: 'Zero storage',
    acceptedInputs: 'Quantity & format options',
    seoTitle: 'UUID Generator – Bulk Cryptographic UUID v4 | ToolNova',
    seoDescription:
      'Generate 1 to 100 cryptographically random UUID v4 identifiers locally using crypto.randomUUID with copy and download options.',
    instructions: [
      'Set the quantity of UUIDs to generate (between 1 and 100).',
      'Toggle Uppercase or Include Hyphens to match your database or API format.',
      'Click Generate for a fresh batch, then copy individual IDs, Copy All, or Download .txt.',
    ],
  },
  {
    id: 'password-generator',
    slug: 'password-generator',
    name: 'Password Generator',
    shortDescription: 'Create strong random passwords using cryptographic browser entropy.',
    description:
      'Generate custom-length passwords using Web Crypto API randomness with uppercase, lowercase, numbers, and symbol toggles. Never stored.',
    category: 'security',
    categoryLabel: 'Security Tools',
    iconName: 'KeyRound',
    popular: true,
    keywords: ['password', 'security', 'random', 'crypto', 'entropy', 'passphrase'],
    processingMode: 'Zero storage',
    acceptedInputs: 'Length & character sets',
    seoTitle: 'Password Generator – Cryptographically Secure & Private | ToolNova',
    seoDescription:
      'Generate strong passwords with browser cryptographic randomness. Custom length and character sets, never saved or transmitted.',
    instructions: [
      'Adjust the password length slider (6 to 64 characters).',
      'Choose which character pools to include and optionally exclude look-alike characters.',
      'Click Regenerate if desired and copy the password directly from volatile memory.',
    ],
  },
  {
    id: 'percentage-calculator',
    slug: 'percentage-calculator',
    name: 'Percentage Calculator',
    shortDescription: 'Compute percentage of a number, increase, decrease, and difference.',
    description:
      'Solve common financial, academic, and analytical percentage problems with step-by-step formula transparency and instant copyable results.',
    category: 'utility',
    categoryLabel: 'Calculators & QR',
    iconName: 'Percent',
    popular: false,
    keywords: ['percentage', 'percent', 'increase', 'decrease', 'difference', 'math', 'discount'],
    processingMode: 'Instant',
    acceptedInputs: 'Numeric values',
    seoTitle: 'Percentage Calculator – Increase, Decrease & Difference | ToolNova',
    seoDescription:
      'Calculate percentage of a number, percentage increase, percentage decrease, and percentage difference with clear formulas.',
    instructions: [
      'Pick one of the four calculation tabs (% of a Number, % Increase, % Decrease, % Difference).',
      'Enter your two numeric values to compute the result immediately.',
      'Review the formula breakdown or click Copy to reuse the answer.',
    ],
  },
  {
    id: 'age-calculator',
    slug: 'age-calculator',
    name: 'Age Calculator',
    shortDescription: 'Calculate exact chronological age in years, months, and days.',
    description:
      'Find exact age from a date of birth to today or any custom date, including total days lived, total weeks, and next birthday countdown.',
    category: 'utility',
    categoryLabel: 'Calculators & QR',
    iconName: 'Cake',
    popular: false,
    keywords: ['age', 'birthday', 'dob', 'date of birth', 'years', 'months', 'days'],
    processingMode: 'Instant',
    acceptedInputs: 'Date of birth',
    seoTitle: 'Age Calculator – Exact Years, Months & Days | ToolNova',
    seoDescription:
      'Calculate your exact age in years, months, days, and total days lived from your date of birth with future-date validation.',
    instructions: [
      'Select your Date of Birth using the date picker.',
      'Optionally adjust the Age at Date field to calculate age on a specific historical or future date.',
      'View exact years, months, days, total days lived, and days until the next birthday.',
    ],
  },
  {
    id: 'bmi-calculator',
    slug: 'bmi-calculator',
    name: 'BMI Calculator',
    shortDescription: 'Calculate adult Body Mass Index using Metric or Imperial units.',
    description:
      'Compute adult BMI using centimeters/kilograms or feet/inches/pounds, see standard adult BMI categories, and review reference weight ranges.',
    category: 'utility',
    categoryLabel: 'Calculators & QR',
    iconName: 'Scale',
    popular: false,
    keywords: ['bmi', 'body mass index', 'weight', 'height', 'metric', 'imperial', 'health'],
    processingMode: 'Instant',
    acceptedInputs: 'Height & weight',
    seoTitle: 'BMI Calculator – Metric & Imperial Adult BMI | ToolNova',
    seoDescription:
      'Calculate adult Body Mass Index (BMI) in Metric or Imperial units and view standard adult BMI category ranges.',
    instructions: [
      'Select Metric (cm / kg) or Imperial (ft, in / lbs).',
      'Enter your height and weight to view your BMI score and adult category.',
      'Review the disclaimer: BMI is a screening indicator, not a medical diagnosis.',
    ],
  },
  {
    id: 'unit-converter',
    slug: 'unit-converter',
    name: 'Unit Converter',
    shortDescription: 'Convert length, weight, temperature, area, and volume accurately.',
    description:
      'Switch seamlessly between metric and US customary units across length, weight, temperature, area, and volume with unit swapping and all-unit tables.',
    category: 'utility',
    categoryLabel: 'Calculators & QR',
    iconName: 'ArrowLeftRight',
    popular: false,
    keywords: ['unit', 'convert', 'length', 'weight', 'temperature', 'area', 'volume', 'metric'],
    processingMode: 'Instant',
    acceptedInputs: 'Numeric value & units',
    seoTitle: 'Unit Converter – Length, Weight, Temp, Area & Volume | ToolNova',
    seoDescription:
      'Convert accurately between Length, Weight, Temperature, Area, and Volume units with instant swapping and full equivalent tables.',
    instructions: [
      'Choose a measurement category: Length, Weight, Temperature, Area, or Volume.',
      'Enter a numeric value and select your source and target units.',
      'Click the swap button to reverse units or copy the result directly.',
    ],
  },
  {
    id: 'image-background-changer',
    slug: 'image-background-changer',
    name: 'Image Background Changer',
    shortDescription: 'Replace or remove image backgrounds using color masking and manual brushes.',
    description:
      'Sample background colors, tune flood-fill or global chroma-key tolerance, refine edges with manual Erase/Restore brushes, and export transparent PNGs or solid backdrops.',
    category: 'image',
    categoryLabel: 'Image Tools',
    iconName: 'Layers',
    popular: false,
    keywords: ['background', 'remove background', 'replace background', 'chroma key', 'mask', 'transparent'],
    processingMode: 'Runs locally',
    acceptedInputs: 'JPG, PNG, WebP, GIF',
    seoTitle: 'Image Background Changer – Color Mask & Manual Brush | ToolNova',
    seoDescription:
      'Replace image backgrounds with solid colors or transparency in your browser using color-tolerance flood fill and manual refine brushes.',
    instructions: [
      'Upload an image and click any background area in Sample Color mode to select the target color.',
      'Adjust Color Tolerance and Edge Feather, or switch between Connected Flood and Global Color Key.',
      'Use Erase BG or Restore FG brushes to refine fine regions manually.',
      'Pick a solid replacement color or Transparent PNG and click Download Image.',
    ],
  },
  {
    id: 'image-watermark-maker',
    slug: 'image-watermark-maker',
    name: 'Image Watermark Maker',
    shortDescription: 'Stamp custom text or logo watermarks onto images with full positioning.',
    description:
      'Protect photos and previews by adding customizable text or PNG logo watermarks with opacity, rotation, margin, and 9-point or tiled grid placement.',
    category: 'image',
    categoryLabel: 'Image Tools',
    iconName: 'Stamp',
    popular: false,
    keywords: ['watermark', 'copyright', 'logo', 'stamp', 'text overlay', 'protect image'],
    processingMode: 'Runs locally',
    acceptedInputs: 'JPG, PNG, WebP, GIF',
    seoTitle: 'Image Watermark Maker – Add Text or Logo Overlays | ToolNova',
    seoDescription:
      'Add custom text or transparent logo watermarks to images directly in your browser with live opacity, rotation, and tiling controls.',
    instructions: [
      'Upload the main photo or graphic you want to watermark.',
      'Choose Text Watermark or Logo / Image and enter your copy or secondary logo file.',
      'Tune size, opacity, rotation angle, and choose a position preset or Tiled Grid.',
      'Inspect the live preview and click Download Image.',
    ],
  },
  {
    id: 'image-metadata-viewer',
    slug: 'image-metadata-viewer',
    name: 'Image Metadata Viewer',
    shortDescription: 'Inspect dimensions, file size, EXIF camera settings, and GPS tags safely.',
    description:
      'Read authentic image properties and embedded EXIF, TIFF, IPTC, XMP, and GPS metadata locally in your browser without inventing missing tags.',
    category: 'image',
    categoryLabel: 'Image Tools',
    iconName: 'FileSearch',
    popular: false,
    keywords: ['exif', 'metadata', 'camera', 'gps', 'dimensions', 'inspector', 'iptc'],
    processingMode: 'Runs locally',
    acceptedInputs: 'JPG, PNG, WebP, GIF, BMP',
    seoTitle: 'Image Metadata Viewer – Read Authentic EXIF & GPS Tags | ToolNova',
    seoDescription:
      'View image dimensions, format, file size, camera EXIF settings, and GPS coordinates locally without uploading private photos.',
    instructions: [
      'Drop or choose a photo from your camera, phone, or computer.',
      'Review core file dimensions, format, and megapixel metrics.',
      'Inspect available EXIF camera, exposure, and GPS tags—unavailable fields are clearly labeled.',
      'Click Copy JSON to export the extracted metadata summary.',
    ],
  },
  {
    id: 'favicon-generator',
    slug: 'favicon-generator',
    name: 'Favicon Generator',
    shortDescription: 'Generate multi-size PNG icons and a genuine favicon.ico bundle.',
    description:
      'Convert any logo or graphic into crisp 16×16, 32×32, 48×48, 64×64, 180×180 Apple Touch, 192×192, and 512×512 PNGs plus a multi-resolution .ico file.',
    category: 'image',
    categoryLabel: 'Image Tools',
    iconName: 'AppWindow',
    popular: false,
    keywords: ['favicon', 'ico', 'apple touch icon', 'pwa icon', 'website icon', 'png'],
    processingMode: 'Runs locally',
    acceptedInputs: 'PNG, JPG, WebP, GIF',
    seoTitle: 'Favicon Generator – Create .ICO & Multi-Size PNG Icons | ToolNova',
    seoDescription:
      'Generate crisp website favicons in .ico and multi-size PNG formats (16x16 to 512x512) with padding, rounding, and HTML link tags.',
    instructions: [
      'Upload a square logo or high-resolution icon image.',
      'Select your target icon sizes and optionally add background fill, padding, or rounded corners.',
      'Check the Browser Tab Simulation preview.',
      'Download favicon.ico, individual PNG sizes, and copy the HTML head tags.',
    ],
  },
  {
    id: 'image-pixelator',
    slug: 'image-pixelator',
    name: 'Image Pixelator',
    shortDescription: 'Pixelate an entire image or drag a box to blur sensitive regions.',
    description:
      'Apply crisp mosaic pixelation across a full photo or a resizable rectangular selection to obscure faces, license plates, or private details.',
    category: 'image',
    categoryLabel: 'Image Tools',
    iconName: 'Grid3x3',
    popular: false,
    keywords: ['pixelate', 'mosaic', 'censor', 'blur region', 'redact image', 'pixel art'],
    processingMode: 'Runs locally',
    acceptedInputs: 'JPG, PNG, WebP, GIF',
    seoTitle: 'Image Pixelator – Pixelate Full Photos or Selected Regions | ToolNova',
    seoDescription:
      'Pixelate full images or drag a custom selection box to redact sensitive regions directly in your browser.',
    instructions: [
      'Upload an image into the pixelator workspace.',
      'Choose Selected Region to drag and resize the mosaic box, or Full Image to pixelate everything.',
      'Adjust the Block size slider (4px to 64px) to set pixel coarseness.',
      'Select your export format and click Download Image.',
    ],
  },
  {
    id: 'pdf-rotator',
    slug: 'pdf-rotator',
    name: 'PDF Rotator',
    shortDescription: 'Rotate selected PDF pages or entire documents by 90°, 180°, or 270°.',
    description:
      'Inspect live thumbnails of every PDF page, select specific pages or all pages, fix sideways scans with batch or per-page rotation, and export cleanly.',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    iconName: 'RotateCw',
    popular: false,
    keywords: ['pdf rotate', 'turn pdf', 'orientation', 'sideways pdf', '90 degrees'],
    processingMode: 'Runs locally',
    acceptedInputs: 'PDF document',
    seoTitle: 'PDF Rotator – Rotate Selected or All PDF Pages Online | ToolNova',
    seoDescription:
      'Preview PDF page thumbnails and rotate individual or all pages by 90°, 180°, or 270° privately inside your browser.',
    instructions: [
      'Upload an unencrypted PDF to generate visual page previews.',
      'Click pages to toggle selection, or use Select All.',
      'Apply -90°, +90°, or 180° batch rotations or rotate individual page cards.',
      'Click Export Rotated PDF to save your corrected document.',
    ],
  },
  {
    id: 'pdf-page-numbering',
    slug: 'pdf-page-numbering',
    name: 'PDF Page Numbering',
    shortDescription: 'Add customizable page numbers to PDF headers or footers.',
    description:
      'Stamp crisp page numbers across a PDF with choice of 6 corner/center placements, font size, starting number, label format, and cover-page skip.',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    iconName: 'Hash',
    popular: false,
    keywords: ['pdf page numbers', 'bates', 'footer', 'header', 'pagination', 'pdf'],
    processingMode: 'Runs locally',
    acceptedInputs: 'PDF document',
    seoTitle: 'PDF Page Numbering – Add Page Numbers to PDF Locally | ToolNova',
    seoDescription:
      'Insert customizable page numbers into PDF headers or footers with live placement preview and zero server uploads.',
    instructions: [
      'Drop your PDF file to inspect its page layout.',
      'Pick a header or footer alignment (Left, Center, Right) and numbering format.',
      'Set the starting number, font size, margin, and color while checking the live page preview.',
      'Click Download Numbered PDF to save the updated document.',
    ],
  },
  {
    id: 'pdf-watermark',
    slug: 'pdf-watermark',
    name: 'PDF Watermark',
    shortDescription: 'Stamp text or logo watermarks across PDF pages with opacity control.',
    description:
      'Overlay custom text stamps or transparent PNG/JPG logos onto every PDF page with adjustable opacity, rotation angle, scale, and tiled placement.',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    iconName: 'FileBadge',
    popular: false,
    keywords: ['pdf watermark', 'confidential', 'draft stamp', 'logo pdf', 'overlay'],
    processingMode: 'Runs locally',
    acceptedInputs: 'PDF + optional PNG/JPG logo',
    seoTitle: 'PDF Watermark – Stamp Text or Logo Watermarks Locally | ToolNova',
    seoDescription:
      'Add text or image watermarks to every page of a PDF document privately in your browser with opacity, rotation, and tiling.',
    instructions: [
      'Upload your target PDF file to load the live page preview.',
      'Choose Text Watermark or Image / Logo and configure your content.',
      'Adjust opacity, rotation angle, size, and position (including Tiled Grid).',
      'Click Export Watermarked PDF to download the stamped document.',
    ],
  },
  {
    id: 'pdf-metadata-editor',
    slug: 'pdf-metadata-editor',
    name: 'PDF Metadata Editor',
    shortDescription: 'Read and update PDF Title, Author, Subject, Keywords, and Producer.',
    description:
      'Inspect and edit standard PDF Info Dictionary fields locally while preserving every page and clearly reporting any unsupported metadata streams.',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    iconName: 'FileCog',
    popular: false,
    keywords: ['pdf metadata', 'pdf properties', 'author', 'title', 'keywords', 'info dictionary'],
    processingMode: 'Runs locally',
    acceptedInputs: 'PDF document',
    seoTitle: 'PDF Metadata Editor – Edit PDF Title & Author Locally | ToolNova',
    seoDescription:
      'Inspect and edit supported PDF document properties (Title, Author, Subject, Keywords) locally without altering page content.',
    instructions: [
      'Upload an unencrypted PDF to inspect its existing metadata.',
      'Update Title, Author, Subject, Keywords, Creator, or Producer.',
      'Review the Unsupported Metadata Fields notice for read-only XMP or custom keys.',
      'Click Save & Download PDF to export with preserved document pages.',
    ],
  },
  {
    id: 'pdf-page-size-changer',
    slug: 'pdf-page-size-changer',
    name: 'PDF Page Size Changer',
    shortDescription: 'Resize PDF pages to A4, A3, US Letter, or Legal in Portrait or Landscape.',
    description:
      'Standardize mixed or irregular PDF page dimensions onto A4, A3, US Letter, or US Legal sheets with aspect-preserving scaling or centering.',
    category: 'pdf',
    categoryLabel: 'PDF Tools',
    iconName: 'Scaling',
    popular: false,
    keywords: ['pdf resize', 'a4', 'a3', 'letter', 'legal', 'page size', 'paper size'],
    processingMode: 'Runs locally',
    acceptedInputs: 'PDF document',
    seoTitle: 'PDF Page Size Changer – Convert PDF to A4, A3, Letter, Legal | ToolNova',
    seoDescription:
      'Change PDF page dimensions to A4, A3, US Letter, or Legal in Portrait or Landscape orientation locally in your browser.',
    instructions: [
      'Upload your PDF document to inspect its page count.',
      'Select A4, A3, US Letter, or US Legal and choose Portrait or Landscape.',
      'Choose how existing content fits onto the new page (Scale to Fit, Center, or Stretch).',
      'Click Export to download the standardized PDF.',
    ],
  },
  {
    id: 'code-minifier',
    slug: 'code-minifier',
    name: 'Code Minifier',
    shortDescription: 'Minify HTML, CSS, and JavaScript statically with byte-savings metrics.',
    description:
      'Compress HTML, CSS, and JavaScript files cleanly in your browser with static bracket/quote checking and byte-savings comparison. Submitted code is never executed.',
    category: 'developer',
    categoryLabel: 'Developer Tools',
    iconName: 'FileCode',
    popular: false,
    keywords: ['minify', 'html', 'css', 'javascript', 'compress code', 'bytes'],
    processingMode: 'Static analysis only',
    acceptedInputs: 'HTML, CSS, or JavaScript',
    seoTitle: 'Code Minifier – Minify HTML, CSS & JavaScript Safely | ToolNova',
    seoDescription:
      'Minify HTML, CSS, and JavaScript locally with static syntax checking and byte savings comparison. Never executes code.',
    instructions: [
      'Select HTML, CSS, or JavaScript at the top of the workspace.',
      'Paste your source code or load a sample snippet.',
      'Inspect original vs. minified byte size and any static syntax warnings.',
      'Copy the minified output or download a .min file.',
    ],
  },
  {
    id: 'code-beautifier',
    slug: 'code-beautifier',
    name: 'Code Beautifier',
    shortDescription: 'Format and indent HTML, CSS, and JavaScript with custom spacing.',
    description:
      'Turn compressed or messy HTML, CSS, and JavaScript into clean, readable code with configurable 2-space, 4-space, or tab indentation.',
    category: 'developer',
    categoryLabel: 'Developer Tools',
    iconName: 'IndentIncrease',
    popular: false,
    keywords: ['beautify', 'format code', 'pretty print', 'indent', 'html', 'css', 'javascript'],
    processingMode: 'Instant',
    acceptedInputs: 'HTML, CSS, or JavaScript',
    seoTitle: 'Code Beautifier – Format HTML, CSS & JavaScript Online | ToolNova',
    seoDescription:
      'Beautify and indent minified HTML, CSS, and JavaScript code in your browser with 2-space, 4-space, or tab settings.',
    instructions: [
      'Choose HTML, CSS, or JavaScript and select 2 Spaces, 4 Spaces, or Tabs.',
      'Paste your unformatted or minified code into the left panel.',
      'Copy the indented output or save it directly to a file.',
    ],
  },
  {
    id: 'css-gradient-generator',
    slug: 'css-gradient-generator',
    name: 'CSS Gradient Generator',
    shortDescription: 'Build linear, radial, and conic CSS gradients with live preview.',
    description:
      'Design smooth multi-stop linear, radial, and conic gradients with custom angles, focal positions, stop sliders, and one-click CSS export.',
    category: 'developer',
    categoryLabel: 'Developer Tools',
    iconName: 'Palette',
    popular: false,
    keywords: ['css', 'gradient', 'linear-gradient', 'radial-gradient', 'conic-gradient', 'colors'],
    processingMode: 'Instant',
    acceptedInputs: 'Gradient stops & angles',
    seoTitle: 'CSS Gradient Generator – Linear, Radial & Conic CSS | ToolNova',
    seoDescription:
      'Create custom linear, radial, and conic CSS gradients with multi-stop controls, live preview, and instant CSS copy.',
    instructions: [
      'Pick Linear, Radial, or Conic gradient mode.',
      'Adjust the angle slider, radial shape, or center focal position.',
      'Add, remove, or drag color stops along the 0%–100% track.',
      'Click Copy CSS to grab the production-ready background rules.',
    ],
  },
  {
    id: 'color-palette-generator',
    slug: 'color-palette-generator',
    name: 'Color Palette Generator',
    shortDescription: 'Generate harmonious color palettes with lockable swatches and CSS/JSON export.',
    description:
      'Create 5-color palettes using analogous, monochromatic, complementary, triadic, split-complementary, or random harmonies with HEX, RGB, and HSL values.',
    category: 'developer',
    categoryLabel: 'Developer Tools',
    iconName: 'SwatchBook',
    popular: false,
    keywords: ['color palette', 'color scheme', 'hex', 'rgb', 'css variables', 'harmony'],
    processingMode: 'Instant',
    acceptedInputs: 'Base HEX & harmony rule',
    seoTitle: 'Color Palette Generator – HEX, RGB & CSS Export | ToolNova',
    seoDescription:
      'Generate harmonious color palettes from any base color, lock favorite swatches, copy HEX/RGB codes, and export CSS or JSON.',
    instructions: [
      'Choose a base color and harmony rule (Analogous, Monochromatic, Complementary, Triadic, or Random).',
      'Lock individual color swatches you want to keep while clicking Generate for new combinations.',
      'Click any HEX or RGB button to copy that swatch, or export CSS variables / JSON.',
    ],
  },
  {
    id: 'html-entity-encoder-decoder',
    slug: 'html-entity-encoder-decoder',
    name: 'HTML Entity Encoder/Decoder',
    shortDescription: 'Encode special HTML characters or decode named and numeric entities.',
    description:
      'Convert reserved HTML characters and non-ASCII symbols into safe entities (&lt;, &amp;, &#code;) or decode entities back to readable text.',
    category: 'developer',
    categoryLabel: 'Developer Tools',
    iconName: 'Code2',
    popular: false,
    keywords: ['html entities', 'escape html', 'unescape', 'encode', 'decode', 'xss safe'],
    processingMode: 'Instant',
    acceptedInputs: 'HTML or entity text',
    seoTitle: 'HTML Entity Encoder & Decoder – Safe Character Escaping | ToolNova',
    seoDescription:
      'Encode special characters and non-ASCII text into HTML entities or decode named, decimal, and hex entities cleanly.',
    instructions: [
      'Choose Encode (HTML → Entities) or Decode (Entities → Text).',
      'Optionally toggle non-ASCII encoding for accents and typographic symbols.',
      'Paste your input and click Copy Output or Swap to reverse direction.',
    ],
  },
  {
    id: 'emi-calculator',
    slug: 'emi-calculator',
    name: 'EMI Calculator',
    shortDescription: 'Calculate monthly loan EMI, total interest, and yearly amortization.',
    description:
      'Compute monthly Equated Monthly Installments (EMI) from principal, annual interest rate, and tenure in years or months with an amortization summary table.',
    category: 'utility',
    categoryLabel: 'Calculators & QR',
    iconName: 'Landmark',
    popular: false,
    keywords: ['emi', 'loan', 'mortgage', 'interest', 'amortization', 'monthly payment'],
    processingMode: 'Instant',
    acceptedInputs: 'Principal, rate, tenure',
    seoTitle: 'EMI Calculator – Loan Monthly Payment & Amortization | ToolNova',
    seoDescription:
      'Calculate monthly loan EMI, total interest payable, principal vs. interest split, and yearly amortization schedules.',
    instructions: [
      'Select your preferred currency symbol and enter the Loan Principal amount.',
      'Enter the Annual Interest Rate (%) and Loan Tenure in Years or Months.',
      'Review monthly EMI, principal-to-interest ratio bar, and the yearly amortization table.',
    ],
  },
  {
    id: 'compound-interest-calculator',
    slug: 'compound-interest-calculator',
    name: 'Compound Interest Calculator',
    shortDescription: 'Project investment growth with compounding frequency and monthly deposits.',
    description:
      'Calculate future investment balance and total interest earned across annual, semi-annual, quarterly, monthly, or daily compounding with optional monthly contributions.',
    category: 'utility',
    categoryLabel: 'Calculators & QR',
    iconName: 'TrendingUp',
    popular: false,
    keywords: ['compound interest', 'investment', 'savings', 'apy', 'compounding', 'growth'],
    processingMode: 'Instant',
    acceptedInputs: 'Principal, deposits, rate, years',
    seoTitle: 'Compound Interest Calculator – Growth & Deposit Schedule | ToolNova',
    seoDescription:
      'Calculate compound interest growth over time with configurable compounding frequency and optional monthly contributions.',
    instructions: [
      'Enter your Initial Investment and optional Monthly Contribution amount.',
      'Set the Annual Interest Rate (%), duration in Years, and Compounding Frequency.',
      'Inspect the projected Future Balance, Total Interest Earned, and year-by-year table.',
    ],
  },
  {
    id: 'gst-calculator',
    slug: 'gst-calculator',
    name: 'GST Calculator',
    shortDescription: 'Compute GST-inclusive and GST-exclusive totals with CGST/SGST split.',
    description:
      'Add Goods & Services Tax onto a net price or extract embedded GST from an inclusive total at any custom rate, with optional 50/50 CGST & SGST breakdown.',
    category: 'utility',
    categoryLabel: 'Calculators & QR',
    iconName: 'Receipt',
    popular: false,
    keywords: ['gst', 'tax calculator', 'cgst', 'sgst', 'inclusive', 'exclusive', 'vat'],
    processingMode: 'Instant',
    acceptedInputs: 'Amount & tax percentage',
    seoTitle: 'GST Calculator – Exclusive, Inclusive & CGST/SGST Split | ToolNova',
    seoDescription:
      'Calculate GST-exclusive additions or GST-inclusive extractions at any percentage rate with optional CGST and SGST breakdown.',
    instructions: [
      'Choose GST Exclusive (add tax to base price) or GST Inclusive (extract tax from total).',
      'Enter your amount and select a quick rate preset or type any custom tax rate.',
      'Toggle the 50/50 CGST & SGST split if needed and copy the itemized breakdown.',
    ],
  },
  {
    id: 'discount-calculator',
    slug: 'discount-calculator',
    name: 'Discount Calculator',
    shortDescription: 'Calculate sale price, total savings, and optional tax after discount.',
    description:
      'Find exact final prices and total dollar savings from an original sticker price and discount percentage, with optional post-discount sales tax.',
    category: 'utility',
    categoryLabel: 'Calculators & QR',
    iconName: 'Tag',
    popular: false,
    keywords: ['discount', 'sale price', 'savings', 'percent off', 'shopping', 'retail'],
    processingMode: 'Instant',
    acceptedInputs: 'Price & discount %',
    seoTitle: 'Discount Calculator – Final Sale Price & Total Savings | ToolNova',
    seoDescription:
      'Compute discounted prices, total savings, and optional post-discount sales tax instantly in your browser.',
    instructions: [
      'Enter the Original Price and choose a quick discount button or custom percentage.',
      'Optionally add a Sales Tax (%) applied to the discounted price.',
      'View Final Price and Total Savings immediately, or copy the summary.',
    ],
  },
  {
    id: 'date-calculator',
    slug: 'date-calculator',
    name: 'Date Calculator',
    shortDescription: 'Compute exact duration between dates or add and subtract days.',
    description:
      'Measure exact years, months, days, weeks, and weekdays between any two calendar dates, or add/subtract days from a chosen starting date.',
    category: 'utility',
    categoryLabel: 'Calculators & QR',
    iconName: 'CalendarDays',
    popular: false,
    keywords: ['date calculator', 'days between dates', 'add days', 'subtract days', 'calendar'],
    processingMode: 'Instant',
    acceptedInputs: 'Calendar dates & days',
    seoTitle: 'Date Calculator – Date Difference & Add/Subtract Days | ToolNova',
    seoDescription:
      'Calculate the exact duration between two calendar dates or add and subtract days with strict calendar validation.',
    instructions: [
      'Switch between Difference Between Dates and Add / Subtract Days.',
      'Pick valid calendar dates or enter a day offset.',
      'Review exact years, months, total days, weekdays, or resulting weekday and copy.',
    ],
  },
  {
    id: 'markdown-editor',
    slug: 'markdown-editor',
    name: 'Markdown Editor',
    shortDescription: 'Write Markdown with sanitized live HTML preview and .md/.html export.',
    description:
      'Draft GitHub-Flavored Markdown with quick formatting helpers, DOMPurify-sanitized live HTML preview, clipboard copy, and .md or standalone .html download.',
    category: 'productivity',
    categoryLabel: 'Productivity',
    iconName: 'FileEdit',
    popular: true,
    keywords: ['markdown', 'md editor', 'preview', 'html export', 'gfm', 'notes'],
    processingMode: 'Sanitized locally',
    acceptedInputs: 'Markdown text',
    seoTitle: 'Markdown Editor – Live Sanitized Preview & HTML Export | ToolNova',
    seoDescription:
      'Edit Markdown with a formatting toolbar, XSS-sanitized live HTML preview, and one-click .md or standalone .html export.',
    instructions: [
      'Write or paste Markdown in the left editor, or use the quick formatting toolbar.',
      'Review headings, tables, code blocks, and links in the sanitized live preview.',
      'Copy raw Markdown or sanitized HTML, or download .md / standalone .html files.',
    ],
  },
  {
    id: 'lorem-ipsum-generator',
    slug: 'lorem-ipsum-generator',
    name: 'Lorem Ipsum Generator',
    shortDescription: 'Generate custom paragraphs, sentences, or words of placeholder text.',
    description:
      'Create clean Latin Lorem Ipsum copy for UI mockups, typography layouts, and editorial wireframes in exact paragraph, sentence, or word counts.',
    category: 'productivity',
    categoryLabel: 'Productivity',
    iconName: 'AlignLeft',
    popular: false,
    keywords: ['lorem ipsum', 'placeholder text', 'dummy text', 'mockup', 'paragraphs'],
    processingMode: 'Instant',
    acceptedInputs: 'Unit type & count',
    seoTitle: 'Lorem Ipsum Generator – Words, Sentences & Paragraphs | ToolNova',
    seoDescription:
      'Generate custom lengths of Lorem Ipsum placeholder text in paragraphs, sentences, or words with one-click copy and download.',
    instructions: [
      'Choose Paragraphs, Sentences, or Words and set your desired count.',
      'Toggle whether to begin with the classic "Lorem ipsum dolor sit amet..." opening.',
      'Click Copy Text or Save .txt to use the generated copy in your design.',
    ],
  },
  {
    id: 'random-number-generator',
    slug: 'random-number-generator',
    name: 'Random Number Generator',
    shortDescription: 'Draw single or unique random integers using Web Crypto entropy.',
    description:
      'Generate unbiased random integers within custom minimum and maximum bounds using window.crypto.getRandomValues, with optional uniqueness and sorting.',
    category: 'productivity',
    categoryLabel: 'Productivity',
    iconName: 'Dices',
    popular: false,
    keywords: ['random number', 'rng', 'dice', 'lottery', 'crypto random', 'unique integers'],
    processingMode: 'Zero storage',
    acceptedInputs: 'Min, max, quantity',
    seoTitle: 'Random Number Generator – Unbiased Web Crypto RNG | ToolNova',
    seoDescription:
      'Generate single or multiple unbiased random integers using cryptographic browser randomness with optional uniqueness and sorting.',
    instructions: [
      'Enter integer Minimum and Maximum bounds and the Quantity (1–500).',
      'Toggle "Require unique numbers" to draw without repeats when the range allows.',
      'Click Generate Numbers and tap any result chip or Copy All.',
    ],
  },
  {
    id: 'stopwatch',
    slug: 'stopwatch',
    name: 'Stopwatch',
    shortDescription: 'Track elapsed time accurately with monotonic timing and lap splits.',
    description:
      'Measure workouts, study blocks, and benchmarks with drift-free performance.now() monotonic timing, start/pause/reset controls, and copyable lap splits.',
    category: 'productivity',
    categoryLabel: 'Productivity',
    iconName: 'Timer',
    popular: false,
    keywords: ['stopwatch', 'lap timer', 'chronometer', 'elapsed time', 'splits'],
    processingMode: 'Monotonic clock',
    acceptedInputs: 'Start, pause, lap, reset',
    seoTitle: 'Online Stopwatch – Accurate Lap Splits & Monotonic Timing | ToolNova',
    seoDescription:
      'Accurate browser stopwatch using monotonic timing with lap split recording, pause/resume, and clipboard lap export.',
    instructions: [
      'Click Start to begin counting elapsed time with centisecond precision.',
      'Press Lap at any checkpoint to record split duration and cumulative time.',
      'Pause, resume, copy your lap table, or click Reset to zero the clock.',
    ],
  },
  {
    id: 'countdown-timer',
    slug: 'countdown-timer',
    name: 'Countdown Timer',
    shortDescription: 'Run accurate timers across tabs with optional chime and browser alerts.',
    description:
      'Set hours, minutes, and seconds or quick Pomodoro presets with background-tab-accurate target timestamps, pause/resume, and permission-respecting alerts.',
    category: 'productivity',
    categoryLabel: 'Productivity',
    iconName: 'Hourglass',
    popular: false,
    keywords: ['countdown', 'timer', 'pomodoro', 'alarm', 'focus timer', 'minutes'],
    processingMode: 'Wall-clock target',
    acceptedInputs: 'Hours, minutes, seconds',
    seoTitle: 'Countdown Timer – Accurate Focus & Alarm Timer | ToolNova',
    seoDescription:
      'Run reliable countdown timers in your browser with Pomodoro presets, pause/resume, optional chime, and permission-gated alerts.',
    instructions: [
      'Pick a quick preset (1 to 45 minutes) or enter custom Hours, Minutes, and Seconds.',
      'Click Start Timer—remaining time stays accurate even if you switch tabs.',
      'Optionally toggle sound chime or enable browser notifications for completion alerts.',
    ],
  },
];

export const POPULAR_TOOLS = TOOLS_REGISTRY.filter((t) => t.popular);

export function getToolBySlug(slug: string | undefined): ToolDefinition | undefined {
  if (!slug) return undefined;
  return TOOLS_REGISTRY.find((t) => t.slug === slug);
}

export const HOMEPAGE_FAQS: FaqItem[] = [
  {
    question: 'Do my images or PDF documents get uploaded to a server?',
    answer:
      'No. All 50 utilities process your text, images, QR codes, code snippets, calculators, passwords, and PDFs directly inside your browser using native Canvas, Web Crypto, and local PDF engines. Your files remain on your device.',
  },
  {
    question: 'Are generated passwords saved in browser history or LocalStorage?',
    answer:
      'Never. The Password Generator reads randomness from window.crypto.getRandomValues and keeps the generated string strictly in temporary memory until you close or clear the page.',
  },
  {
    question: 'Why does ToolNova offer a Free and Premium plan?',
    answer:
      'All core tools are free with standard processing and downloads. Our upcoming Premium tier is designed for power users who want batch workflows, saved presets, and an ad-free workspace once secure billing launches.',
  },
  {
    question: 'Does ToolNova work on Android and iOS mobile browsers?',
    answer:
      'Yes. Every tool layout is responsive and touch-friendly, tested for Chrome on Android and Safari on iOS, including file picking, previews, and direct downloads.',
  },
  {
    question: 'What happens if I upload an unsupported or corrupted file?',
    answer:
      'Each file tool checks file extensions, MIME types, and size limits before processing, showing an immediate, readable error message if a file cannot be parsed.',
  },
];
