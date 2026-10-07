import fs from 'node:fs/promises';
import path from 'node:path';
import { categories, parseHtml, renderTopic, escapeHtml, topicIndex, addSectionNavigation } from './topic-utils.mjs';

const root = process.cwd();
for (const category of categories) {
  const directory = path.join(root, category);
  const topics = JSON.parse(await fs.readFile(path.join(directory, 'assets/topics.json'), 'utf8'));
  const handbookName = category === 'gen-ai-topics' ? 'genai-handbook.html' : 'system-design-handbook.html';
  const handbook = parseHtml(await fs.readFile(path.join(root, 'scripts/templates', `${category}.html`), 'utf8'));
  const embeddedStyle = handbook.querySelector('style');
  if (embeddedStyle) embeddedStyle.textContent = await fs.readFile(path.join(directory, 'assets/course.css'), 'utf8') + '\n' + await fs.readFile(path.join(directory, 'assets/handbook.css'), 'utf8');
  const reading = handbook.querySelector('.reading') || handbook.querySelector('main');
  if (new Set(topics.map(topic => topic.stem)).size !== topics.length || new Set(topics.map(topic => topic.number)).size !== topics.length) throw new Error(`${category} has duplicate topics`);
  for (const topic of topics) {
    const markdown = await fs.readFile(path.join(directory, 'lessons', `${topic.stem}.md`), 'utf8');
    const content = renderTopic(markdown);
    if (content.querySelectorAll('h1').length !== 1) throw new Error(`${topic.stem} needs exactly one title`);
    if (content.querySelector('h1').textContent.trim() !== topic.title) throw new Error(`${topic.stem} title differs from assets/topics.json`);
    addSectionNavigation(content);
    for (const anchor of Array.from(content.querySelectorAll('a[href]'))) {
      const href = anchor.getAttribute('href');
      if (/^\d{4}-[^/]+\.md(?:#.*)?$/.test(href)) anchor.setAttribute('href', href.replace('.md', '.html'));
    }
    const styles = category === 'gen-ai-topics' ? ['handbook.css'] : ['course.css', 'handbook.css'];
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(topic.title)}</title>${styles.map(css => `<link rel="stylesheet" href="../assets/${css}">`).join('')}</head><body><main class="standalone markdown-body">${content.body.innerHTML}<p><a href="${topic.stem}.md">Markdown edition</a> · <a href="../README.md">Topic index</a></p></main></body></html>\n`;
    await fs.writeFile(path.join(directory, 'lessons', `${topic.stem}.html`), html);
    const article = handbook.createElement('article');
    article.id = category === 'gen-ai-topics' ? `lesson-${Number(topic.number)}` : `lesson-${topic.number}`;
    article.className = 'chapter markdown-body';
    const combined = renderTopic(markdown, `${article.id}-`);
    for (const heading of Array.from(combined.querySelectorAll('h1,h2,h3,h4,h5'))) {
      const level = Number(heading.tagName.slice(1)) + 1;
      const replacement = combined.createElement(`h${level}`);
      replacement.id = heading.id; replacement.innerHTML = heading.innerHTML; heading.replaceWith(replacement);
    }
    addSectionNavigation(combined, 2);
    for (const node of Array.from(combined.querySelectorAll('[href],[src]'))) {
      for (const attribute of ['href', 'src']) {
        const value = node.getAttribute(attribute);
        if (!value || /^(?:[a-z]+:|\/\/|#)/i.test(value)) continue;
        node.setAttribute(attribute, value.startsWith('../') ? value.slice(3) : `lessons/${value}`);
      }
    }
    article.innerHTML = combined.body.innerHTML + `<p class="back"><a href="#contents">Contents</a> · <a href="lessons/${topic.stem}.md">Markdown edition</a></p>`;
    const appendix = reading.querySelector('#topic-index');
    if (appendix) reading.insertBefore(article, appendix); else reading.appendChild(article);
    const item = handbook.createElement('li');
    item.innerHTML = `<a href="#${article.id}">${escapeHtml(topic.title)}</a>`;
    handbook.querySelector('#contents ol').appendChild(item);
  }
  const index = handbook.querySelector('#topic-index');
  index.innerHTML += `<ul>${[...topics].sort((a, b) => a.title.localeCompare(b.title)).map(topic => `<li><a href="#lesson-${category === 'gen-ai-topics' ? Number(topic.number) : topic.number}">${escapeHtml(topic.title)}</a></li>`).join('')}</ul>`;
  const tags = [...new Set(topics.flatMap(topic => topic.tags))].sort();
  if (tags.length) index.innerHTML += `<h3>By subject</h3><dl>${tags.map(tag => `<dt>${escapeHtml(tag)}</dt><dd>${topics.filter(topic => topic.tags.includes(tag)).map(topic => `<a href="#lesson-${category === 'gen-ai-topics' ? Number(topic.number) : topic.number}">${escapeHtml(topic.title)}</a>`).join(' · ')}</dd>`).join('')}</dl>`;
  await fs.writeFile(path.join(directory, handbookName), '<!doctype html>\n' + handbook.documentElement.outerHTML + '\n');
  await fs.writeFile(path.join(directory, 'README.md'), topicIndex(category, topics));
  console.log(`Built ${category}: ${topics.length} HTML topics and handbook from Markdown`);
}
