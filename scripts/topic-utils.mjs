import domino from '@mixmark-io/domino';
import { marked } from 'marked';

export const categories = ['gen-ai-topics', 'system-design-docs'];
export const parseHtml = html => domino.createDocument(html);
export const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export function renderTopic(markdown, prefix = '') {
  const doc = parseHtml(marked.parse(markdown, { gfm: true }));
  const usedIds = new Set(Array.from(doc.querySelectorAll('[id]')).map(node => node.id));
  for (const heading of Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6'))) {
    if (!heading.id) {
      const base = prefix + heading.textContent.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-');
      let id = base, suffix = 1;
      while (usedIds.has(id)) id = `${base}-${suffix++}`;
      heading.id = id;
      usedIds.add(id);
    }
  }
  return doc;
}

export function topicIndex(category, topics) {
  const title = category === 'gen-ai-topics' ? 'Generative AI topics' : 'System design docs';
  const handbook = category === 'gen-ai-topics' ? 'genai-handbook.html' : 'system-design-handbook.html';
  const table = topics.map(topic => `| ${topic.number} | [${topic.title.replaceAll('|', '\\|')}](lessons/${topic.stem}.md) | [HTML](lessons/${topic.stem}.html) |`).join('\n');
  const archive = category === 'gen-ai-topics' ? '\nLessons 0001-0012 contain archived material. See the handbook for coverage gaps and review status.\n' : '';
  return `# ${title}\n\nRead each topic directly on GitHub using its Markdown link. HTML editions share the same content and diagram assets.\n\n[Combined HTML handbook](${handbook}) · [Topic PDFs](pdfs/README.md)\n\n| Lesson | Read on GitHub | HTML edition |\n| --- | --- | --- |\n${table}\n${archive}\nEdit the Markdown source and run \`npm run build\` from the repository root. See [the authoring guide](../CONTRIBUTING.md). Topic PDFs and automatic publishing are not configured yet.\n`;
}

export function addSectionNavigation(doc, titleLevel = 1) {
  const title = doc.querySelector(`h${titleLevel}`);
  const sections = Array.from(doc.querySelectorAll('h2,h3,h4,h5,h6')).filter(node => Number(node.tagName.slice(1)) > titleLevel);
  const navigation = doc.createElement('details');
  navigation.className = 'section-nav';
  navigation.innerHTML = `<summary>In this lesson</summary><ul>${sections.map(node => `<li><a href="#${node.id}">${escapeHtml(node.textContent)}</a></li>`).join('')}</ul>`;
  title.parentNode.insertBefore(navigation, title.nextSibling);
}

export function diagramSvg(rows) {
  const width = 1000, gap = 24, padding = 24;
  let y = padding;
  const shapes = [];
  function wrap(text, limit) {
    const lines = [''];
    for (const word of text.split(/\s+/)) {
      const last = lines.length - 1;
      if (lines[last] && lines[last].length + word.length + 1 > limit) lines.push(word);
      else lines[last] += (lines[last] ? ' ' : '') + word;
    }
    return lines;
  }
  for (const row of rows) {
    const boxWidth = (width - padding * 2 - gap * (row.length - 1)) / row.length;
    const nodes = row.map(([title, detail]) => ({ title: wrap(title, Math.floor((boxWidth - 32) / 9)), detail: wrap(detail, Math.floor((boxWidth - 32) / 8)) }));
    const height = Math.max(...nodes.map(n => 40 + n.title.length * 24 + n.detail.length * 23));
    nodes.forEach((node, i) => {
      const x = padding + i * (boxWidth + gap);
      shapes.push(`<rect x="${x}" y="${y}" width="${boxWidth}" height="${height}" fill="${i % 2 ? '#fbeff1' : '#eef5f2'}"/>`);
      let textY = y + 28;
      for (const line of node.title) { shapes.push(`<text x="${x + 16}" y="${textY}" font-weight="600">${escapeHtml(line)}</text>`); textY += 24; }
      textY += 6;
      for (const line of node.detail) { shapes.push(`<text x="${x + 16}" y="${textY}" font-size="16">${escapeHtml(line)}</text>`); textY += 23; }
      if (i < row.length - 1) shapes.push(`<text x="${x + boxWidth + 5}" y="${y + height / 2}" aria-hidden="true">&#8594;</text>`);
    });
    y += height + gap;
  }
  const description = rows.map(row => row.map(([title, detail]) => `${title}: ${detail}`).join(' -> ')).join('; ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${y}" viewBox="0 0 ${width} ${y}" role="img" aria-labelledby="title description"><title id="title">Lesson workflow</title><desc id="description">${escapeHtml(description)}</desc><g fill="#202a29" font-family="Arial, sans-serif" font-size="18">${shapes.join('')}</g></svg>\n`;
}
