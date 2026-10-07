# Learning

Practical engineering lessons organized by category. Each category has its own index, individual lessons, and supporting illustrations.

| Category | Collection |
| --- | --- |
| [Generative AI](gen-ai-topics/README.md) | Agents, retrieval, prompts, evaluation, and production AI systems |
| [System design](system-design-docs/README.md) | Scaling, databases, reliability, performance, and architecture |

## Organization

```text
gen-ai-topics/
  README.md
  lessons/
  assets/
system-design-docs/
  README.md
  lessons/
  assets/
```

Every topic has a Markdown source and a generated HTML edition in `lessons/`. The category indexes link to Markdown so you can read directly on GitHub without cloning. Both editions use the same diagram assets.

Each category also includes a combined HTML handbook for browsing the collection. Download the category with its assets to read HTML locally; GitHub normally displays HTML source rather than the rendered lesson.

## Edit and rebuild

Use Node.js 20 or later. Dependencies run only during the build; generated HTML works offline.

```sh
npm ci
npm run build
npm test
```

Edit the `.md` files, not the generated HTML. See [CONTRIBUTING.md](CONTRIBUTING.md) for adding topics and preserving diagrams and references.

Automatic GitHub publishing is not configured yet.

Lessons contain illustrative examples, exercises, and links to references. Archived Generative AI material is labeled in its handbook; it has not all been checked against current documentation.
