

import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { EsportPromptOptions, UniverseId, Format, UniversePreset, GameType, GraphicStyle, Ambiance, VisualElements, TextStyle, PromptChangeSummary, CropArea } from "../types";
import { GAME_TYPES, GRAPHIC_STYLES, AMBIANCES, VISUAL_ELEMENTS } from "../constants/options";

// Helper to get a new AI client instance with the current API key.
// This ensures that if the key changes, new requests use the updated key.
const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        // Throw a specific error that the UI can catch to trigger the key selection panel.
        throw new Error("API_KEY_INVALID");
    }
    return new GoogleGenAI({ apiKey });
};

const handleApiError = (error: unknown, functionName: string): never => {
    console.error(`Error in ${functionName}:`, error);
    if (error instanceof Error) {
        const lowerCaseError = error.message.toLowerCase();
        // Check for specific, recoverable API key errors.
        if (
            lowerCaseError.includes("api key not valid") ||
            lowerCaseError.includes("permission denied") ||
            lowerCaseError.includes("requested entity was not found") || // Often indicates a bad key
            lowerCaseError.includes("api_key") // Generic catch-all
        ) {
            // Throw a specific error code that the UI can catch to trigger the key selection panel.
            throw new Error('API_KEY_INVALID');
        }
        // For other errors, throw a more generic Gemini error message.
        throw new Error(`Erreur Gemini: ${error.message}`);
    }
    // Fallback for non-Error objects.
    throw new Error("Une erreur inconnue est survenue lors de la communication avec l'API.");
};


// ==================================
// PROMPT GENERATION LOGIC
// ==================================

const generateTextOverlayPrompt = (options: EsportPromptOptions, format: Format, textStyle?: TextStyle): string => {
    const formatMapping: Record<Format, string> = {
        "A3 / A2 (Vertical)": "portrait (2:3 aspect ratio)",
        "4:5 (Vertical)": "portrait (4:5 aspect ratio)",
        "1:1 (Carré)": "square (1:1 aspect ratio)",
        "16:9 (Paysage)": "landscape (16:9 aspect ratio)",
        "9:16 (Story)": "tall portrait (9:16 aspect ratio)",
        "3:1 (Bannière)": "wide landscape banner (3:1 aspect ratio)",
    };

    const textBlocks = [];
    if (options.eventName) textBlocks.push(`- Nom de l'événement (Titre principal) : "${options.eventName}"`);
    if (options.baseline) textBlocks.push(`- Slogan (Sous-titre) : "${options.baseline}"`);
    if (options.eventLocation) textBlocks.push(`- Lieu : "${options.eventLocation}"`);
    if (options.eventDate) textBlocks.push(`- Date : "${options.eventDate}"`);

    const textContent = textBlocks.join('\n');

    if (!textContent.trim()) {
        return "Tu es une IA. L'utilisateur a demandé d'ajouter du texte, mais aucun texte n'a été fourni. Retourne l'image originale sans modification.";
    }
    
    let styleInstructions = "";
    if (textStyle) {
        styleInstructions = `
**2.1. STYLE IMPOSÉ :**
- Tu DOIS utiliser ce style exact. Ne t'en écarte PAS.
- **Famille de police :** "${textStyle.fontFamily}"
- **Couleur principale :** "${textStyle.color}"
- **Effet de lisibilité :** "${textStyle.effect}"
- Ce style DOIT être appliqué de manière identique et cohérente sur TOUS les blocs de texte.
`;
    } else {
        // Fallback to old behavior
        styleInstructions = `
**2.1. DÉRIVATION DE STYLE UNIFIÉE :**
- Le style visuel du texte (police, couleur, effets) DOIT être dérivé **uniquement** de l'image de fond fournie pour garantir une intégration parfaite.
- Ce **style unique et déterminé** DOIT être appliqué de manière **identique et cohérente sur TOUS les blocs de texte**. Le format cible influence UNIQUEMENT la taille et la position, pas le style.
`;
    }

    return `
# MANDAT CRÉATIF : SUPERPOSITION DE TEXTE

Tu es une IA maître graphiste, experte en composition visuelle et en typographie pour des visuels d'événements e-sport à fort impact.
Ta tâche est d'ajouter le contenu textuel fourni à l'image de fond, en suivant un ensemble de règles extrêmement strictes.

---

## 1. INFORMATIONS DE BASE

- **Image de fond fournie :** [L'image d'entrée]
- **Format cible :** ${formatMapping[format]}
- **Contenu textuel à ajouter :**
${textContent}

---

## 2. RÈGLEMENT INCONTOURNABLE

### RÈGLE 1 : GÉOMÉTRIE ET PLACEMENT (PRIORITÉ ABSOLUE)

**1.1. ZONE DE SÉCURITÉ DE 10% :**
- Tu DOIS définir une "zone de sécurité" avec une marge de **10% sur les QUATRE bords**. L'espace utilisable pour le texte est le 80% central de la toile.
- **CHAQUE partie de chaque élément de texte** (lettres, lueurs, ombres) DOIT être placée **ENTIÈREMENT à l'intérieur de cette zone**.
- **AUCUN élément ne doit toucher ou franchir la limite de la zone de sécurité.** C'est l'instruction la plus critique.

**1.2. TAILLE DE POLICE PROPORTIONNELLE :**
- Les tailles de police DOIVENT être calculées **proportionnellement à la hauteur de l'image**. Pas de tailles en pixels fixes.
- Le titre principal devrait faire environ 7-10% de la hauteur de l'image. Les autres textes doivent être mis à l'échelle à partir de là.

**1.3. PAS DE RECADRAGE :**
- Il est absolument interdit qu'une partie d'une lettre soit coupée par les bords de l'image.

**1.4. COMPOSITION DYNAMIQUE :**
- La mise en page (alignement haut, centre, bas) DOIT être calculée dynamiquement pour une composition équilibrée et professionnelle pour le format spécifique.
- Évite de placer du texte sur les parties les plus critiques du sujet de fond (par ex., un visage).

### RÈGLE 2 : STYLE ET COHÉRENCE VISUELLE (NON NÉGOCIABLE)

${styleInstructions}

**2.2. POLICE & TYPOGRAPHIE :**
- La police DOIT être une **police sans-serif moderne, grasse** adaptée à l'e-sport (percutante, propre, très lisible).
- L'interlignage et l'espacement doivent être professionnels.

**2.3. COULEUR & EFFETS :**
- La couleur du texte DOIT être vive et très contrastée.
- Utilise des effets subtils UNIQUEMENT pour garantir la lisibilité (par ex., une douce lueur externe ou une ombre portée nette et sombre).

**2.4. HIÉRARCHIE VISUELLE :**
- "Nom de l'événement" est le titre principal et DOIT être le plus grand.
- "Slogan" est un sous-titre, clairement secondaire.
- "Lieu" et "Date" sont des informations tertiaires, les plus petites.

### RÈGLE 3 : FIDÉLITÉ DU CONTENU

**3.1. TEXTE EXACT :**
- Tu DOIS reproduire le contenu textuel fourni caractère par caractère. Aucune addition, omission ou paraphrase.

---

## 3. VÉRIFICATION FINALE

Avant de générer l'image, effectue une auto-correction. Vérifie : Chaque règle est-elle respectée ? Le texte est-il entièrement dans la zone de sécurité ? La taille est-elle proportionnelle ? Le style est-il cohérent ? Le contenu est-il exact ? Si non, régénère jusqu'à la perfection.

Retourne uniquement l'image finale avec le texte parfaitement intégré.
`;
};


export const generateEsportPrompt = (options: EsportPromptOptions, allPresets: UniversePreset[], isAdaptation: boolean = false): string => {
    const isFrench = options.language === 'français';

    // Universe Composition Logic
    let activePresets: UniversePreset[] = [];
    if (options.universes.length > 0) {
        activePresets = options.universes
            .map(id => allPresets.find(p => p.id === id))
            .filter((p): p is UniversePreset => !!p);
    }

    let compositionPrompt = "";
    if (activePresets.length > 0) {
        if (activePresets.length === 1) {
            const p = activePresets[0];
            const inspirationText = isFrench ? `Le visuel est inspiré de l'univers "${p.label}".` : `The visual is inspired by the "${p.label}" universe.`;
            const thematicDirectionText = isFrench ? `Direction thématique à partir des mots-clés :` : `Thematic direction from keywords:`;
            const suggestedPaletteText = isFrench ? `Palette de couleurs suggérée :` : `Suggested color palette:`;
            const userChoicesText = isFrench ? `Les choix de style spécifiques de l'utilisateur ci-dessous sont les instructions principales.` : `The user's specific style choices below are the primary instructions.`;
            compositionPrompt = `${inspirationText} ${thematicDirectionText} ${p.keywords.join(', ')}. ${suggestedPaletteText} ${p.colorPalette.join(', ')}. ${userChoicesText}`;
        } else {
            compositionPrompt = isFrench ? "Le visuel est une fusion de plusieurs univers :\n" : "The visual is a fusion of multiple universes:\n";
            activePresets.forEach(p => {
                const weightText = isFrench ? `Poids` : `Weight`;
                const keywordsText = isFrench ? `Mots-clés` : `Keywords`;
                const colorsText = isFrench ? `Couleurs` : `Colors`;
                compositionPrompt += `- **${p.label} (${weightText}: ${Math.round(p.influenceWeight * 100)}%)**: ${p.description}. ${keywordsText}: ${p.keywords.join(', ')}. ${colorsText}: ${p.colorPalette.join(', ')}.\n`;
            });
            compositionPrompt += isFrench ? "Crée un mélange harmonieux et épique de ces styles." : "Create a harmonious and epic blend of these styles.";
        }
    }

    // The specific style options always come from the main `options` object.
    const gameType = options.gameType;
    const graphicStyle = options.graphicStyle;
    const ambiance = options.ambiance;
    const visualElements = options.visualElements;

    // REFACTORED: Visual Element and Sizing Logic
    let visualElementsInstructions = "";
    const isSizedElement = visualElements === "Personnage central" ||
                           visualElements === "Duo de joueurs" ||
                           visualElements === "Logo ou trophée";

    // Step 1: Get the base description (custom text > preset)
    if (options.visualElementDescriptions && options.visualElementDescriptions.length > 0) {
        const descriptionText = options.visualElementDescriptions.join(' et ');
        visualElementsInstructions = isFrench 
            ? `Description de l'élément principal : ${descriptionText}. Cette instruction a priorité.`
            : `Main element description: ${descriptionText}. This instruction has priority.`;
    } else {
        switch (visualElements) {
            case "Personnage central":
                visualElementsInstructions = isFrench ? `Un personnage central.` : `A central character.`;
                break;
            case "Duo de joueurs":
                visualElementsInstructions = isFrench ? `Un duo de joueurs.` : `A duo of players.`;
                break;
            case "Logo ou trophée":
                visualElementsInstructions = isFrench ? `Un logo ou trophée majestueux. L'image ne doit contenir aucun personnage.` : `A majestic logo or trophy. The image must not contain any characters.`;
                break;
            case "Fond immersif":
                visualElementsInstructions = isFrench
                    ? `Fond immersif sans sujet. IMPORTANT : L'image doit être une pure scène de fond. Elle ne devrait contenir aucun humain, humanoïde, personnage, créature ou visage distinct.`
                    : `Immersive background without a subject. IMPORTANT: The image should be a pure background scene. It should NOT contain any humans, humanoids, characters, creatures, or distinct faces.`;
                break;
            default:
                visualElementsInstructions = visualElements;
        }
    }

    // Step 2: Append sizing rules if applicable. This overrides the description if size is 0.
    if (isSizedElement && typeof options.elementSize === 'number') {
        if (options.elementSize === 0) {
            visualElementsInstructions = isFrench
                ? `Fond immersif sans sujet. IMPORTANT : L'image doit être une pure scène de fond. Elle ne devrait contenir aucun humain, humanoïde, personnage, créature ou visage distinct. L'accent est entièrement mis sur l'environnement, l'atmosphère et les éléments abstraits. Ceci est dû au fait que la taille de l'élément est réglée sur 0%.`
                : `Immersive background without a subject. IMPORTANT: The image should be a pure background scene. It should NOT contain any humans, humanoids, characters, creatures, or distinct faces. The focus is entirely on the environment, atmosphere, and abstract elements. This is because the element size is set to 0%.`;
        } else {
            visualElementsInstructions += (isFrench ? `
INSTRUCTION DE COMPOSITION IMPORTANTE : La hauteur du sujet principal (décrit ci-dessus) devrait occuper environ ${options.elementSize}% de la hauteur totale de l'image. C'est une directive clé pour la composition. L'angle de la caméra et le plan (par ex., gros plan, plan d'ensemble) doivent être choisis pour s'approcher de ce pourcentage.
- Exemple : À 10%, le sujet est une petite silhouette dans la scène (plan d'ensemble).
- Exemple : À 90%, le sujet est en très gros plan, remplissant presque tout l'espace vertical.
- Exemple : À 100%, le visuel est un très gros plan sur une texture ou un détail du sujet (par ex., un œil, une pièce d'armure), remplissant tout le cadre et devenant presque abstrait.
Essaie de respecter cette directive pour un résultat optimal.`
            : `
IMPORTANT COMPOSITION INSTRUCTION: The height of the main subject (described above) should be approximately ${options.elementSize}% of the total image height. This is a key compositional guideline. The camera angle and shot (e.g., close-up, full body shot) should be chosen to approach this percentage.
- Example: At 10%, the subject is a small figure in the scene (full body shot from a distance).
- Example: At 90%, the subject is an extreme close-up, filling almost the entire vertical space.
- Example: At 100%, the visual is an extreme close-up on a texture or detail of the subject (e.g., an eye, or a piece of armor), filling the entire frame and becoming almost abstract.
Try to follow this guideline for an optimal result.`);
        }
    } else if (visualElements === "Fond immersif") {
        // Re-ensure this critical instruction is not lost if the element size is not 0
        visualElementsInstructions = isFrench
            ? `Fond immersif sans sujet. IMPORTANT : L'image doit être une pure scène de fond. Elle ne devrait contenir aucun humain, humanoïde, personnage, créature ou visage distinct.`
            : `Immersive background without a subject. IMPORTANT: The image should be a pure background scene. It should NOT contain any humans, humanoids, characters, creatures, or distinct faces.`;
    }


    const formatMapping: Record<Format, string> = {
        "A3 / A2 (Vertical)": isFrench ? "portrait (ratio 2:3)" : "portrait (2:3 aspect ratio)",
        "4:5 (Vertical)": isFrench ? "portrait (ratio 4:5)" : "portrait (4:5 aspect ratio)",
        "1:1 (Carré)": isFrench ? "carré (ratio 1:1)" : "square (1:1 aspect ratio)",
        "16:9 (Paysage)": isFrench ? "paysage (ratio 16:9)" : "landscape (16:9 aspect ratio)",
        "9:16 (Story)": isFrench ? "portrait haut (ratio 9:16)" : "tall portrait (9:16 aspect ratio)",
        "3:1 (Bannière)": isFrench ? "bannière paysage large (ratio 3:1)" : "wide landscape banner (3:1 aspect ratio)",
    };

    const textPresence = (options.eventName || options.baseline || options.eventLocation || options.eventDate) && !options.hideText;

    const resolution = options.highResolution ? (isFrench ? "Haute définition (qualité supérieure)" : "High definition (superior quality)") : (isFrench ? "Définition standard" : "Standard definition");

    let textInstructions = "";
    if (isAdaptation) {
        textInstructions = isFrench
            ? "Le visuel généré est une base SANS TEXTE. Il sera ajouté dans une étape ultérieure. Il est donc CRUCIAL de ne PAS générer de texte, de lettres, de symboles ou de logos lisibles. Des formes abstraites inspirées de la typographie sont autorisées si elles sont purement décoratives."
            : "The generated visual is a TEXT-FREE base. Text will be added in a later step. It is therefore CRUCIAL NOT to generate any readable text, letters, symbols, or logos. Abstract shapes inspired by typography are allowed if purely decorative.";
    } else {
        textInstructions = textPresence
            ? (isFrench
                ? "Ce visuel inclura du texte qui sera ajouté ultérieurement. IMPORTANT : Ne génère AUCUN texte, lettre ou symbole lisible. Des formes abstraites sont acceptables. Assure-toi de laisser des zones visuellement plus calmes pour permettre une superposition de texte lisible."
                : "This visual will include text to be added later. IMPORTANT: Do NOT generate ANY readable text, letters, or symbols. Abstract shapes are acceptable. Make sure to leave visually calmer areas to allow for readable text overlay.")
            : (isFrench
                ? "Ce visuel ne contiendra PAS de texte. Concentre-toi sur une composition pleine et percutante, sans avoir besoin de réserver de l'espace pour du texte."
                : "This visual will NOT contain text. Focus on a full and impactful composition, without needing to reserve space for text.");
    }
    
    const transparentBgInstruction = options.transparentBackground
        ? (isFrench
            ? "INSTRUCTION IMPORTANTE : FOND TRANSPARENT. Le sujet principal décrit doit être complètement isolé. L'arrière-plan de l'image doit être entièrement transparent (canal alpha). Il ne doit y avoir aucun élément de décor, couleur de fond, dégradé ou texture. Seul le sujet est visible. Le résultat attendu est un fichier PNG avec une transparence alpha effective."
            : "IMPORTANT INSTRUCTION: TRANSPARENT BACKGROUND. The described main subject should be completely isolated. The image background must be fully transparent (alpha channel). There should be no background scenery, colors, gradients, or textures. Only the subject is visible. The expected output is a PNG file with effective alpha transparency.")
        : "";

    let bannerInstruction = "";
    if (options.format === "3:1 (Bannière)" && options.visualElements !== "Fond immersif") {
        bannerInstruction = isFrench 
            ? `\n- **GUIDE POUR FORMAT BANNIÈRE (3:1) :** Ce format est très large, la composition est donc essentielle.
- **COMPOSITION CENTRÉE RECOMMANDÉE :** Le sujet principal (personnage, logo, etc.) devrait être **centré horizontalement** pour un impact maximal.
- **CADRAGE VERTICAL :** Le format étant peu haut, un cadrage vertical est attendu. La priorité est de conserver les parties importantes du sujet.
    - **Pour un personnage :** Vise un "plan poitrine" ou "plan taille" (medium shot) où la tête et le torse sont bien visibles. Il est normal de couper le personnage au niveau des jambes.
    - **Pour un objet/logo :** Assure-toi que la partie centrale et reconnaissable est visible.
- **ÉVITEMENT DE COUPURE LATERALE :** Évite de couper le sujet sur les côtés gauche ou droit pour maintenir un bon équilibre visuel.
- **RÉSUMÉ :** Pense à un plan cinématographique large où le héros est au centre, avec l'environnement qui s'étend sur les côtés.`
            : `\n- **GUIDE FOR BANNER FORMAT (3:1):** This format is very wide, so composition is key.
- **CENTERED COMPOSITION RECOMMENDED:** The main subject (character, logo, etc.) should be **horizontally centered** for maximum impact.
- **VERTICAL FRAMING:** Due to the limited height, vertical framing is expected. The priority is to preserve the important parts of the subject.
    - **For a character:** Aim for a "bust shot" or a "medium shot" where the head and torso are clearly visible. It's normal to crop the character at the legs.
    - **For an object/logo:** Ensure the central and most recognizable part is visible.
- **AVOID LATERAL CROPPING:** Try not to crop the subject on the left or right sides to maintain a balanced visual.
- **SUMMARY:** Think of a wide cinematic shot where the hero is in the center, with the environment extending to the sides.`;
    }

    const finalPrompt = `
# MANDAT CRÉATIF : VISUEL D'AFFICHE E-SPORT

**Langue de sortie pour les descriptions :** ${options.language}

## 1. COMPOSITION DE L'UNIVERS (Fusion & Inspiration)
${compositionPrompt}

## 2. INSTRUCTIONS DE STYLE (Choix utilisateur - Priorité absolue)
- **Type de jeu :** ${gameType}
- **Style graphique dominant :** ${graphicStyle}
- **Ambiance visuelle / Éclairage :** ${ambiance || (isFrench ? "Automatique (décidé par l'IA)" : "Automatic (AI decides)")}
- **Intensité des effets spéciaux (lumières, particules, magie) :** ${options.effectsIntensity}%

## 3. ÉLÉMENT VISUEL PRINCIPAL & COMPOSITION
${visualElementsInstructions}

## 4. FORMAT & SPÉCIFICATIONS TECHNIQUES
- **Format :** ${formatMapping[options.format]}${bannerInstruction}
- **Résolution :** ${resolution}
- **Présence de texte (sur l'image finale) :** ${textPresence ? 'Oui' : 'Non'}
- **Instruction sur le texte pour CETTE génération :** ${textInstructions}
- ${transparentBgInstruction}

## 5. DIRECTIVES FINALES
- Le visuel doit être percutant, professionnel et adapté à une communication e-sport de haut niveau.
- Éviter les visages trop détaillés ou reconnaissables, sauf si explicitement demandé. L'accent est mis sur l'action et l'ambiance.
- Assure une composition équilibrée qui attire le regard.

Génère une seule image en suivant ces directives à la lettre.
`;

    if (options.modificationRequest) {
        return `${finalPrompt}\n\n## 6. REQUÊTE DE MODIFICATION UTILISATEUR (Priorité maximale)\nApplique cette modification à la génération précédente : "${options.modificationRequest}"`;
    }

    return finalPrompt.trim();
};

export const correctText = async (text: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Corrige la grammaire, la ponctuation et la clarté de cette transcription vocale brute. Ne change pas le sens. Ne réponds qu'avec le texte corrigé, sans préambule.\n\nTexte brut: "${text}"\n\nTexte corrigé:`,
            config: {
                temperature: 0.2,
            },
        });
        return response.text.trim();
    } catch (e) {
        return handleApiError(e, 'correctText');
    }
};

export const generateEsportImage = async (
    options: EsportPromptOptions, 
    allPresets: UniversePreset[],
    prompt: string
): Promise<{ imageBase64: string; prompt: string; marginsVerified: boolean; textVerified: boolean }> => {
    try {
        const ai = getAiClient();

        const parts: any[] = [{ text: prompt }];

        if (options.inspirationImage) {
            parts.unshift({
                inlineData: {
                    mimeType: options.inspirationImage.mimeType,
                    data: options.inspirationImage.base64,
                },
            });
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData?.data) {
                    return {
                        imageBase64: part.inlineData.data,
                        prompt: prompt,
                        marginsVerified: true,
                        textVerified: true,
                    };
                }
            }
        }
        
        if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
            let reasonText = candidate.finishReason;
            if (candidate.finishReason === 'SAFETY') {
                reasonText = "contenu potentiellement sensible (SAFETY)";
            } else if (candidate.finishReason === 'NO_IMAGE') {
                reasonText = "le modèle n'a pas pu générer d'image pour cette demande";
            }
            throw new Error(`La génération a été bloquée : ${reasonText}. Essayez de modifier votre prompt.`);
        }
        
        throw new Error("Aucune image n'a été générée par le modèle.");
    } catch (e) {
        return handleApiError(e, 'generateEsportImage');
    }
};

export const determineTextStyle = async (imageBase64: string): Promise<TextStyle> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: 'image/png',
                            data: imageBase64,
                        },
                    },
                    {
                        text: "Analyse cette image d'e-sport. Détermine le style de texte PARFAIT pour superposer des informations (nom du tournoi, etc.).\n\nRéponds UNIQUEMENT avec un objet JSON contenant : fontFamily (une police Google Fonts percutante et sans-serif), color (une couleur HEX vive et contrastée tirée de l'image), et effect (un effet de lisibilité subtil comme 'soft_glow', 'sharp_shadow' ou 'outline').\n\nExemple de réponse :\n{\"fontFamily\": \"Orbitron\", \"color\": \"#00FFFF\", \"effect\": \"soft_glow\"}"
                    }
                ]
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        fontFamily: { type: Type.STRING },
                        color: { type: Type.STRING },
                        effect: { type: Type.STRING },
                    },
                    required: ["fontFamily", "color", "effect"]
                }
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (e) {
        return handleApiError(e, 'determineTextStyle');
    }
};

export const addTextToImage = async (
    imageBase64: string,
    mimeType: string,
    options: EsportPromptOptions,
    format: Format,
    textStyle?: TextStyle
): Promise<{ imageBase64: string }> => {
    try {
        const ai = getAiClient();
        const prompt = generateTextOverlayPrompt(options, format, textStyle);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: imageBase64
                        }
                    },
                    {
                        text: prompt
                    }
                ]
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData?.data) {
                    return { imageBase64: part.inlineData.data };
                }
            }
        }
        
        if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
            let reasonText = candidate.finishReason;
            if (candidate.finishReason === 'SAFETY') {
                reasonText = "contenu potentiellement sensible (SAFETY)";
            } else if (candidate.finishReason === 'NO_IMAGE') {
                reasonText = "le modèle n'a pas pu générer d'image pour cette demande";
            }
            throw new Error(`L'ajout de texte a été bloqué : ${reasonText}.`);
        }
        
        throw new Error("L'ajout de texte a échoué car aucune image n'a été retournée.");
    } catch (e) {
        return handleApiError(e, 'addTextToImage');
    }
};

export const adaptEsportImage = async (
    imageBase64: string,
    mimeType: string,
    options: EsportPromptOptions,
    format: Format,
    cropArea?: CropArea
): Promise<{ imageBase64: string }> => {
    try {
        const ai = getAiClient();

        const formatMapping: Record<Format, string> = {
            "A3 / A2 (Vertical)": "portrait (2:3 aspect ratio)",
            "4:5 (Vertical)": "portrait (4:5 aspect ratio)",
            "1:1 (Carré)": "square (1:1 aspect ratio)",
            "16:9 (Paysage)": "landscape (16:9 aspect ratio)",
            "9:16 (Story)": "tall portrait (9:16 aspect ratio)",
            "3:1 (Bannière)": "wide landscape banner (3:1 aspect ratio)",
        };

        let adaptationPrompt = `
# MANDAT : ADAPTATION DE VISUEL E-SPORT
Tu es une IA experte en graphisme et recomposition d'images. Ta mission est d'adapter l'image fournie à un nouveau format en préservant son style et son essence.

## 1. IMAGE SOURCE
[L'image d'entrée est fournie]

## 2. STYLE ET CONTENU À PRÉSERVER
Le style général (couleurs, textures, ambiance, sujet) de l'image source doit être conservé.

## 3. NOUVEAU FORMAT CIBLE
- **Format final :** ${formatMapping[format]}
`;

        if (format === '3:1 (Bannière)' && cropArea) {
            const topPercent = Math.round(cropArea.y * 100);
            const bottomPercent = Math.round((cropArea.y + 1/3) * 100);

            adaptationPrompt += `
## 4. INSTRUCTION DE RECADRAGE CRITIQUE (Priorité Absolue)
- L'image source est un carré (1:1). Tu DOIS recadrer cette image source pour l'adapter au format bannière (3:1).
- La zone à extraire de l'image source est une bande horizontale précise.
- Le HAUT de cette zone d'intérêt commence à **${topPercent}%** du haut de l'image source.
- Le BAS de cette zone d'intérêt se termine à **${bottomPercent}%** du haut de l'image source.
- Concentre-toi EXCLUSIVEMENT sur le contenu visuel à l'intérieur de cette bande pour créer la nouvelle image. Les éléments en dehors de cette zone doivent être ignorés.
- Ta mission est de prendre cette bande et de la transformer en une bannière 3:1 harmonieuse, en recomposant intelligemment les éléments si nécessaire pour remplir le format sans distorsion.
`;
        } else if (format === '16:9 (Paysage)' && cropArea) {
            const cropHeight = 9/16;
            const topPercent = Math.round(cropArea.y * 100);
            const bottomPercent = Math.round((cropArea.y + cropHeight) * 100);

            adaptationPrompt += `
## 4. INSTRUCTION DE RECADRAGE CRITIQUE (Priorité Absolue)
- L'image source est un carré (1:1). Tu DOIS recadrer cette image source pour l'adapter au format paysage (16:9).
- La zone à extraire de l'image source est une bande horizontale précise avec un ratio de 16:9.
- Le HAUT de cette zone d'intérêt commence à **${topPercent}%** du haut de l'image source.
- Le BAS de cette zone d'intérêt se termine à **${bottomPercent}%** du haut de l'image source.
- Concentre-toi EXCLUSIVEMENT sur le contenu visuel à l'intérieur de cette bande pour créer la nouvelle image. Les éléments en dehors de cette zone doivent être ignorés.
- Ta mission est de prendre cette bande et de la transformer en une image 16:9 harmonieuse, en recomposant intelligemment les éléments si nécessaire pour remplir le format sans distorsion.
`;
        } else {
             adaptationPrompt += `
## 4. INSTRUCTION DE RECOMPOSITION
Recompose intelligemment les éléments de l'image source pour les adapter parfaitement au nouveau format. Ne te contente pas de simplement recadrer ou étirer. Étends la scène, déplace des éléments si nécessaire pour créer une composition équilibrée et professionnelle dans le nouveau format.
`;
        }

        adaptationPrompt += `
## 5. RÈGLES FINALES
- Ne génère AUCUN texte, lettre, ou logo.
- Le résultat final doit être une image unique, propre, dans le format cible demandé.

Retourne uniquement l'image adaptée.
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: imageBase64 } },
                    { text: adaptationPrompt }
                ]
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData?.data) {
                    return { imageBase64: part.inlineData.data };
                }
            }
        }
        
        if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
            let reasonText = candidate.finishReason;
            if (candidate.finishReason === 'SAFETY') {
                reasonText = "contenu potentiellement sensible (SAFETY)";
            } else if (candidate.finishReason === 'NO_IMAGE') {
                reasonText = "le modèle n'a pas pu générer d'image pour cette demande";
            }
            throw new Error(`L'adaptation a été bloquée : ${reasonText}.`);
        }

        throw new Error("L'adaptation de l'image a échoué car aucune image n'a été retournée.");
    } catch (e) {
        return handleApiError(e, 'adaptEsportImage');
    }
};

export const refinePrompt = async (currentPrompt: string, userFeedback: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Tu es un assistant expert en 'prompt engineering' pour la génération d'images. Améliore le prompt suivant en te basant sur la demande de l'utilisateur. Ne réponds qu'avec le prompt final, sans préambule.\n\nPrompt actuel:\n${currentPrompt}\n\nDemande utilisateur: "${userFeedback}"\n\nNouveau prompt:`,
            config: {
                temperature: 0.5,
            },
        });
        return response.text.trim();
    } catch (e) {
        return handleApiError(e, 'refinePrompt');
    }
};

export const suggestUniversePreset = async (theme: string): Promise<Omit<UniversePreset, 'id' | 'isCustom' | 'dominant'>> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Génère un "préréglage d'univers" pour un visuel e-sport basé sur le thème : "${theme}".
Crée un objet JSON avec les clés suivantes :
- label (string): Un nom accrocheur.
- description (string): Une brève description.
- gameType (GameType): Choisis parmi ${GAME_TYPES.map(g => `"${g.value}"`).join(', ')}.
- style (GraphicStyle): Choisis parmi ${GRAPHIC_STYLES.map(g => `"${g.value}"`).join(', ')}.
- ambiance (Ambiance): Choisis parmi ${AMBIANCES.map(g => `"${g.value}"`).join(', ')}.
- elements (VisualElements): Choisis parmi ${VISUAL_ELEMENTS.map(g => `"${g.value}"`).join(', ')}.
- keywords (string[]): Une liste de 5-7 mots-clés thématiques.
- colorPalette (string[]): Un tableau de 4 couleurs HEX qui correspondent au thème.
- influenceWeight (number): Une valeur entre 0.5 et 0.7.

Ne retourne que l'objet JSON, sans formatage de code markdown.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        label: { type: Type.STRING },
                        description: { type: Type.STRING },
                        gameType: { type: Type.STRING, enum: GAME_TYPES.map(g => g.value) },
                        style: { type: Type.STRING, enum: GRAPHIC_STYLES.map(s => s.value) },
                        ambiance: { type: Type.STRING, enum: AMBIANCES.map(a => a.value).filter(Boolean) },
                        elements: { type: Type.STRING, enum: VISUAL_ELEMENTS.map(v => v.value) },
                        keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                        colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
                        influenceWeight: { type: Type.NUMBER },
                    },
                    required: ["label", "description", "gameType", "style", "ambiance", "elements", "keywords", "colorPalette", "influenceWeight"],
                }
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (e) {
        return handleApiError(e, 'suggestUniversePreset');
    }
};

export const refinePromptForModification = async (currentPrompt: string, modificationRequest: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Tu es un assistant expert en 'prompt engineering'. Modifie le prompt d'image suivant pour intégrer la demande de l'utilisateur. Le nouveau prompt doit conserver l'esprit de l'original tout en appliquant les changements demandés. Ne réponds qu'avec le prompt final, sans préambule.\n\nPrompt original:\n${currentPrompt}\n\nDemande de modification: "${modificationRequest}"\n\nPrompt modifié:`,
            config: {
                temperature: 0.6,
            }
        });
        return response.text.trim();
    } catch (e) {
        return handleApiError(e, 'refinePromptForModification');
    }
};

export const summarizePromptChanges = async (originalPrompt: string, newPrompt: string, userRequest: string): Promise<PromptChangeSummary> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Compare le prompt original et le nouveau prompt. Basé sur la demande utilisateur, identifie les éléments clés qui ont été conservés et ceux qui ont été modifiés/ajoutés. Sois concis.\n\nDemande: "${userRequest}"\n\nRéponds UNIQUEMENT avec un objet JSON contenant deux clés : "kept" (un tableau de chaînes décrivant ce qui est conservé) et "changed" (un tableau de chaînes décrivant ce qui a changé).\n\nOriginal: ${originalPrompt}\nNouveau: ${newPrompt}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        kept: { type: Type.ARRAY, items: { type: Type.STRING } },
                        changed: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ["kept", "changed"],
                }
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (e) {
        return handleApiError(e, 'summarizePromptChanges');
    }
};