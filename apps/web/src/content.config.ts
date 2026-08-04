import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { publishedListSchema } from "./domain/schemas";

const lists = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx,json,yaml,yml}", base: "./src/content/lists" }),
  schema: publishedListSchema,
});

export const collections = { lists };
