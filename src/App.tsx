
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ControlsPanel from './components/ControlsPanel/ControlsPanel';
import WelcomePanel from './components/WelcomePanel';
import LoadingPanel from './components/LoadingPanel';
import ImageResultPanel from './components/ImageResultPanel';
import Toast from './components/Toast';
import FormatManager from './components/FormatManager';
import PromptEditorModal from './components/ControlsPanel/PromptEditorModal';
import PricingModal from './components/PricingModal'; // Import the new modal
import type { EsportPromptOptions, QualityCheckResults, GenerationHistoryItem, UniverseId, Format, DerivedImage, ChatMessage, UniversePreset, TextConfig, TextStyle } from './types';
import { generateEsportImage, adaptEsportImage, generateEsportPrompt, refinePrompt, suggestUniversePreset, verifyNoMargins, verifyTextFidelity, addTextToImage, determineTextStyle } from './services/geminiService';
import { UNIVERSE_PRESETS } from './constants/options';

type View = 'welcome' | 'loading' | 'result';

const initialOptions: EsportPromptOptions = {
  universes: [],
  gameType: "MOBA",
  graphicStyle: "Cyberpunk / Néon",
  ambiance: "",
  visualElements: "Personnage central",
  elementSize: 75,
  format: "A3 / A2 (Vertical)",
  effectsIntensity: 50,
  language: "français",
  customPrompt: "",
  inspirationImage: null,
  eventName: "",
  baseline: "",
  eventLocation: "",
  eventDate: "",
  textLock: true,
  reservePartnerZone: false,
  partnerZoneHeight: 8,
  partnerZonePosition: 'bottom',
  highResolution: true,
  hideText: false,
};

const App: React.FC = () => {
  const [options, _setOptions] = useState<EsportPromptOptions>(initialOptions);
  const [currentImageOptions, setCurrentImageOptions] = useState<EsportPromptOptions>(initialOptions);
  const [view, setView] = useState<View>('welcome');

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [masterImageNoText, setMasterImageNoText] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [currentTextStyle, setCurrentTextStyle] = useState<TextStyle | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  
  const [qualityCheckResults, setQualityCheckResults] = useState<QualityCheckResults | null>(null);
  
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);
  
  const [error, setError] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string>('');

  const [isModificationMode, setIsModificationMode] = useState(false);
  const [modificationRequest, setModificationRequest] = useState('');
  
  const [isFormatManagerOpen, setIsFormatManagerOpen] = useState(false);
  const [derivedImages, setDerivedImages] = useState<Record<Format, DerivedImage>>({} as Record<Format, DerivedImage>);
  const [isGeneratingAdaptations, setIsGeneratingAdaptations] = useState(false);

  // State for the new prompt editor chat
  const [promptHistory, setPromptHistory] = useState<ChatMessage[]>([]);
  const [isAssistantResponding, setIsAssistantResponding] = useState(false);
  const currentPromptRef = useRef<string>('');
  const [isPromptEditorOpen, setIsPromptEditorOpen] = useState(false);
  const [isPromptCustomized, setIsPromptCustomized] = useState(false);
  
  const [customPresets, setCustomPresets] = useState<UniversePreset[]>([]);
  
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false); // State for pricing modal
  
  const [isSuggestingPreset, setIsSuggestingPreset] = useState(false);

  const [isPanelOpen, setIsPanelOpen] = useState(window.innerWidth >= 768);
  
  const [loadingState, setLoadingState] = useState({ progress: 0, message: '' });

  const isLoading = isGenerating || isModifying || isGeneratingAdaptations || isAssistantResponding || isSuggestingPreset;
  
    const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 5000);
  }, []);

  const setOptions: React.Dispatch<React.SetStateAction<EsportPromptOptions>> = (value) => {
    const newOptions = typeof value === 'function' ? value(options) : value;

    if (isPromptCustomized) {
      // Any change to an option that affects the prompt should reset the customization.
      const PROMPT_AFFECTING_KEYS: (keyof EsportPromptOptions)[] = [
        'universes', 'gameType', 'graphicStyle', 'ambiance', 'visualElements', 
        'inspirationImage', 'eventName', 'baseline', 'eventLocation', 'eventDate',
        'textLock', 'hideText', 'reservePartnerZone', 'partnerZoneHeight', 
        'partnerZonePosition', 'effectsIntensity', 'elementSize'
      ];

      const hasChanged = PROMPT_AFFECTING_KEYS.some(key => {
        if (key === 'universes') {
          const oldUniverses = options.universes.slice().sort();
          const newUniverses = (newOptions.universes || []).slice().sort();
          return JSON.stringify(oldUniverses) !== JSON.stringify(newUniverses);
        }
        if (key === 'inspirationImage') {
            return options.inspirationImage?.base64 !== newOptions.inspirationImage?.base64;
        }
        return options[key] !== newOptions[key];
      });

      if (hasChanged) {
        setIsPromptCustomized(false);
        // The reset is now silent for a smoother UX.
        // showToast("🎨 Options modifiées, le prompt personnalisé a été réinitialisé.");
      }
    }
    
    _setOptions(newOptions);
  };

  useEffect(() => {
    try {
      const savedCustomPresets = localStorage.getItem('customUniversePresets');
      if (savedCustomPresets) {
        setCustomPresets(JSON.parse(savedCustomPresets));
      }
    } catch (e) {
      console.error("Failed to load custom presets from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('customUniversePresets', JSON.stringify(customPresets));
    } catch (e) {
      console.error("Failed to save custom presets to localStorage", e);
    }
  }, [customPresets]);

  const allPresets = [...UNIVERSE_PRESETS, ...customPresets];


  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('generationHistory');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('generationHistory', JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history to localStorage", e);
    }
  }, [history]);
  
  // Effect to update the prompt based on options, if it has not been manually customized
  useEffect(() => {
    if (isPromptCustomized) return;
  
    const newPrompt = generateEsportPrompt(options, allPresets, false);
    currentPromptRef.current = newPrompt;
  }, [options, allPresets, isPromptCustomized]);

  const handleOpenPromptEditor = () => {
    // When opening the modal, initialize the chat history based on the current prompt
    setPromptHistory([
      {
        sender: 'assistant',
        text: `Voici le prompt actuel basé sur vos choix :\n\n${currentPromptRef.current}`
      }
    ]);
    setIsPromptEditorOpen(true);
  };

  const addToHistory = useCallback((item: Omit<GenerationHistoryItem, 'id' | 'timestamp'>) => {
    const newHistoryItem: GenerationHistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    setHistory(prev => [newHistoryItem, ...prev.slice(0, 19)]);
  }, []);
  
  const handleDeleteHistoryItem = (itemId: string) => {
    setHistory(prev => prev.filter(item => item.id !== itemId));
    showToast("🗑️ Version supprimée de l'historique.");
  };

  const handleUniverseToggle = (universeId: UniverseId) => {
    setOptions(prev => {
        const newUniverses = prev.universes.includes(universeId)
            ? prev.universes.filter(u => u !== universeId)
            : [...prev.universes, universeId];

        let newOptions = { ...prev, universes: newUniverses };

        if (newUniverses.length === 1) {
            const preset = allPresets.find(p => p.id === newUniverses[0]);
            if (preset) {
                newOptions.gameType = preset.gameType;
                newOptions.graphicStyle = preset.style;
                newOptions.ambiance = preset.ambiance;
                newOptions.visualElements = preset.elements;
            }
        }
        return newOptions;
    });
  };

  const handleRefinePrompt = async (userFeedback: string) => {
    setIsAssistantResponding(true);
    setPromptHistory(prev => [...prev, { sender: 'user', text: userFeedback }]);
    
    try {
      const refinedPrompt = await refinePrompt(currentPromptRef.current, userFeedback);
      currentPromptRef.current = refinedPrompt;
      setIsPromptCustomized(true); // Mark prompt as customized
      setPromptHistory(prev => [
        ...prev,
        { sender: 'assistant', text: `J'ai mis à jour le prompt :\n\n${refinedPrompt}` }
      ]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue.";
      showToast(`❌ Erreur de l'assistant: ${errorMessage}`);
      setPromptHistory(prev => [
        ...prev,
        { sender: 'assistant', text: `Désolé, une erreur est survenue. Veuillez réessayer.` }
      ]);
    } finally {
      setIsAssistantResponding(false);
    }
  };
  
  const handleFinalizePrompt = () => {
    setIsPromptEditorOpen(false);
    showToast("✅ Prompt validé ! Vous pouvez lancer la génération.");
  };
  
  const handleAddPreset = (presetData: Omit<UniversePreset, 'id' | 'isCustom' | 'dominant'>) => {
    const newPreset: UniversePreset = {
      ...presetData,
      id: `custom_${Date.now()}`,
      isCustom: true,
      dominant: false,
    };
    setCustomPresets(prev => [...prev, newPreset]);
    showToast(`✅ Preset "${newPreset.label}" créé !`);
  };

  const handleUpdatePreset = (presetId: UniverseId, updatedData: Omit<UniversePreset, 'id' | 'isCustom' | 'dominant'>) => {
    setCustomPresets(prev => prev.map(p => {
      if (p.id === presetId) {
        return {
          ...p,
          ...updatedData,
        };
      }
      return p;
    }));
    showToast(`✅ Preset "${updatedData.label}" mis à jour !`);
  };

  const handleDeletePreset = (presetId: UniverseId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce preset ? Cette action est irréversible.")) {
      setCustomPresets(prev => prev.filter(p => p.id !== presetId));
      setOptions(prev => ({
        ...prev,
        universes: prev.universes.filter(id => id !== presetId)
      }));
      showToast("🗑️ Preset supprimé.");
    }
  };

  const handleSuggestPreset = async (theme: string): Promise<Omit<UniversePreset, 'id' | 'isCustom' | 'dominant'> | null> => {
    setIsSuggestingPreset(true);
    setError(null);
    try {
        const newPresetData = await suggestUniversePreset(theme);
        showToast(`💡 Suggestion "${newPresetData.label}" prête !`);
        return newPresetData;
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Erreur lors de la suggestion d'univers.";
        showToast(`❌ Erreur: ${errorMessage}`);
        return null;
    } finally {
        setIsSuggestingPreset(false);
    }
  };

    const runGenerationPipeline = useCallback(async (
        pipelineOptions: EsportPromptOptions,
        pipelinePromptOverride?: string
    ) => {
        setIsGenerating(true);
        setView('loading');
        setLoadingState({ progress: 10, message: 'Initialisation de la matrice créative...' });

        try {
            // Step 1: Generate a 1:1 square text-free base image for better composition.
            setLoadingState({ progress: 20, message: 'Génération du fond visuel...' });
            const optionsForSquare: EsportPromptOptions = { ...pipelineOptions, format: "1:1 (Carré)" };
            const { imageBase64: squareBase64_noText, prompt: actualPrompt } = await generateEsportImage(
                optionsForSquare,
                allPresets,
                pipelinePromptOverride
            );
            
            const masterImageForAdaptation = `data:image/png;base64,${squareBase64_noText}`;
            setMasterImageNoText(masterImageForAdaptation);

            // Step 2: Determine text style from the master image.
            setLoadingState({ progress: 40, message: 'Analyse du style typographique...' });
            const newTextStyle = await determineTextStyle(squareBase64_noText);
            setCurrentTextStyle(newTextStyle);

            // Step 3: Adapt the square image to the target format if it's not square.
            let finalImageBase64_noText = squareBase64_noText;
            if (pipelineOptions.format !== "1:1 (Carré)") {
                setLoadingState({ progress: 50, message: 'Extension de l\'univers pour le format final...' });
                const { imageBase64: adaptedImageBase64_noText } = await adaptEsportImage(
                    squareBase64_noText, 'image/png', pipelineOptions, pipelineOptions.format
                );
                finalImageBase64_noText = adaptedImageBase64_noText;
            }
            
            // Step 4: Add text to the final format if required, using the determined style.
            let finalImageBase64_withText = finalImageBase64_noText;
            const hasTextContent = !!(pipelineOptions.eventName.trim() || pipelineOptions.baseline.trim() || pipelineOptions.eventLocation.trim() || pipelineOptions.eventDate.trim());
            const shouldHaveText = !pipelineOptions.hideText && hasTextContent;

            if (shouldHaveText) {
                setLoadingState({ progress: 80, message: 'Intégration de la typographie...' });
                const { imageBase64: imageWithText } = await addTextToImage(
                    finalImageBase64_noText, 'image/png', pipelineOptions, pipelineOptions.format, newTextStyle
                );
                finalImageBase64_withText = imageWithText;
            }

            // Step 5: Run quality checks.
            setLoadingState({ progress: 90, message: 'Application des finitions et contrôle qualité...' });
            const expectedText = (shouldHaveText && pipelineOptions.textLock)
                ? `${pipelineOptions.eventName} ${pipelineOptions.baseline} ${pipelineOptions.eventLocation} ${pipelineOptions.eventDate}`.replace(/\s+/g, ' ').trim()
                : "";

            const [marginsVerified, textVerified] = await Promise.all([
                verifyNoMargins(finalImageBase64_withText),
                verifyTextFidelity(finalImageBase64_withText, expectedText),
            ]);
            const finalQualityCheckResults = { resolution: pipelineOptions.highResolution, ratio: true, margins: marginsVerified, text: textVerified };
            
            // Step 6: Update UI state.
            const finalImageUrl = `data:image/png;base64,${finalImageBase64_withText}`;
            setGeneratedImage(finalImageUrl);
            setGeneratedPrompt(actualPrompt);
            setCurrentImageOptions(pipelineOptions);
            setQualityCheckResults(finalQualityCheckResults);
            
            setView('result');
            showToast("✅ Visuel principal généré !");
            addToHistory({ 
                imageUrl: finalImageUrl, 
                masterImageNoText: masterImageForAdaptation,
                options: pipelineOptions, 
                prompt: actualPrompt, 
                qualityCheckResults: finalQualityCheckResults,
                textStyle: newTextStyle
            });
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Erreur lors de la génération du visuel.";
            showToast(`❌ Erreur: ${errorMessage}`);
            setView('welcome');
        } finally {
            setIsGenerating(false);
        }
    }, [allPresets, addToHistory, showToast]);


  const handleGenerate = useCallback(() => {
    setIsPanelOpen(false);
    setIsModificationMode(false);
    setDerivedImages({} as Record<Format, DerivedImage>);
    setMasterImageNoText(null);
    runGenerationPipeline(options, isPromptCustomized ? currentPromptRef.current : undefined);
  }, [options, isPromptCustomized, runGenerationPipeline]);

  const handleGenerateVariation = async () => {
    setDerivedImages({} as Record<Format, DerivedImage>);
    // We pass the prompt from the *previous* generation to get a true variation of it
    runGenerationPipeline(currentImageOptions, generatedPrompt);
  };

  const handleTargetedRegeneration = async () => {
    if (!modificationRequest.trim()) {
      showToast("Veuillez préciser ce que vous souhaitez modifier.");
      return;
    }
    if (!generatedImage) return;

    setIsModificationMode(false);
    setIsModifying(true);
    setError(null);
    setView('loading');
    setLoadingState({ progress: 10, message: 'Analyse de la demande de modification...' });

    const previousImage = generatedImage;

    setTimeout(async () => {
        try {
            setLoadingState({ progress: 30, message: 'Préparation de la retouche créative...' });
            
            const base64 = previousImage.split(',')[1];
            const mimeType = previousImage.match(/:(.*?);/)?.[1] || 'image/png';

            const modificationOptions: EsportPromptOptions = {
                ...currentImageOptions,
                inspirationImage: { base64, mimeType },
                modificationRequest: modificationRequest,
            };
            
            // Step 1: Generate new background based on modification request.
            setLoadingState({ progress: 60, message: 'Application des modifications...' });
            const { imageBase64: newBgBase64, prompt: newPrompt } = await generateEsportImage(modificationOptions, allPresets);
            
            // Step 2: Determine a new text style for the modified background.
            setLoadingState({ progress: 75, message: 'Recalcul du style typographique...' });
            const newTextStyle = await determineTextStyle(newBgBase64);
            setCurrentTextStyle(newTextStyle);
            // The modified image becomes the new text-free master for this format.
            // This implicitly resets the adaptations.
            setMasterImageNoText(`data:image/png;base64,${newBgBase64}`);
            
            // Step 3: Add text to the new background.
            let finalImageBase64 = newBgBase64;
            const hasTextContent = !!(currentImageOptions.eventName.trim() || currentImageOptions.baseline.trim() || currentImageOptions.eventLocation.trim() || currentImageOptions.eventDate.trim());
            const shouldHaveText = !currentImageOptions.hideText && hasTextContent;

            if (shouldHaveText) {
                setLoadingState({ progress: 85, message: 'Intégration de la typographie...' });
                const { imageBase64: imageWithText } = await addTextToImage(
                    newBgBase64, 'image/png', currentImageOptions, currentImageOptions.format, newTextStyle
                );
                finalImageBase64 = imageWithText;
            }

            // Step 4: Final quality checks and state update.
            setLoadingState({ progress: 90, message: 'Finalisation et contrôle qualité...' });
            const imageUrl = `data:image/png;base64,${finalImageBase64}`;
            const expectedText = (shouldHaveText && currentImageOptions.textLock)
                ? `${currentImageOptions.eventName} ${currentImageOptions.baseline} ${currentImageOptions.eventLocation} ${currentImageOptions.eventDate}`.replace(/\s+/g, ' ').trim()
                : "";
            
            const [marginsVerified, textVerified] = await Promise.all([
                verifyNoMargins(finalImageBase64),
                verifyTextFidelity(finalImageBase64, expectedText),
            ]);

            const newQualityCheckResults: QualityCheckResults = {
              resolution: currentImageOptions.highResolution, ratio: true, margins: marginsVerified, text: textVerified,
            };

            setGeneratedImage(imageUrl);
            setGeneratedPrompt(newPrompt);
            setCurrentImageOptions(currentImageOptions); // Options don't change, just the request
            setQualityCheckResults(newQualityCheckResults);
            setDerivedImages({} as Record<Format, DerivedImage>); // Reset adaptations
            
            addToHistory({ imageUrl, options: modificationOptions, prompt: newPrompt, qualityCheckResults: newQualityCheckResults, textStyle: newTextStyle });
            setModificationRequest('');
            showToast("✅ Modification appliquée !");
            setView('result');

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Erreur lors de la modification de l'image.";
            showToast(`❌ Erreur: ${errorMessage}`);
            setGeneratedImage(previousImage);
            setView('result');
        } finally {
            setIsModifying(false);
        }
    }, 100);
  };

  const handleGenerateAdaptations = async (adaptationsToGenerate: { format: Format; textConfig: TextConfig }[]) => {
    const baseImageForAdaptation = masterImageNoText || generatedImage;
    if (!baseImageForAdaptation) {
        showToast("❌ Aucun visuel principal à décliner.");
        return;
    }
    if (!currentTextStyle) {
        showToast("❌ Style de texte non défini. Veuillez régénérer le visuel principal.");
        return;
    }

    setIsGeneratingAdaptations(true);
    setError(null);

    const initialDerived: Record<Format, DerivedImage> = { ...derivedImages };
    adaptationsToGenerate.forEach(({ format, textConfig }) => {
        initialDerived[format] = { format, imageUrl: null, isGenerating: true, textConfig };
    });
    setDerivedImages(initialDerived);

    const masterImageBase64 = baseImageForAdaptation.split(',')[1];
    const masterImageMimeType = baseImageForAdaptation.match(/:(.*?);/)?.[1] || 'image/png';

    try {
        const adaptationPromises = adaptationsToGenerate.map(async ({ format, textConfig }) => {
            try {
                // Step 1: Adapt the text-free base image.
                const { imageBase64: adaptedImageBase64_noText } = await adaptEsportImage(
                    masterImageBase64,
                    masterImageMimeType,
                    currentImageOptions,
                    format
                );

                let finalAdaptedImageBase64 = adaptedImageBase64_noText;

                // Step 2: Create format-specific options for text generation.
                const formatSpecificOptions = { ...currentImageOptions };
                if (!textConfig.eventName) formatSpecificOptions.eventName = '';
                if (!textConfig.baseline) formatSpecificOptions.baseline = '';
                if (!textConfig.eventLocation) formatSpecificOptions.eventLocation = '';
                if (!textConfig.eventDate) formatSpecificOptions.eventDate = '';
                
                const shouldHaveTextForThisFormat = formatSpecificOptions.eventName || formatSpecificOptions.baseline || formatSpecificOptions.eventLocation || formatSpecificOptions.eventDate;

                // Step 3: Add text to the adapted image if needed, using the CONSISTENT style.
                if (shouldHaveTextForThisFormat) {
                    const { imageBase64: imageWithText } = await addTextToImage(
                        adaptedImageBase64_noText,
                        'image/png',
                        formatSpecificOptions,
                        format,
                        currentTextStyle // Pass the same style to all adaptations
                    );
                    finalAdaptedImageBase64 = imageWithText;
                }

                return { format, imageUrl: `data:image/png;base64,${finalAdaptedImageBase64}`, isGenerating: false, textConfig };
            } catch (e) {
                console.error(`Failed to adapt format ${format}`, e);
                return { format, imageUrl: null, isGenerating: false, textConfig };
            }
        });

        const results = await Promise.all(adaptationPromises);

        setDerivedImages(prev => {
            const newDerived = { ...prev };
            results.forEach(result => {
                newDerived[result.format] = result;
            });
            return newDerived;
        });
        showToast(`✅ ${results.filter(r => r.imageUrl).length} déclinaisons adaptées !`);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erreur lors de l'adaptation des déclinaisons.";
        showToast(`❌ Erreur: ${errorMessage}`);
    } finally {
        setIsGeneratingAdaptations(false);
    }
};
  
  const handleBackToControls = () => {
      setView('welcome');
      setGeneratedImage(null);
      setGeneratedPrompt('');
      setQualityCheckResults(null);
      setIsModificationMode(false);
  }

  const handleRestoreFromHistory = (item: GenerationHistoryItem) => {
    const optionsWithDefaults = {
      ...initialOptions, // Start with defaults to ensure all keys are present
      ...item.options,
      elementSize: item.options.elementSize ?? 75,
    };

    setOptions(optionsWithDefaults);
    setGeneratedImage(item.imageUrl);
    setGeneratedPrompt(item.prompt);
    setCurrentImageOptions(optionsWithDefaults);
    setCurrentTextStyle(item.textStyle || null);
    setMasterImageNoText(item.masterImageNoText || null);
    setDerivedImages({} as Record<Format, DerivedImage>);
    
    if (item.qualityCheckResults) {
      setQualityCheckResults(item.qualityCheckResults);
    } else {
      // Fallback for old history items from localStorage
      setQualityCheckResults({
        resolution: optionsWithDefaults.highResolution,
        ratio: true,
        margins: true, // Cannot verify old images, default to true
        text: true, // Assume text was okay
      });
    }

    setView('result');
    setIsModificationMode(false);
    setIsPanelOpen(false);
    showToast("📜 Version restaurée depuis l'historique.");
  }

  const renderContentPanel = () => {
    switch (view) {
      case 'loading':
        return <LoadingPanel progress={loadingState.progress} message={loadingState.message} />;
      case 'result':
        return generatedImage ? (
            <ImageResultPanel
              imageSrc={generatedImage}
              options={currentImageOptions}
              qualityCheckResults={qualityCheckResults}
              prompt={generatedPrompt}
              onRegenerate={handleGenerateVariation}
              onBack={handleBackToControls}
              onTargetedRegeneration={handleTargetedRegeneration}
              isModificationMode={isModificationMode}
              setIsModificationMode={setIsModificationMode}
              modificationRequest={modificationRequest}
              setModificationRequest={setModificationRequest}
              isModifying={isModifying}
              onDecline={() => setIsFormatManagerOpen(true)}
            />
          ) : <WelcomePanel onOpenPricingModal={() => setIsPricingModalOpen(true)} />;
      case 'welcome':
      default:
        return <WelcomePanel onOpenPricingModal={() => setIsPricingModalOpen(true)} />;
    }
  };

  return (
    <div className="relative h-screen bg-gray-900 text-white font-inter overflow-hidden">
      {!isPanelOpen && (
        <button
          onClick={() => setIsPanelOpen(true)}
          className="absolute top-1/2 -translate-y-1/2 left-0 z-30 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-r-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-l-none"
          aria-label="Ouvrir le panneau de création"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <main className="flex h-full">
        <aside className={`absolute top-0 left-0 z-20 w-full max-w-md bg-gray-800 h-full transition-transform duration-300 ease-in-out transform ${isPanelOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <ControlsPanel
            options={options}
            setOptions={setOptions}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            error={error}
            setError={setError}
            history={history}
            onRestoreFromHistory={handleRestoreFromHistory}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onUniverseToggle={handleUniverseToggle}
            onOpenPromptEditor={handleOpenPromptEditor}
            allPresets={allPresets}
            onAddPreset={handleAddPreset}
            onUpdatePreset={handleUpdatePreset}
            onDeletePreset={handleDeletePreset}
            onSuggestPreset={handleSuggestPreset}
            isSuggestingPreset={isSuggestingPreset}
            onClosePanel={() => setIsPanelOpen(false)}
          />
        </aside>

        <div className="flex-1 relative overflow-y-auto">
          {renderContentPanel()}
        </div>
      </main>

      <Toast message={toastMessage} />
      
      {isFormatManagerOpen && (
        <FormatManager
          isOpen={isFormatManagerOpen}
          onClose={() => setIsFormatManagerOpen(false)}
          mainImageSrc={generatedImage!}
          mainImageOptions={currentImageOptions}
          onGenerate={handleGenerateAdaptations}
          isGenerating={isGeneratingAdaptations}
          derivedImages={derivedImages}
        />
      )}

      {isPromptEditorOpen && (
        <PromptEditorModal
          isOpen={isPromptEditorOpen}
          onClose={() => setIsPromptEditorOpen(false)}
          history={promptHistory}
          onSendMessage={handleRefinePrompt}
          isAssistantResponding={isAssistantResponding}
          onFinalize={handleFinalizePrompt}
        />
      )}
      
      {isPricingModalOpen && (
        <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} />
      )}
    </div>
  );
};

export default App;
