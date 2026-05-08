import { z } from 'zod';

// TODO: Add PoE2 back in a future iteration once we ship dedicated support for it.
export const GameSchema = z.literal('poe1');
export type Game = z.infer<typeof GameSchema>;

export const POE1_LEAGUES = ['Mirage', 'Hardcore Mirage', 'Standard', 'Hardcore'] as const;
export const DEFAULT_POE1_LEAGUE = 'Mirage';
