"""Compile lesson HTML and original diagrams into an offline reading document."""

from collections import defaultdict
from html import escape
from html.parser import HTMLParser
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}


class Element:
    def __init__(self, tag, attrs=()):
        self.tag = tag
        self.attrs = dict(attrs)
        self.children = []

    def text(self):
        return "".join(child.text() if isinstance(child, Element) else child for child in self.children)

    def render(self):
        attrs = "".join(f' {key}="{escape(value or "", quote=True)}"' for key, value in self.attrs.items())
        content = "".join(child.render() if isinstance(child, Element) else escape(child) for child in self.children)
        return f"<{self.tag}{attrs}>" + ("" if self.tag in VOID else content + f"</{self.tag}>")


class LessonParser(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.root = Element("document")
        self.stack = [self.root]
        self.feed(source)
        self.close()

    def handle_starttag(self, tag, attrs):
        node = Element(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_endtag(self, tag):
        if len(self.stack) > 1 and self.stack[-1].tag == tag:
            self.stack.pop()

    def handle_data(self, data):
        self.stack[-1].children.append(data)

    def elements(self, tag):
        def walk(node):
            if node.tag == tag:
                yield node
            for child in node.children:
                if isinstance(child, Element):
                    yield from walk(child)
        return list(walk(self.root))


def diagram_html(number, spec):
    rows = []
    for row in spec["rows"]:
        nodes = []
        for title, detail in row:
            nodes.append(f'<div class="diagram-node"><strong>{escape(title)}</strong><span>{escape(detail)}</span></div>')
        rows.append('<div class="diagram-row">' + '<span class="diagram-arrow" aria-hidden="true">&#8594;</span>'.join(nodes) + '</div>')
    return (f'<figure class="diagram" aria-labelledby="diagram-{number}">'
            f'<p class="diagram-title" id="diagram-{number}">Illustration {int(number)}: components and behavior</p>'
            + "".join(rows) + f'<figcaption>{escape(spec["caption"])}</figcaption></figure>')


def build():
    specs = json.loads((ROOT / "assets/lesson-diagrams.json").read_text())
    paths = sorted((ROOT / "lessons").glob("[0-9][0-9][0-9][0-9]-*.html"))
    if not paths:
        raise ValueError("No lesson files found")
    lessons = []
    links = {path.name: f'#lesson-{path.name[:4]}' for path in paths}
    topics = defaultdict(list)
    for path in paths:
        number = path.name[:4]
        spec = specs.get(number)
        if spec is None:
            raise ValueError(f"Add a labeled diagram and topic tags for lesson {number}")
        parser = LessonParser(path.read_text())
        mains = parser.elements("main")
        titles = parser.elements("h1")
        if len(mains) != 1 or len(titles) != 1:
            raise ValueError(f"Expected one main and one title in {path.name}")
        title = titles[0].text().strip()
        titles[0].tag = "h2"
        titles[0].attrs["class"] = "chapter-title"
        section_links = []
        for index, heading in enumerate(parser.elements("h2")):
            if heading is titles[0]:
                continue
            heading.tag = "h3"
            anchor = f"lesson-{number}-section-{index}"
            heading.attrs["id"] = anchor
            section_links.append(f'<a href="#{anchor}">{escape(heading.text().strip())}</a>')
        for anchor in parser.elements("a"):
            href = anchor.attrs.get("href", "")
            if href in links:
                anchor.attrs["href"] = links[href]
            elif href and not href.startswith(("https://", "http://", "#", "mailto:")):
                anchor.attrs["href"] = "lessons/" + href
        content = []
        for child in mains[0].children:
            content.append(child.render() if isinstance(child, Element) else escape(child))
            if child is titles[0]:
                content.append('<nav class="chapter-map" aria-label="Lesson sections">' + "".join(section_links) + '</nav>')
                content.append(diagram_html(number, spec))
                content.append('<p class="source-note">Original teaching illustration. Numerical scenarios in these lessons are illustrative, not reported company incidents. Primary sources appear at the end of each chapter.</p>')
        lessons.append((number, title, "".join(content)))
        for topic in spec["tags"]:
            topics[topic].append((number, title))

    toc = "".join(f'<li><a href="#lesson-{number}">{escape(title)}</a></li>' for number, title, _ in lessons)
    index = "".join('<div><dt>' + escape(topic) + '</dt><dd>' + "".join(
        f'<a href="#lesson-{number}">{int(number):02d}. {escape(title)}</a>' for number, title in entries
    ) + '</dd></div>' for topic, entries in sorted(topics.items()))
    chapters = []
    for i, (number, title, content) in enumerate(lessons):
        nav = ['<a href="#contents">Contents</a>', '<a href="#topic-index">Topic index</a>']
        if i:
            nav.append(f'<a href="#lesson-{lessons[i - 1][0]}">Previous lesson</a>')
        if i + 1 < len(lessons):
            nav.append(f'<a href="#lesson-{lessons[i + 1][0]}">Next lesson</a>')
        chapters.append(f'<article id="lesson-{number}" aria-label="{escape(title, quote=True)}">{content}<nav class="chapter-nav" aria-label="Chapter navigation">' + "".join(nav) + '</nav></article>')
    css = (ROOT / "assets/course.css").read_text() + "\n" + (ROOT / "assets/handbook.css").read_text()
    html = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>System design handbook</title><style>{css}</style></head>
<body><div class="book-layout">
<nav class="contents" id="contents" aria-label="Table of contents"><h2>Contents</h2><p class="muted">{len(lessons)} lessons</p><ol>{toc}</ol><a href="#topic-index">Topic index</a></nav>
<main><header><p class="eyebrow">Practical system design</p><h1>System design handbook</h1>
<p>Architecture concepts, worked examples, production trade-offs, and design exercises.</p></header>
<section id="topic-index"><h2>Topic index</h2><dl class="topic-index">{index}</dl></section>
{"".join(chapters)}</main></div></body></html>'''
    output = ROOT / "system-design-handbook.html"
    output.write_text(html)
    print(f"Built {output.name}: {len(lessons)} complete lessons, {len(lessons)} illustrations, {len(topics)} indexed topics")


if __name__ == "__main__":
    build()
