import fs from 'node:fs/promises';
import path from 'node:path';
import Turndown from 'turndown';
import gfm from 'turndown-plugin-gfm';
import { categories, parseHtml, diagramSvg, escapeHtml } from './topic-utils.mjs';

const root = process.cwd();
const converter = new Turndown({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
converter.use(gfm.gfm);
converter.addRule('summary', { filter: 'summary', replacement: () => '' });
converter.addRule('details', {
  filter: 'details',
  replacement(content, node) { return `\n\n<details>\n<summary>${escapeHtml(node.querySelector('summary')?.textContent || 'Details')}</summary>\n\n${content.trim()}\n\n</details>\n\n`; }
});

await fs.mkdir(path.join(root, 'scripts/templates'), { recursive: true });
for (const category of categories) {
  const directory = path.join(root, category);
  const manifestPath = path.join(directory, 'assets/topics.json');
  let migrated = false;
  try { await fs.access(manifestPath); migrated = true; }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const specs = category === 'system-design-docs' ? JSON.parse(await fs.readFile(path.join(directory, 'assets/lesson-diagrams.json'), 'utf8')) : {};
  const files = (await fs.readdir(path.join(directory, 'lessons'))).filter(name => /^\d{4}-.*\.html$/.test(name)).sort();
  const manifest = [];
  await fs.mkdir(path.join(directory, 'assets/diagrams'), { recursive: true });
  for (const name of files) {
    if (migrated) break;
    const stem = name.slice(0, -5), number = stem.slice(0, 4);
    const source = parseHtml(await fs.readFile(path.join(directory, 'lessons', name), 'utf8'));
    const main = source.querySelector('main');
    const heading = main.querySelector('h1');
    for (const node of main.querySelectorAll('nav,.section-nav,.back,.chapter-number')) node.remove();
    const title = heading.textContent.trim();
    const meta = main.querySelector('.meta');
    if (meta) meta.innerHTML = Array.from(meta.children).map(node => escapeHtml(node.textContent.trim())).join(' · ');
    const figure = main.querySelector('figure.diagram');
    const rows = figure ? [Array.from(figure.querySelectorAll('.flow li')).map(node => [node.querySelector('strong').textContent, node.querySelector('span').textContent])] : specs[number].rows;
    const caption = figure ? figure.querySelector('figcaption').textContent : specs[number].caption;
    const alt = rows.map(row => row.map(([label, detail]) => `${label}: ${detail}`).join(' → ')).join('; ');
    const diagram = source.createElement('div');
    diagram.innerHTML = `<p><img src="../assets/diagrams/${stem}.svg" alt="${escapeHtml(alt)}"></p><p>${escapeHtml(caption)}</p>`;
    if (figure) figure.replaceWith(diagram); else heading.parentNode.insertBefore(diagram, heading.nextSibling);
    // Preserve explicit section anchors used by cross-links in the original lessons.
    for (const node of main.querySelectorAll('h2[id],h3[id],h4[id]')) node.innerHTML = `<a id="${escapeHtml(node.id)}"></a>` + node.innerHTML;
    converter.addRule('sectionAnchor', { filter: node => node.nodeName === 'A' && node.hasAttribute('id') && !node.hasAttribute('href'), replacement: (_content, node) => `<a id="${escapeHtml(node.id)}"></a>` });
    for (const link of main.querySelectorAll('a[href]')) {
      const href = link.getAttribute('href');
      if (/^\d{4}-[^/]+\.html(?:#.*)?$/.test(href)) link.setAttribute('href', href.replace('.html', '.md'));
    }
    const markdown = converter.turndown(main.innerHTML).replace(/^[ \t]+$/gm, '') + '\n';
    await fs.writeFile(path.join(directory, 'lessons', `${stem}.md`), markdown);
    await fs.writeFile(path.join(directory, 'assets/diagrams', `${stem}.svg`), diagramSvg(rows));
    manifest.push({ stem, title, number, tags: specs[number]?.tags || [], diagram: `assets/diagrams/${stem}.svg` });
  }
  if (!migrated) await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  const handbookName = category === 'gen-ai-topics' ? 'genai-handbook.html' : 'system-design-handbook.html';
  const template = parseHtml(await fs.readFile(path.join(directory, handbookName), 'utf8'));
  for (const article of Array.from(template.querySelectorAll('article'))) article.remove();
  const toc = template.querySelector('#contents ol'); if (toc) toc.innerHTML = '';
  const index = template.querySelector('#topic-index'); if (index) index.innerHTML = '<h2>Topic index</h2>';
  await fs.writeFile(path.join(root, 'scripts/templates', `${category}.html`), template.documentElement.outerHTML + '\n');
  console.log(`${migrated ? 'Kept existing sources for' : 'Migrated'} ${category}: ${files.length} Markdown sources and shared diagrams`);
}
