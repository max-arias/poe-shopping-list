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
};

const processor = unified()
  .use(remarkParse)
  // Do not enable allowDangerousHtml: raw HTML nodes must never enter HAST.
  .use(remarkRehype)
  .use(rehypeSanitize, schema)
  .use(rehypeStringify);

export function renderOverviewMarkdown(value: string): string {
  const tree = processor.parse(value);
  return String(processor.stringify(processor.runSync(tree)));
}
