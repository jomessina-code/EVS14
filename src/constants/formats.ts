import type { Format } from '../types';

export interface FormatDefinition {
  id: Format;
  label: string;
  ratio: number;
  description: string;
  dimensions: string;
}

export const DECLINATION_FORMATS: FormatDefinition[] = [
  { id: "1:1 (Carré)", label: "Carré", ratio: 1, description: "1:1", dimensions: "1024x1024px" },
  { id: "A3 / A2 (Vertical)", label: "Affiche", ratio: 2 / 3, description: "2:3", dimensions: "682x1024px" },
  { id: "4:5 (Vertical)", label: "Portrait", ratio: 4 / 5, description: "4:5", dimensions: "819x1024px" },
  { id: "16:9 (Paysage)", label: "Paysage", ratio: 16 / 9, description: "16:9", dimensions: "1024x576px" },
  { id: "9:16 (Story)", label: "Story", ratio: 9 / 16, description: "9:16", dimensions: "576x1024px" },
  { id: "3:1 (Bannière)", label: "Bannière", ratio: 3 / 1, description: "3:1", dimensions: "1024x341px" },
];