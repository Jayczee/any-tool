export type ToolType = 'frontend' | 'fullstack';

export interface Tool {
  id: string;
  name: string;
  description: string;
  categories: string[];
  type: ToolType;
  color: string;
  tags: string[];
}

export const tools: Tool[] = [
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Clean up your messy JSON with zero lag. Formats, minifies, and validates your JSON data.',
    categories: ['dev-tools', 'formatters'],
    type: 'frontend',
    color: 'var(--accent)',
    tags: ['json', 'format', 'minify', 'validate']
  },
  {
    id: 'image-optimizer',
    name: 'Image Crusher',
    description: 'Bulk compress images using server-side magic. Reduces file size without compromising quality.',
    categories: ['media', 'optimizers'],
    type: 'fullstack',
    color: 'var(--secondary)',
    tags: ['image', 'compress', 'webp', 'jpg', 'png', 'avif', 'resize']
  },
  {
    id: 'regex-tester',
    name: 'Regex Lab',
    description: 'Test your regex patterns in real-time. Debug complex regular expressions with ease.',
    categories: ['dev-tools', 'testers'],
    type: 'frontend',
    color: '#0070f3',
    tags: ['regex', 'pattern', 'debug', 'test', 'match']
  }
];

export function getToolById(id: string): Tool | undefined {
  return tools.find(t => t.id === id);
}
