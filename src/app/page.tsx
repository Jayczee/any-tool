import Link from 'next/link';

const tools = [
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Clean up your messy JSON with zero lag.',
    type: 'frontend',
    category: 'Dev Tools',
    color: 'var(--accent)'
  },
  {
    id: 'image-optimizer',
    name: 'Image Crusher',
    description: 'Bulk compress images using server-side magic.',
    type: 'fullstack',
    category: 'Media',
    color: 'var(--secondary)'
  },
  {
    id: 'regex-tester',
    name: 'Regex Lab',
    description: 'Test your regex patterns in real-time.',
    type: 'frontend',
    category: 'Dev Tools',
    color: '#0070f3'
  }
];

export default function Home() {
  return (
    <main style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '6rem', position: 'relative' }}>
        <h1 style={{ fontSize: 'clamp(3rem, 10vw, 8rem)', lineHeight: '0.9', marginBottom: '1rem' }}>
          ANY<br /><span style={{ color: 'var(--accent)' }}>TOOL</span>
        </h1>
        <p style={{ fontSize: '1.5rem', maxWidth: '600px', fontWeight: '500' }}>
          A collection of high-impact, production-grade tools for modern builders. 
          No fluff, just utility.
        </p>
        
        <div style={{ 
          position: 'absolute', 
          top: '0', 
          right: '0', 
          width: '150px', 
          height: '150px', 
          background: 'var(--secondary)', 
          border: 'var(--border-width) solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'rotate(15deg)',
          fontWeight: '800',
          fontSize: '1.2rem',
          textAlign: 'center'
        }}>
          BETA 0.1
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2.5rem' }}>
        {tools.map((tool) => (
          <Link key={tool.id} href={`/tools/${tool.id}`} style={{ display: 'block' }}>
            <div className="brutalist-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ 
                fontSize: '0.8rem', 
                fontWeight: '800', 
                textTransform: 'uppercase', 
                color: tool.color,
                marginBottom: '1rem' 
              }}>
                {tool.category} // {tool.type}
              </div>
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{tool.name}</h2>
              <p style={{ marginBottom: '2rem', flexGrow: 1, opacity: 0.8 }}>{tool.description}</p>
              <div className="brutalist-button" style={{ textAlign: 'center', alignSelf: 'flex-start' }}>
                Launch
              </div>
            </div>
          </Link>
        ))}
      </section>

      <footer style={{ marginTop: '10rem', padding: '4rem 0', borderTop: 'var(--border-width) solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h3 style={{ fontSize: '2rem' }}>ANY-TOOL</h3>
            <p>© 2026 BUILT FOR SPEED</p>
          </div>
          <div style={{ display: 'flex', gap: '2rem', fontWeight: '700' }}>
            <a href="#">GITHUB</a>
            <a href="#">TWITTER</a>
            <a href="#">DOCS</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
