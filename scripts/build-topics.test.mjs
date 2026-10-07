import test from 'node:test';
import assert from 'node:assert/strict';
import { renderTopic, diagramSvg, topicIndex } from './topic-utils.mjs';

test('preserves code inside lists, comparisons, quotes and nested fences', () => {
  const source = '# Example\n\n1. A step\n\n   ````js\n   if (a < b && value === "x") {\n     console.log(````);\n   }\n   ````\n';
  const code = renderTopic(source).querySelector('pre code');
  assert.equal(code.textContent.trim(), 'if (a < b && value === "x") {\n  console.log(````);\n}');
});

test('keeps exercise answers and references inside details', () => {
  const doc = renderTopic('# Topic\n\n<details>\n<summary>Answer</summary>\n\nUse **validation**. [Source](https://example.com/reference?a=1&b=2).\n\n</details>');
  assert.equal(doc.querySelector('details summary').textContent, 'Answer');
  assert.equal(doc.querySelector('details strong').textContent, 'validation');
  assert.equal(doc.querySelector('details a').getAttribute('href'), 'https://example.com/reference?a=1&b=2');
});

test('creates unique heading anchors and retains explicit legacy anchors', () => {
  const doc = renderTopic('# Topic\n\n## Example\n\n## Example\n\n## <a id="legacy"></a>Original\n', 'chapter-');
  const ids = Array.from(doc.querySelectorAll('[id]')).map(node => node.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes('chapter-example-1'));
  assert.ok(ids.includes('legacy'));
});

test('renders GitHub tables and escapes diagram labels', () => {
  assert.equal(renderTopic('# Topic\n\n| Field | Value |\n| --- | --- |\n| `x` | 1 |').querySelectorAll('table').length, 1);
  const svg = diagramSvg([[['A < B', 'x & y'], ['Reply', 'complete']]]);
  assert.ok(svg.includes('A &lt; B'));
  assert.ok(svg.includes('x &amp; y'));
  assert.ok(!svg.includes('A < B'));
});

test('category indexes link to Markdown and HTML without retired output links', () => {
  for (const category of ['gen-ai-topics', 'system-design-topics']) {
    const markdown = topicIndex(category, [{number:'0001', stem:'0001-example', title:'Example'}]);
    assert.ok(markdown.includes('lessons/0001-example.md'));
    assert.ok(markdown.includes('lessons/0001-example.html'));
    assert.ok(!/pdf/i.test(markdown));
  }
});
