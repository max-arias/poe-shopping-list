import { z } from "zod";

export const ItemKindSchema = z.enum(["unique", "rare", "gem", "flask", "jewel", "cluster", "base"]);
export type ItemKind = z.infer<typeof ItemKindSchema>;