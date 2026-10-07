import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { categories, parseHtml, renderTopic } from './topic-utils.mjs';

const root = process.cwd();
const documents = new Map();
let count = 0;
for (const category of categories) {
  const directory = path.join(root, category);
  const topics = JSON.parse(await fs.readFile(path.join(directory, 'assets/topics.json'), 'utf8'));
  const htmlFiles = [category === 'gen-ai-topics' ? 'genai-handbook.html' : 'system-design-handbook.html'];
  for (const topic of topics) {
    const markdown = await fs.readFile(path.join(directory, 'lessons', `${topic.stem}.md`), 'utf8');
    const source = renderTopic(markdown);
    const file = path.join(directory, 'lessons', `${topic.stem}.html`);
    const html = parseHtml(await fs.readFile(file, 'utf8'));
    const text = doc => Array.from(doc.querySelectorAll('pre code')).map(node => node.textContent);
    assert.deepEqual(text(html), text(source), `${topic.stem}: code blocks changed`);
    assert.ok(source.querySelectorAll('img').length, `${topic.stem}: diagram missing`);
    documents.set(path.join(directory, 'lessons', `${topic.stem}.md`), source);
    htmlFiles.push(`lessons/${topic.stem}.html`);
    count++;
  }
  for (const file of htmlFiles) documents.set(path.join(directory, file), parseHtml(await fs.readFile(path.join(directory, file), 'utf8')));
  documents.set(path.join(directory, 'README.md'), renderTopic(await fs.readFile(path.join(directory, 'README.md'), 'utf8')));
}
for (const file of ['README.md', 'CONTRIBUTING.md']) documents.set(path.join(root, file), renderTopic(await fs.readFile(path.join(root, file), 'utf8')));

for (const [file, doc] of documents) {
  const ids = Array.from(doc.querySelectorAll('[id]')).map(node => node.id);
  assert.equal(new Set(ids).size, ids.length, `${file}: duplicate anchors`);
  for (const node of Array.from(doc.querySelectorAll('a[href],img[src],link[href]'))) {
    const href = node.getAttribute('href') || node.getAttribute('src');
    if (!href || /^(?:[a-z]+:|\/\/)/i.test(href)) continue;
    const [relative, anchor] = href.split('#');
    const target = relative ? path.resolve(path.dirname(file), decodeURIComponent(relative)) : file;
    await fs.access(target).catch(() => { throw new Error(`${file}: missing ${href}`); });
    if (anchor && documents.has(target)) {
      const matches = Array.from(documents.get(target).querySelectorAll('[id]')).some(node => node.id === decodeURIComponent(anchor));
      assert.ok(matches, `${file}: missing anchor ${href}`);
    }
  }
}
console.log(`Checked ${count} Markdown/HTML pairs, code fidelity, diagrams, indexes and local links.`);
