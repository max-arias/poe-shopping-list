import { z } from "zod";

export const GameSchema = z.enum(["poe1", "poe2"]);
export type Game = z.infer<typeof GameSchema>;

export const POE1_LEAGUES = ["Mirage", "Hardcore Mirage", "Standard", "Hardcore"] as const;
export const POE2_LEAGUES = [
  "Fate of the Vaal",
  "Hardcore Fate of the Vaal",
  "Standard",
  "Hardcore",
] as const;
export const DEFAULT_POE1_LEAGUE = "Mirage";
export const DEFAULT_POE2_LEAGUE = "Fate of the Vaal";
