

import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { EsportPromptOptions, UniverseId, Format, UniversePreset, GameType, GraphicStyle, Ambiance, VisualElements, TextStyle } from "../types";
import { GAME_TYPES, GRAPHIC_STYLES, AMBIANCES, VISUAL_ELEMENTS } from "../constants/options";

// Helper to get API key
const getApiKey = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        // This error should ideally not be hit if the new key selection flow works,
        // but it's kept as a safeguard.
        throw new Error("API_KEY_INVALID");
    }
    return apiKey;
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
    if (options.eventName) textBlocks.push(`- Event Name (Main Title): "${options.eventName}"`);
    if (options.baseline) textBlocks.push(`- Baseline (Subtitle): "${options.baseline}"`);
    if (options.eventLocation) textBlocks.push(`- Location: "${options.eventLocation}"`);
    if (options.eventDate) textBlocks.push(`- Date: "${options.eventDate}"`);

    const textContent = textBlocks.join('\n');

    if (!textContent.trim()) {
        return "You are an AI. The user has requested to add text, but no text was provided. Return the original image unchanged.";
    }
    
    let styleInstructions = "";
    if (textStyle) {
        styleInstructions = `
**2.1. ENFORCED STYLE:**
    - You MUST use this exact style. Do NOT deviate.
    - **Font Family:** "${textStyle.fontFamily}"
    - **Primary Color:** "${textStyle.color}"
    - **Readability Effect:** "${textStyle.effect}"
    - This style MUST be applied identically and consistently across ALL text blocks.
`;
    } else {
        // Fallback to old behavior
        styleInstructions = `
**2.1. UNIFIED STYLE DERIVATION:**
    - The text's visual style (font, color, effects) MUST be derived **solely** from the provided background image to ensure it looks perfectly integrated.
    - This **single, determined style** MUST be applied **identically and consistently across ALL text blocks**. The target format influences size and position ONLY, not the style itself.
`;
    }

    return `
You are a master graphic designer AI, an expert in visual composition and typography for high-impact esports event visuals.
Your task is to add the provided text content to the given background image, following an extremely strict set of rules. Failure to follow any rule is a failure of the entire task.

**Provided Background Image:** [The input image]
**Target Format:** ${formatMapping[format]}

**Text Content to Add:**
${textContent}

**--- THE UNBREAKABLE RULEBOOK ---**

**RULE 1: GEOMETRY AND PLACEMENT (ABSOLUTE PRIORITY)**

1.1. **THE 10% SAFE AREA:**
    - You MUST define a "safe area" that is inset by **10% from ALL four edges** of the image. The usable space for text is the central 80% of the canvas.
    - **EVERY part of every text element**—including letters, glows, shadows, or outlines—MUST be placed **ENTIRELY inside this safe area**.
    - **NO element is permitted to touch or cross the safe area boundary.** This is the most critical instruction.

1.2. **PROPORTIONAL FONT SIZING:**
    - Font sizes MUST be calculated **proportionally to the image's height**. Do not use fixed pixel sizes.
    - As a guideline: The main title's font size should be approximately 7-10% of the total image height. Other text elements must be scaled down from there according to the visual hierarchy.
    - This ensures text is readable and well-proportioned on all formats, from wide banners to tall stories.

1.3. **NO CROPPING:**
    - It is absolutely forbidden for any part of any letter to be cropped or cut off by the image edges. Every character must be 100% visible.

1.4. **DYNAMIC COMPOSITION:**
    - The layout (top, center, bottom alignment of text blocks) MUST be dynamically calculated to create a balanced, professional, and aesthetically pleasing composition for the specific format.
    - The composition MUST adapt intelligently if some text blocks are missing. For example, if there is only a title and a date, position them harmoniously, not leaving a large awkward gap for a missing baseline.
    - Avoid placing text directly over the most critical part of the background's main subject (e.g., a character's face).

**RULE 2: STYLE AND VISUAL CONSISTENCY (NON-NEGOTIABLE)**
${styleInstructions}
**2.2. FONT & TYPOGRAPHY:**
    - The font MUST be a **modern, bold, sans-serif typeface** suitable for esports (e.g., impactful, clean, highly legible).
    - Line spacing and letter spacing must be professional, consistent, and enhance readability.

**2.3. COLOR & EFFECTS:**
    - The primary text color MUST be a bright, high-contrast color.
    - Use subtle effects ONLY to guarantee readability (e.g., a soft outer glow or a tight, dark drop shadow). The style should be premium and clean, not cheap or over-designed.

**2.4. VISUAL HIERARCHY:**
    - "Event Name" is the primary title and MUST be the largest and most visually dominant text.
    - "Baseline" is a subtitle and must be clearly secondary to the title.
    - "Location" and "Date" are tertiary information, should be the smallest, and are often grouped together.

**RULE 3: CONTENT FIDELITY**

3.1. **EXACT WORDING:**
    - You MUST reproduce the provided text content character-for-character. No additions, omissions, or paraphrasing.

**FINAL CHECK:** Before outputting the image, perform a self-correction pass. Verify: Is every single rule in this rulebook followed? Is the text entirely within the 10% safe area? Is the sizing proportional? Is the style consistent as defined in RULE 2? Is the content exact? If not, regenerate the text overlay until it is perfect.

Return only the final image with the perfectly integrated text.
`;
};


export const generateEsportPrompt = (options: EsportPromptOptions, allPresets: UniversePreset[], isAdaptation: boolean = false): string => {
    
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
            // The composition prompt focuses on non-style "flavor" to avoid conflicts with user's manual selections.
            compositionPrompt = `The visual is inspired by the "${p.label}" universe. Thematic direction from keywords: ${p.keywords.join(', ')}. Suggested color palette: ${p.colorPalette.join(', ')}. The user's specific style choices below are the primary instructions.`;
        } else {
            compositionPrompt = "The visual is a fusion of multiple universes:\n";
            activePresets.forEach(p => {
                compositionPrompt += `- **${p.label} (Weight: ${Math.round(p.influenceWeight * 100)}%)**: ${p.description}. Keywords: ${p.keywords.join(', ')}. Colors: ${p.colorPalette.join(', ')}.\n`;
            });
            compositionPrompt += "Create a harmonious and epic blend of these styles.";
        }
    }

    // The specific style options always come from the main `options` object,
    // which reflects the user's current selections in the UI. This is the source of truth.
    const gameType = options.gameType;
    const graphicStyle = options.graphicStyle;
    const ambiance = options.ambiance;
    const visualElements = options.visualElements;

    // NEW: Detailed instructions based on the selected key visual element and its size.
    let visualElementsInstructions = "";
    const isSizedElement = visualElements === "Personnage central" ||
                           visualElements === "Duo de joueurs" ||
                           visualElements === "Logo ou trophée";

    switch (visualElements) {
        case "Personnage central":
        case "Duo de joueurs":
            visualElementsInstructions = `${visualElements}. The character(s) MUST be the main subject, prominently featured.`;
            if (isSizedElement && typeof options.elementSize === 'number') {
                if (options.elementSize === 0) {
                    visualElementsInstructions = `Immersive background without a subject. CRITICAL: The image must be a pure background scene. It must NOT contain any humans, humanoids, characters, creatures, or distinct faces. The focus is entirely on the environment, atmosphere, and abstract elements. This is because the element size is set to 0%.`;
                } else {
                    visualElementsInstructions += `
NON-NEGOTIABLE COMPOSITION RULE: The height of the main subject (the character(s)) MUST be EXACTLY ${options.elementSize}% of the total image height. This is the single most important compositional constraint. The camera angle and shot (e.g., close-up, full body shot) MUST be chosen to strictly enforce this percentage.
- Example: At 10%, the character should be a small figure in the scene (full body shot from a distance).
- Example: At 90%, the character should be an extreme close-up, filling almost the entire vertical space.
- Example: At 100%, the visual should be an extreme close-up on a texture or detail of the character (e.g., an eye, or a piece of armor), filling the entire frame and becoming almost abstract.
Do not deviate from this percentage. This instruction is not a suggestion. Failure to adhere to this percentage is a critical failure of the task.`;
                }
            } else {
                // Fallback for older history items or default behavior
                visualElementsInstructions += ` They must occupy at least three-quarters (3/4) of the visual's height.`;
            }
            break;
        case "Logo ou trophée":
            visualElementsInstructions = `The central focus is a majestic logo or trophy, integrated into the scene. The image should not contain any human or humanoid characters.`;
            if (isSizedElement && typeof options.elementSize === 'number') {
                if (options.elementSize === 0) {
                    visualElementsInstructions = `Immersive background without a subject. CRITICAL: The image must be a pure background scene. It must NOT contain any humans, humanoids, characters, creatures, or distinct faces. The focus is entirely on the environment, atmosphere, and abstract elements. This is because the element size is set to 0%.`;
                } else {
                    visualElementsInstructions += `
NON-NEGOTIABLE COMPOSITION RULE: The height of the main subject (the logo/trophy) MUST be EXACTLY ${options.elementSize}% of the total image height. This is the single most important compositional constraint. The camera angle and perspective MUST be chosen to strictly enforce this percentage.
- Example: At 10%, the logo/trophy should be small and subtle within the larger scene.
- Example: At 90%, the logo/trophy should be massive and dominate the visual, seen from a low angle.
- Example: At 100%, the visual should be an extreme close-up on a texture or detail of the logo/trophy, filling the entire frame and becoming almost abstract.
Do not deviate from this percentage. This instruction is not a suggestion. Failure to adhere to this percentage is a critical failure of the task.`;
                }
            }
            break;
        case "Fond immersif":
            visualElementsInstructions = `Immersive background without a subject. CRITICAL: The image must be a pure background scene. It must NOT contain any humans, humanoids, characters, creatures, or distinct faces. The focus is entirely on the environment, atmosphere, and abstract elements.`;
            break;
        default:
            visualElementsInstructions = visualElements;
    }


    // Determine if text will be added later
    const hasTextContent = !!(options.eventName.trim() || options.baseline.trim() || options.eventLocation.trim() || options.eventDate.trim());
    const shouldHaveTextInFinalImage = !options.hideText && hasTextContent;

    let textInstructions = "";
    if (shouldHaveTextInFinalImage) {
        textInstructions = `
IMPORTANT: Generate ONLY the background visual for an event poster. DO NOT add any text, letters, or numbers.
However, you MUST compose the image to leave appropriate, clear, and visually balanced space for text that will be added later.
The text content will be:
- Event Name: "${options.eventName}"
- Baseline: "${options.baseline}"
- Location: "${options.eventLocation}"
- Date: "${options.eventDate}"
Your composition should anticipate this text and provide a natural place for it.
`;
    } else {
        textInstructions = "The image must NOT contain any text, letters, or numbers. It should be a pure background visual.";
    }


    let partnerZoneInstructions = "";
    if (options.reservePartnerZone) {
        partnerZoneInstructions = `
A dedicated, clean, and unobtrusive zone for partner logos must be reserved at the ${options.partnerZonePosition} of the image. This zone must occupy approximately ${options.partnerZoneHeight}% of the total image height. The area should be visually distinct but integrated, perhaps using a subtle gradient or a semi-transparent overlay that complements the main artwork. Do not place any logos in it, just reserve the space.
`;
    }

    const formatMapping: Record<Format, string> = {
        "A3 / A2 (Vertical)": "portrait (2:3 aspect ratio)",
        "4:5 (Vertical)": "portrait (4:5 aspect ratio)",
        "1:1 (Carré)": "square (1:1 aspect ratio)",
        "16:9 (Paysage)": "landscape (16:9 aspect ratio)",
        "9:16 (Story)": "tall portrait (9:16 aspect ratio)",
        "3:1 (Bannière)": "wide landscape banner (3:1 aspect ratio)",
    };

    let basePrompt = `
Create a visually stunning, ultra-high-quality esports event poster background. The style should be modern, dynamic, and professional.

**Core Theme & Style (Primary Instructions):**
- **Composition:** The main subject MUST be centered to avoid being cropped when adapting to other formats.
- **Game Genre:** ${gameType}.
- **Dominant Graphic Style:** ${graphicStyle}.
- **Visual Ambiance:** ${ambiance || 'Decided by the AI to best fit the theme'}.
- **Key Visual Elements:** ${visualElementsInstructions}.
- **Special Effects Intensity:** ${options.effectsIntensity}%. Expect energetic elements like particles, glows, light streaks, and lens flares, balanced according to this intensity.

**Thematic Inspiration (Secondary Instructions):**
${compositionPrompt}

**Text & Layout:**
${textInstructions}
${partnerZoneInstructions}

**CRITICAL QUALITY INSTRUCTIONS:**
1.  **NO MARGINS / FULL BLEED:** This is a critical failure point. The generated image content MUST extend to the absolute edges of the canvas. There should be ZERO margins, borders, or padding of any color (white, black, or otherwise). The design must be "full bleed".
2.  **Professional Quality:** The image must be sharp, detailed, and look like it was made by a professional graphic designer for a major esports event. No artifacts, strange anatomy, or distorted elements.
`;

    if (isAdaptation) {
        basePrompt = `
You are an AI specializing in intelligent image outpainting and scene extension. Your mission is to adapt a provided square, master image to a new aspect ratio, preserving its core subject while seamlessly extending the background.

**PRIMARY DIRECTIVE: PRESERVE THE MASTER IMAGE**
- The original square image provided is the 'zone of interest'. It MUST remain at the center of the new composition.
- The content of this master image must NOT be altered, cropped, scaled, or distorted in any way.

**TASK: INTELLIGENT SCENE EXTENSION**
- Your goal is to generate new visual information ONLY in the areas outside the original square image to fill the target aspect ratio of **${formatMapping[options.format]}**.
- **Coherent Generation:** The new background must be a logical and visually consistent extension of the original scene. Analyze the textures, lighting direction, color palette, and overall artistic style of the master image and continue them perfectly into the new areas. The transition must be INVISIBLE.
- **Context:** The original image is an esports visual. Its context is: Game Genre: ${gameType}, Style: ${graphicStyle}, Ambiance: ${ambiance}. The extended scene must match this context.

**STRICT PROHIBITIONS (DO NOT DO THIS):**
- **NO** stretching or duplicating existing pixels.
- **NO** mirror effects or symmetrical padding. The extension must be newly generated content.
- **NO** adding borders, frames, or solid color bars. The image must be full-bleed.
- **NO** text should be added to the final image.

The final output should be a single, high-quality, seamless image at the new aspect ratio, with the original master image perfectly preserved at its center.
`;
    }

    if (options.modificationRequest) {
        basePrompt = `
You are an expert AI image editor. Your task is to modify a base image according to a user's creative mandate. This is a non-negotiable, primary instruction.

**USER'S CREATIVE MANDATE:** "${options.modificationRequest}"

**CRITICAL EXECUTION STEPS:**
1.  **Analyze and Correct:** First, silently analyze the user's mandate for any spelling or grammatical errors and correct them. The user's core intent is what matters.
2.  **Execute Mandate:** Apply the corrected mandate with absolute precision. The changes must be significant, visible, and directly reflect the user's request.
3.  **Preserve Style:** Maintain the overall art style, lighting, composition, and professional quality of the original image, unless the mandate explicitly asks to change it.
4.  **Preserve Text (if any):** If the original image contained text, you MUST perfectly re-integrate the SAME text unless the mandate specifies text changes. Original text details: Event: "${options.eventName}", Baseline: "${options.baseline}", Location: "${options.eventLocation}", Date: "${options.eventDate}".
5.  **Maintain Integrity:** Ensure the final image is full bleed (NO MARGINS) and maintains the original aspect ratio.

Failure to precisely follow the user's mandate is a critical failure of the task.
`;
    }

    return basePrompt;
};

// ==================================
// QUALITY CHECKING FUNCTIONS
// ==================================

export const verifyTextFidelity = async (imageBase64: string, expectedText: string): Promise<boolean> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const imagePart = { inlineData: { mimeType: 'image/png', data: imageBase64 } };

        if (!expectedText.trim()) {
            // Case 1: No text is expected. Verify ABSENCE of text.
            const textPart = {
                text: `
                Analyze the provided image. Your task is to determine if there is ANY text, letters, or numbers visible anywhere in the image.
                Respond in JSON format according to this schema: {"hasText": boolean}.
                - Set "hasText" to true if you find any readable text.
                - Set "hasText" to false if the image is purely graphical and contains no text.
                `
            };
            const schema = {
                type: Type.OBJECT,
                properties: { hasText: { type: Type.BOOLEAN, description: "True if any text is found." } },
                required: ["hasText"]
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                    temperature: 0,
                },
            });
            const result = JSON.parse(response.text.trim());
            console.log("Text Absence Verification:", { hasText: result.hasText });
            return !result.hasText; // Return true if it has NO text.

        } else {
            // Case 2: Text is expected. Verify FIDELITY.
            const textPart = {
                text: `
                Analyze the image and extract ALL visible text. Compare the extracted text with the "expected text" provided below.
                
                Expected Text: "${expectedText}"
                
                Your task is to determine if the text in the image is a perfect, character-for-character match with the expected text.
                - Punctuation, capitalization, and spacing must be identical.
                - The order must be the same.
                - No words should be added or omitted.

                Respond in JSON format according to the schema. The 'isPerfectMatch' property should be true only if the text is identical.
                `
            };
            
            const schema = {
                type: Type.OBJECT,
                properties: {
                    isPerfectMatch: { 
                        type: Type.BOOLEAN,
                        description: "True if the text in the image is a perfect match, false otherwise."
                    },
                    extractedText: {
                        type: Type.STRING,
                        description: "The text you extracted from the image."
                    }
                },
                required: ["isPerfectMatch", "extractedText"]
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                    temperature: 0,
                },
            });

            const result = JSON.parse(response.text.trim());
            console.log("Text Fidelity Verification:", { expected: expectedText, extracted: result.extractedText, match: result.isPerfectMatch });
            return result.isPerfectMatch;
        }
    } catch (error) {
        handleApiError(error, 'verifyTextFidelity');
    }
};

export const verifyNoMargins = async (imageBase64: string): Promise<boolean> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        
        const imagePart = {
            inlineData: { mimeType: 'image/png', data: imageBase64 },
        };
        const textPart = {
            text: `
            CRITICAL ANALYSIS TASK: IMAGE BORDER DETECTION.

            You are a precision quality control tool. Your ONLY task is to determine if the provided image is "full bleed" (the content extends to all four edges) or if it has any margins or borders.
            
            **DEFINITIONS:**
            - **Full Bleed / No Margins:** The artwork, colors, and textures of the image continue to the absolute edge of the canvas on all four sides (top, bottom, left, right). There is no padding or empty space.
            - **Margins / Borders:** Any solid-colored or patterned band that is distinct from the main artwork and runs along one or more edges of the image. This includes white, black, or any other color of border. Even a 1-pixel wide border is considered a margin.
            
            **INSTRUCTIONS:**
            1.  Scrutinize all four edges of the image.
            2.  Compare the edge pixels to the adjacent artwork. Is there an abrupt, uniform line indicating a border?
            3.  Respond ONLY with JSON according to the provided schema.
            4.  Your analysis must be extremely accurate. A false negative (saying there are no margins when there are) is a critical failure.
            
            **JSON Schema:**
            Respond with {"hasMargins": true} if you detect ANY border on ANY side.
            Respond with {"hasMargins": false} ONLY if the artwork is perfectly full bleed.
            `
        };

        const schema = {
            type: Type.OBJECT,
            properties: {
                hasMargins: { 
                    type: Type.BOOLEAN,
                    description: "True if the image has solid-colored borders, false otherwise."
                }
            },
            required: ["hasMargins"]
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0,
            },
        });

        const result = JSON.parse(response.text.trim());
        const hasMargins = result.hasMargins;

        console.log("Margin Verification:", { hasMargins });

        // The function should return true if there are NO margins.
        return !hasMargins;

    } catch (error) {
        handleApiError(error, 'verifyNoMargins');
    }
};


// ==================================
// CORE IMAGE GENERATION FUNCTIONS
// ==================================

export const determineTextStyle = async (imageBase64: string): Promise<TextStyle> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const imagePart = { inlineData: { mimeType: 'image/png', data: imageBase64 } };
        
        const prompt = `
        You are an expert graphic designer AI. Analyze the provided image for an esports event.
        Your task is to determine the optimal typography style for text overlays. The style must be modern, high-impact, and perfectly integrated with the image's art direction.

        **Analysis:**
        1.  **Font Family:** Suggest a bold, modern, sans-serif font family suitable for esports. Examples: 'Orbitron', 'Teko', 'Exo 2', 'Rajdhani'. Choose one that matches the image's theme (e.g., futuristic, fantasy, minimalist).
        2.  **Color:** Sample colors from the image. Select a primary text color that is bright, energetic, and has the highest possible contrast and readability against the typical text placement areas (top and bottom thirds). Provide this as a hex code (e.g., "#FFFFFF").
        3.  **Effect:** Describe a simple, clean, and professional text effect that enhances readability without being distracting. This should be a concise instruction. Examples: "A subtle white outer glow.", "A tight, dark drop shadow (offset 2px).", "A sharp, dark purple outline (2px width)."

        Respond ONLY with a valid JSON object matching the schema. Do not include any markdown or extra text.
        `;

        const schema = {
            type: Type.OBJECT,
            properties: {
                fontFamily: { type: Type.STRING, description: "Suggested font family name." },
                color: { type: Type.STRING, description: "The hex color code for the text." },
                effect: { type: Type.STRING, description: "A concise description of the text effect." }
            },
            required: ["fontFamily", "color", "effect"]
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.2,
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        handleApiError(error, 'determineTextStyle');
    }
};

export const generateEsportImage = async (
    options: EsportPromptOptions, 
    allPresets: UniversePreset[],
    promptOverride?: string
): Promise<{ imageBase64: string; prompt: string; textVerified: boolean; marginsVerified: boolean }> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        
        const prompt = promptOverride || generateEsportPrompt(options, allPresets);
        
        const textPart = { text: prompt };
        const parts: any[] = [textPart];
        
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

        const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (!imagePart || !imagePart.inlineData) {
            throw new Error("Aucune image n'a été générée par l'API.");
        }
        const imageBase64 = imagePart.inlineData.data;

        // --- Quality Checks in Parallel ---
        const expectedText = ""; // This function only generates the background, so no text is expected.

        const [marginsVerified, textVerified] = await Promise.all([
            verifyNoMargins(imageBase64),
            verifyTextFidelity(imageBase64, expectedText),
        ]);
        
        return { imageBase64, prompt, textVerified, marginsVerified };

    } catch (error) {
        handleApiError(error, 'generateEsportImage');
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
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        
        const prompt = generateTextOverlayPrompt(options, format, textStyle);
        
        const imagePart = { inlineData: { mimeType, data: imageBase64 } };
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const generatedImagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (!generatedImagePart || !generatedImagePart.inlineData) {
            throw new Error("Aucune image n'a été générée lors de l'ajout de texte.");
        }
        const newImageBase64 = generatedImagePart.inlineData.data;
        return { imageBase64: newImageBase64 };
    } catch (error) {
        handleApiError(error, 'addTextToImage');
    }
};

export const adaptEsportImage = async (
    masterImageBase64: string,
    masterImageMimeType: string,
    options: EsportPromptOptions,
    targetFormat: Format
): Promise<{ imageBase64: string }> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        
        const adaptationOptions = { ...options, format: targetFormat };
        const prompt = generateEsportPrompt(adaptationOptions, [], true);

        const imagePart = {
            inlineData: {
                mimeType: masterImageMimeType,
                data: masterImageBase64,
            },
        };
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const generatedImagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (!generatedImagePart || !generatedImagePart.inlineData) {
            throw new Error("Aucune image n'a été générée pendant l'adaptation.");
        }
        const imageBase64 = generatedImagePart.inlineData.data;
        return { imageBase64 };

    } catch (error) {
        handleApiError(error, `adaptEsportImage to ${targetFormat}`);
    }
};

export const correctText = async (textToCorrect: string): Promise<string> => {
    if (!textToCorrect.trim()) {
        return "";
    }
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Correct the grammar, spelling, and syntax of the following French text. Preserve the original meaning. Return only the corrected text, without any introductory phrases like "Here is the corrected text:".

Original text: "${textToCorrect}"

Corrected text:`,
            config: {
                temperature: 0.1,
            }
        });
        return response.text.trim();
    } catch (error) {
        handleApiError(error, 'correctText');
    }
};

export const refinePrompt = async (currentPrompt: string, userFeedback: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `The user wants to refine an image generation prompt.
            
            **Current Prompt:**
            \`\`\`
            ${currentPrompt}
            \`\`\`

            **User's Request for Change:**
            "${userFeedback}"

            **Your Task:**
            Rewrite the prompt to incorporate the user's feedback. Maintain the original structure and critical instructions (like "NO MARGINS"). Only change the parts relevant to the user's request. Output ONLY the complete, new, refined prompt and nothing else.
            `,
            config: {
                temperature: 0.2,
            }
        });

        return response.text.trim();
    } catch (error) {
        handleApiError(error, 'refinePrompt');
    }
};

export const suggestUniversePreset = async (theme: string): Promise<Omit<UniversePreset, 'id' | 'isCustom' | 'dominant'>> => {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });

        const prompt = `
        Based on the user's theme: "${theme}", generate a complete "Universe Preset" for an esports visual generator.
        The response MUST be a valid JSON object matching the schema. Do not include any markdown or extra text.

        **JSON Schema:**
        - "label": (string) A catchy name for the universe (e.g., "Cosmic Gladiators").
        - "description": (string) A short, evocative description of the universe's feel.
        - "gameType": (string) One of: "${GAME_TYPES.map(g => g.value).join('", "')}".
        - "style": (string) One of: "${GRAPHIC_STYLES.map(s => s.value).join('", "')}".
        - "ambiance": (string) One of: "${AMBIANCES.map(a => a.value).join('", "')}".
        - "elements": (string) One of: "${VISUAL_ELEMENTS.map(e => e.value).join('", "')}".
        - "keywords": (array of strings) 5-7 thematic keywords.
        - "colorPalette": (array of 4 strings) 4 hex color codes that define the palette.
        - "influenceWeight": (number) A value between 0.4 and 0.8 representing its creative weight.
        `;

        const schema = {
            type: Type.OBJECT,
            properties: {
                label: { type: Type.STRING },
                description: { type: Type.STRING },
                gameType: { type: Type.STRING },
                style: { type: Type.STRING },
                ambiance: { type: Type.STRING },
                elements: { type: Type.STRING },
                keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
                influenceWeight: { type: Type.NUMBER },
            },
            required: ["label", "description", "gameType", "style", "ambiance", "elements", "keywords", "colorPalette", "influenceWeight"]
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.7,
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        handleApiError(error, 'suggestUniversePreset');
    }
};