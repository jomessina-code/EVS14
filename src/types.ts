
export type GameType = "MOBA" | "FPS" | "Combat" | "Battle Royale" | "Sport" | "Multi-genre";
export type GraphicStyle = "Cyberpunk / Néon" | "Fantasy Magique" | "3D Réaliste" | "Style manga explosif" | "Minimal Sportif";
export type Ambiance = "Dramatique / sombre" | "Énergique / colorée" | "Tech / futuriste" | "Street / urbaine" | "Épique / Légendaire" | "Lumineuse / Compétitive" | "";
export type VisualElements = "Personnage central" | "Logo ou trophée" | "Duo de joueurs" | "Fond immersif";
export type Language = "français" | "anglais";

export type Format = 
  "A3 / A2 (Vertical)" | 
  "4:5 (Vertical)" | 
  "1:1 (Carré)" | 
  "16:9 (Paysage)" |
  "9:16 (Story)" |
  "3:1 (Bannière)";

export type UniverseId = "smashverse" | "arenaFPS" | "epicLegends" | "stadiumCup" | "digitalHeroes" | string;

export interface UniversePreset {
  id: UniverseId;
  label: string;
  description: string;
  gameType: GameType;
  style: GraphicStyle;
  ambiance: Ambiance;
  elements: VisualElements;
  keywords: string[];
  colorPalette: string[];
  influenceWeight: number;
  dominant: boolean;
  isCustom?: boolean;
}

export interface InspirationImage {
  base64: string;
  mimeType: string;
}

export interface EsportPromptOptions {
  gameType: GameType;
  graphicStyle: GraphicStyle;
  ambiance: Ambiance;
  visualElements: VisualElements;
  elementSize?: number;
  format: Format;
  effectsIntensity: number;
  language: Language;
  customPrompt: string;
  inspirationImage: InspirationImage | null;
  eventName: string;
  baseline: string;
  eventLocation: string;
  eventDate: string;
  textLock: boolean;
  reservePartnerZone: boolean;
  partnerZoneHeight: number;
  partnerZonePosition: 'bottom' | 'top';
  highResolution: boolean;
  hideText: boolean;
  modificationRequest?: string;
  universes: UniverseId[];
}

export interface QualityCheckResults {
  resolution: boolean;
  ratio: boolean;
  margins: boolean;
  text: boolean;
}

export interface TextStyle {
  fontFamily: string;
  color: string;
  effect: string;
}

export interface GenerationHistoryItem {
  id: string;
  timestamp: number;
  imageUrl: string;
  masterImageNoText?: string; // The text-free base image for adaptations
  options: EsportPromptOptions;
  prompt: string;
  qualityCheckResults: QualityCheckResults;
  textStyle?: TextStyle;
}

export type TextBlock = 'eventName' | 'baseline' | 'eventLocation' | 'eventDate';

export type TextConfig = {
  [key in TextBlock]: boolean;
};

export interface DerivedImage {
  format: Format;
  imageUrl: string | null;
  isGenerating: boolean;
  textConfig?: TextConfig;
}

export type ChatMessageSender = 'user' | 'assistant';

export interface ChatMessage {
  sender: ChatMessageSender;
  text: string;
}
