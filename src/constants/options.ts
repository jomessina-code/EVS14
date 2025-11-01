import type { GameType, GraphicStyle, Ambiance, VisualElements, UniversePreset } from "../types";

export const GAME_TYPES: { value: GameType, label: string }[] = [
  { value: "MOBA", label: "MOBA (LoL, Dota)" },
  { value: "FPS", label: "FPS (Valorant, CS)" },
  { value: "Combat", label: "Combat (Street Fighter)" },
  { value: "Battle Royale", label: "Battle Royale (Fortnite)" },
  { value: "Sport", label: "Sport (FIFA, NBA2K)" },
  { value: "Multi-genre", label: "Multi-genre (citoyen)" },
];

export const GRAPHIC_STYLES: { value: GraphicStyle, label: string }[] = [
  { value: "Cyberpunk / Néon", label: "Cyberpunk / Néon" },
  { value: "Fantasy Magique", label: "Fantasy Magique" },
  { value: "3D Réaliste", label: "3D Réaliste" },
  { value: "Style manga explosif", label: "Style Manga Explosif" },
  { value: "Minimal Sportif", label: "Minimal Sportif" },
];

export const AMBIANCES: { value: Ambiance, label: string }[] = [
  { value: "", label: "Aucune (IA décide)" },
  { value: "Dramatique / sombre", label: "Dramatique / Sombre" },
  { value: "Énergique / colorée", label: "Énergique / Colorée" },
  { value: "Tech / futuriste", label: "Tech / Futuriste" },
  { value: "Street / urbaine", label: "Street / Urbaine" },
  { value: "Épique / Légendaire", label: "Épique / Légendaire" },
  { value: "Lumineuse / Compétitive", label: "Lumineuse / Compétitive" },
];

export const VISUAL_ELEMENTS: { value: VisualElements, label: string }[] = [
  { value: "Personnage central", label: "Personnage Central" },
  { value: "Logo ou trophée", label: "Logo ou Trophée" },
  { value: "Duo de joueurs", label: "Duo de Joueurs" },
  { value: "Fond immersif", label: "Fond Immersif (sans sujet)" },
];

export const UNIVERSE_PRESETS: UniversePreset[] = [
  {
    id: "smashverse",
    label: "Smashverse",
    description: "Univers Nintendo / Super Smash Bros. Ambiance arcade, lumineuse et inclusive.",
    gameType: "Combat",
    style: "Style manga explosif",
    ambiance: "Énergique / colorée",
    elements: "Duo de joueurs",
    keywords: ["Nintendo", "arcade", "combats stylisés", "lumières vives", "effets électriques", "aura colorée", "énergie positive"],
    colorPalette: ["#ff4dc2", "#4dcfff", "#ffd23b", "#ffffff"],
    influenceWeight: 0.7,
    dominant: true
  },
  {
    id: "arenaFPS",
    label: "Arena FPS",
    description: "Univers Valorant / CS futuriste. Environnement urbain, contrasté et électrique.",
    gameType: "FPS",
    style: "Cyberpunk / Néon",
    ambiance: "Dramatique / sombre",
    elements: "Duo de joueurs",
    keywords: ["néons magenta", "armes futuristes", "armures lumineuses", "pluie urbaine", "contre-jour", "ville technologique", "action compétitive"],
    colorPalette: ["#ff007f", "#00ffff", "#101820", "#f5f5f5"],
    influenceWeight: 0.6,
    dominant: false
  },
  {
    id: "epicLegends",
    label: "Epic Legends",
    description: "Univers MOBA et fantasy compétitive (LoL / Dota). Scènes épiques et mystiques.",
    gameType: "MOBA",
    style: "Fantasy Magique",
    ambiance: "Épique / Légendaire",
    elements: "Personnage central",
    keywords: ["magie", "aura mystique", "créatures épiques", "ruines anciennes", "sorts lumineux", "combat héroïque"],
    colorPalette: ["#6c43f3", "#e4b400", "#1b0e3f", "#c7b9ff"],
    influenceWeight: 0.6,
    dominant: false
  },
  {
    id: "stadiumCup",
    label: "Stadium Cup",
    description: "Univers sportif compétitif (FIFA / NBA2K). Lumières de stade et dynamisme collectif.",
    gameType: "Sport",
    style: "Minimal Sportif",
    ambiance: "Lumineuse / Compétitive",
    elements: "Logo ou trophée",
    keywords: ["stade", "public", "projecteurs", "énergie collective", "mouvement", "flou de vitesse"],
    colorPalette: ["#0047ab", "#ffcc00", "#ffffff", "#202020"],
    influenceWeight: 0.5,
    dominant: false
  },
  {
    id: "digitalHeroes",
    label: "Digital Heroes",
    description: "Univers éducatif et citoyen. Esport responsable et inclusion numérique.",
    gameType: "Multi-genre",
    style: "3D Réaliste",
    ambiance: "Tech / futuriste",
    elements: "Fond immersif",
    keywords: ["numérique responsable", "diversité", "apprentissage", "technologie bienveillante", "lumières douces", "design positif"],
    colorPalette: ["#0093ff", "#00ffa6", "#f0f0f0", "#111111"],
    influenceWeight: 0.5,
    dominant: false
  }
];