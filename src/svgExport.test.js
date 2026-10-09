import { describe, expect, it } from 'vitest';
import { createSampleProject } from './model.js';
import { escapeXml, projectToSvg } from './svgExport.js';

describe('SVG exporter', () => {
  it('escapes XML metacharacters', () => {
    expect(escapeXml(`<tag x="1">A&B's</tag>`)).toBe('&lt;tag x=&quot;1&quot;&gt;A&amp;B&apos;s&lt;/tag&gt;');
  });

  it('exports walls, symbols, dimensions, and a concept boundary', () => {
    const project = createSampleProject();
    project.metadata.title = `<script>alert('x')</script>`;
    const svg = projectToSvg(project);
    expect(svg).toContain('<svg');
    expect(svg).toContain('data-wall="wall-north"');
    expect(svg).toContain('data-symbol="network"');
    expect(svg).toContain('28.0 ft');
    expect(svg).toContain('&lt;script&gt;');
    expect(svg).not.toContain("<script>alert('x')</script>");
    expect(svg).toContain('CONCEPT DRAWING');
  });
});
