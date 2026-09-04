import { unified } from "unified";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";

const schema = {
  ...defaultSchema,
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https"],
  },
  attributes: {
    ...defaultSchema.attributes,
    a: ["href", "target", "rel"],
  },
};

const processor = unified()
  .use(remarkParse)
  // Do not enable allowDangerousHtml: raw HTML nodes must never enter HAST.
  .use(remarkRehype)
  .use(rehypeSanitize, schema)
  .use(rehypeStringify);

export function renderOverviewMarkdown(value: string): string {
  const tree = processor.parse(value);
  const sanitized = processor.runSync(tree) as unknown as MarkdownNode;
  addExternalLinkBehavior(sanitized);
  return String(processor.stringify(sanitized as never));
}

type MarkdownNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: MarkdownNode[];
};

function addExternalLinkBehavior(node: MarkdownNode) {
  if (
    node.type === "element" &&
    node.tagName === "a" &&
    typeof node.properties?.href === "string"
  ) {
    const href = node.properties.href;
    if (href.startsWith("http://") || href.startsWith("https://")) {
      node.properties.target = "_blank";
      node.properties.rel = "noopener noreferrer";
    }
  }
  node.children?.forEach(addExternalLinkBehavior);
}
