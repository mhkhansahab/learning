# Authoring lessons

## Source of truth

Each `lessons/0000-topic-name.md` file is the source for its HTML edition and chapter in the combined handbook. Edit Markdown and run `npm run build` from the repository root. Do not edit generated topic HTML or combined handbooks directly.

Category indexes are generated from `assets/topics.json`. Add an entry there when adding a lesson. Keep numbers and filenames unique, and make the Markdown H1 match the manifest title exactly.

## Add a topic

1. Add a numbered Markdown file to the appropriate category's `lessons/` folder.
2. Add its title, number, stem, tags, and diagram path to that category's `assets/topics.json`.
3. Save the diagram under `assets/diagrams/` and reference it using a relative image path from the lesson, such as `../assets/diagrams/0013-structured-outputs.svg`.
4. Include meaningful alternative text, a caption, concrete examples, references, and a practice exercise.
5. Run `npm run build` and `npm test`, then review the changed Markdown and generated HTML.

Use relative Markdown links for related topics. The builder changes these to HTML links in HTML editions. External reference URLs stay unchanged. Existing explicit section anchors are preserved for compatibility.

Use fenced code blocks with a language label when known. Keep exercise answers collapsible using native details markup with blank lines around the Markdown body:

```markdown
<details>
<summary>Suggested answer</summary>

Explain the answer here.

</details>
```

The shared diagrams are SVG image assets, with the workflow also described in alternative text. No remote scripts are required to read the generated pages.

## Templates

`scripts/templates/` holds handbook layout and appendix material. Topic content comes from Markdown. Use the shared build command from the repository root for both categories.

Scheduled GitHub pushes are not configured yet.
