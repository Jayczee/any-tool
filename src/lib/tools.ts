export type ToolType = 'frontend' | 'fullstack';

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  type: ToolType;
  color: string;
}

export const tools: Tool[] = [
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Clean up your messy JSON with zero lag. Formats, minifies, and validates your JSON data.',
    type: 'frontend',
    category: 'Dev Tools',
    color: 'var(--accent)'
  },
  {
    id: 'image-optimizer',
    name: 'Image Crusher',
    description: 'Bulk compress images using server-side magic. Reduces file size without compromising quality.',
    type: 'fullstack',
    category: 'Media',
    color: 'var(--secondary)'
  },
  {
    id: 'regex-tester',
    name: 'Regex Lab',
    description: 'Test your regex patterns in real-time. Debug complex regular expressions with ease.',
    type: 'frontend',
    category: 'Dev Tools',
    color: '#0070f3'
  }
];

export function getToolById(id: string): Tool | undefined {
  return tools.find(t => t.id === id);
}
