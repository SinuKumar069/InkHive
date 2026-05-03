function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value);
}

function renderInline(text: string) {
  let output = escapeHtml(text);

  output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
  output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  output = output.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    (_match, label: string, url: string) =>
      `<a href="${escapeAttribute(url)}">${label}</a>`,
  );

  return output;
}

export function markdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let inCodeBlock = false;
  let inUnorderedList = false;
  let inOrderedList = false;
  let paragraphLines: string[] = [];

  const closeParagraph = () => {
    if (paragraphLines.length === 0) {
      return;
    }
    html.push(`<p>${renderInline(paragraphLines.join(" "))}</p>`);
    paragraphLines = [];
  };

  const closeLists = () => {
    if (inUnorderedList) {
      html.push("</ul>");
      inUnorderedList = false;
    }
    if (inOrderedList) {
      html.push("</ol>");
      inOrderedList = false;
    }
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      closeParagraph();
      closeLists();
      if (inCodeBlock) {
        html.push("</code></pre>");
      } else {
        html.push("<pre><code>");
      }
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      html.push(`${escapeHtml(line)}\n`);
      continue;
    }

    if (!line.trim()) {
      closeParagraph();
      closeLists();
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      closeParagraph();
      closeLists();
      const level = headingMatch[1].length;
      html.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    const blockquoteMatch = line.match(/^>\s?(.*)$/);
    if (blockquoteMatch) {
      closeParagraph();
      closeLists();
      html.push(`<blockquote>${renderInline(blockquoteMatch[1])}</blockquote>`);
      continue;
    }

    const unorderedListMatch = line.match(/^[-*]\s+(.*)$/);
    if (unorderedListMatch) {
      closeParagraph();
      if (inOrderedList) {
        html.push("</ol>");
        inOrderedList = false;
      }
      if (!inUnorderedList) {
        html.push("<ul>");
        inUnorderedList = true;
      }
      html.push(`<li>${renderInline(unorderedListMatch[1])}</li>`);
      continue;
    }

    const orderedListMatch = line.match(/^\d+\.\s+(.*)$/);
    if (orderedListMatch) {
      closeParagraph();
      if (inUnorderedList) {
        html.push("</ul>");
        inUnorderedList = false;
      }
      if (!inOrderedList) {
        html.push("<ol>");
        inOrderedList = true;
      }
      html.push(`<li>${renderInline(orderedListMatch[1])}</li>`);
      continue;
    }

    closeLists();
    paragraphLines.push(line.trim());
  }

  closeParagraph();
  closeLists();

  if (inCodeBlock) {
    html.push("</code></pre>");
  }

  return html.join("\n");
}
