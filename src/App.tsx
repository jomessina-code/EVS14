import React, { useState, useEffect, useRef, useCallback } from 'react';
import ControlsPanel from './components/ControlsPanel/ControlsPanel';
import WelcomePanel from './components/WelcomePanel';
import LoadingPanel from './components/LoadingPanel';
import ImageResultPanel from './components/ImageResultPanel';
import Toast from './components/Toast';
import FormatManager from './components/FormatManager';
import PromptEditorModal from './components/ControlsPanel/PromptEditorModal';
import PricingModal from './components/PricingModal';
import { ConfirmationModal, ModificationConfirmationModal } from './components/ConfirmationModal';
import SelectApiKeyPanel from './components/SelectApiKeyPanel';
import type { EsportPromptOptions, QualityCheckResults, GenerationHistoryItem, UniverseId, Format, DerivedImage, ChatMessage, UniversePreset, TextConfig, TextStyle, PromptChangeSummary, TextBlock, SavedSubject, AdaptationRequest } from './types';
import { generateEsportImage, adaptEsportImage, generateEsportPrompt, refinePrompt, suggestUniversePreset, addTextToImage, determineTextStyle, refinePromptForModification, summarizePromptChanges } from './services/geminiService';
import { UNIVERSE_PRESETS } from './constants/options';
import { cropImage } from './utils/image';

type View = 'welcome' | 'loading' | 'result';

const initialOptions: EsportPromptOptions = {
  universes: [],
  gameType: "MOBA",
  graphicStyle: "Cyberpunk / Néon",
  ambiance: "",
  visualElements: "Personnage central",
  visualElementDescriptions: [],
  elementSize: 75,
  format: "1:1 (Carré)",
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
  transparentBackground: false,
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
  
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  
  const [isSuggestingPreset, setIsSuggestingPreset] = useState(false);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  const [loadingState, setLoadingState] = useState({ progress: 0, message: '' });

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isModificationConfirmationOpen, setIsModificationConfirmationOpen] = useState(false);
  const [refinedPromptForConfirmation, setRefinedPromptForConfirmation] = useState<string | null>(null);
  const [promptChangeSummary, setPromptChangeSummary] = useState<PromptChangeSummary | null>(null);
  const [isPreparingModification, setIsPreparingModification] = useState(false);

  const [savedSubjects, setSavedSubjects] = useState<SavedSubject[]>([]);
  
  const [isApiKeyReady, setIsApiKeyReady] = useState(false);

  const isLoading = isGenerating || isModifying || isGeneratingAdaptations || isAssistantResponding || isSuggestingPreset || isPreparingModification;
  
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 5000);
  }, []);
  
  const handleApiError = useCallback((err: unknown) => {
    const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue.";
    if (errorMessage === 'API_KEY_INVALID') {
        showToast("Votre clé API est invalide ou manquante. Veuillez en sélectionner une nouvelle.");
        setIsApiKeyReady(false); // Trigger the selection panel
    } else {
        setError(errorMessage);
        showToast(errorMessage);
    }
    // Reset view and loading states to a safe state
    setView('welcome');
    setIsGenerating(false);
    setIsModifying(false);
    setIsGeneratingAdaptations(false);
    setIsAssistantResponding(false);
    setIsSuggestingPreset(false);
    setIsPreparingModification(false);
    setIsPanelOpen(true);
  }, [showToast]);

  useEffect(() => {
    const checkApiKey = async () => {
      // The `window.aistudio` object might not be available immediately.
      // A short delay can help ensure it's loaded.
      setTimeout(async () => {
        if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
          setIsApiKeyReady(true);
        }
      }, 100);
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    try {
      await window.aistudio.openSelectKey();
      // Optimistically assume key is now selected to unblock the UI and avoid race conditions.
      setIsApiKeyReady(true);
      showToast("Clé API sélectionnée. Vous pouvez maintenant générer des visuels.");
    } catch (e) {
      console.error("Error opening key selection:", e);
      showToast("La sélection de la clé a été annulée ou a échoué.");
    }
  };


  const setOptions: React.Dispatch<React.SetStateAction<EsportPromptOptions>> = (value) => {
    const newOptions = typeof value === 'function' ? value(options) : value;

    if (isPromptCustomized) {
      const PROMPT_AFFECTING_KEYS: (keyof EsportPromptOptions)[] = [
        'universes', 'gameType', 'graphicStyle', 'ambiance', 'visualElements', 
        'inspirationImage', 'eventName', 'baseline', 'eventLocation', 'eventDate',
        'textLock', 'hideText', 'reservePartnerZone', 'partnerZoneHeight', 
        'partnerZonePosition', 'effectsIntensity', 'elementSize', 'transparentBackground',
        'visualElementDescriptions'
      ];

      const hasChanged = PROMPT_AFFECTING_KEYS.some(key => {
        if (key === 'universes' || key === 'visualElementDescriptions') {
            const oldArray = (options[key] as string[]).slice().sort();
            const newArray = ((newOptions as any)[key] || []).slice().sort();
            return JSON.stringify(oldArray) !== JSON.stringify(newArray);
        }
        if (key === 'inspirationImage') {
            return options.inspirationImage?.base64 !== newOptions.inspirationImage?.base64;
        }
        return options[key] !== newOptions[key];
      });

      if (hasChanged) {
        setIsPromptCustomized(false);
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
      const savedSubjectsData = localStorage.getItem('savedSubjects');
      if (savedSubjectsData) {
        setSavedSubjects(JSON.parse(savedSubjectsData));
      }
    } catch (e) {
      console.error("Failed to load custom data from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('customUniversePresets', JSON.stringify(customPresets));
      localStorage.setItem('savedSubjects', JSON.stringify(savedSubjects));
    } catch (e) {
      console.error("Failed to save custom data to localStorage", e);
    }
  }, [customPresets, savedSubjects]);

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
  
  useEffect(() => {
    if (isPromptCustomized) return;
  
    const newPrompt = generateEsportPrompt(options, allPresets, false);
    currentPromptRef.current = newPrompt;
  }, [options, allPresets, isPromptCustomized]);

  const handleOpenPromptEditor = () => {
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
    showToast("Version supprimée de l'historique.");
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
      setIsPromptCustomized(true);
      setPromptHistory(prev => [
        ...prev,
        { sender: 'assistant', text: `J'ai mis à jour le prompt :\n\n${refinedPrompt}` }
      ]);
    } catch (err: unknown) {
      handleApiError(err);
    } finally {
      setIsAssistantResponding(false);
    }
  };
  
  const handleFinalizePrompt = () => {
    setIsPromptEditorOpen(false);
    if(isPromptCustomized) {
      showToast("Prompt mis à jour !");
    }
  };

  const handleRestoreFromHistory = (item: GenerationHistoryItem) => {
    _setOptions(item.options);
    setGeneratedImage(item.imageUrl);
    setMasterImageNoText(item.masterImageNoText || item.imageUrl);
    setCurrentImageOptions(item.options);
    setGeneratedPrompt(item.prompt);
    setQualityCheckResults(item.qualityCheckResults);
    setCurrentTextStyle(item.textStyle || null);
    setIsModificationMode(false);
    setModificationRequest('');
    setView('result');
    setIsPanelOpen(false);
    showToast("Version restaurée depuis l'historique.");
  };

  const handleAddSavedSubject = (description: string) => {
    if (description.trim() && !savedSubjects.some(s => s.description.toLowerCase() === description.toLowerCase().trim())) {
      const newSubject: SavedSubject = { id: Date.now().toString(), description: description.trim() };
      setSavedSubjects(prev => [newSubject, ...prev]);
    }
  };

  const handleDeleteSavedSubject = (subjectId: string) => {
    const subjectToDelete = savedSubjects.find(s => s.id === subjectId);
    if (!subjectToDelete) return;

    setSavedSubjects(prev => prev.filter(s => s.id !== subjectId));
    setOptions(prev => ({
        ...prev,
        visualElementDescriptions: prev.visualElementDescriptions.filter(d => d !== subjectToDelete.description)
    }));
    showToast("Sujet supprimé.");
  };

  const handleSubjectToggle = (description: string) => {
    setOptions(prev => {
        const newDescriptions = prev.visualElementDescriptions.includes(description)
            ? prev.visualElementDescriptions.filter(d => d !== description)
            : [...prev.visualElementDescriptions, description];
        return { ...prev, visualElementDescriptions: newDescriptions };
    });
  };

  const startGeneration = async () => {
    setIsConfirmationModalOpen(false);
    setIsPanelOpen(false);
    setView('loading');
    setIsGenerating(true);
    setError(null);
    setLoadingState({ progress: 0, message: 'Préparation de la génération...' });

    try {
        const finalPrompt = isPromptCustomized ? currentPromptRef.current : generateEsportPrompt(options, allPresets);
        setLoadingState({ progress: 25, message: 'Génération du visuel...' });

        const { imageBase64, prompt, marginsVerified, textVerified } = await generateEsportImage(options, allPresets, finalPrompt);

        setGeneratedPrompt(prompt);
        setMasterImageNoText(imageBase64);
        setCurrentImageOptions(options);
        setQualityCheckResults({ resolution: options.highResolution, ratio: true, margins: marginsVerified, text: textVerified });
        setDerivedImages({} as Record<Format, DerivedImage>);

        const hasText = !options.hideText && (options.eventName || options.baseline || options.eventLocation || options.eventDate);

        if (hasText && !options.transparentBackground) {
            setLoadingState({ progress: 75, message: 'Analyse du style du texte...' });
            const textStyle = await determineTextStyle(imageBase64);
            setCurrentTextStyle(textStyle);
            setLoadingState({ progress: 90, message: 'Ajout du texte...' });
            const { imageBase64: finalImage } = await addTextToImage(imageBase64, 'image/png', options, options.format, textStyle);
            setGeneratedImage(finalImage);
        } else {
            setGeneratedImage(imageBase64);
        }

        addToHistory({
            imageUrl: imageBase64,
            masterImageNoText: imageBase64,
            options,
            prompt,
            qualityCheckResults: { resolution: options.highResolution, ratio: true, margins: marginsVerified, text: textVerified },
            textStyle: currentTextStyle
        });

        setLoadingState({ progress: 100, message: 'Terminé !' });
        setView('result');

    } catch (err: unknown) {
        handleApiError(err);
    } finally {
        setIsGenerating(false);
    }
  };

  const executeModification = async () => {
    if (!refinedPromptForConfirmation || !masterImageNoText) return;
    
    setIsModificationConfirmationOpen(false);
    setView('loading');
    setIsModifying(true);
    setError(null);
    setLoadingState({ progress: 0, message: 'Application de vos modifications...' });

    try {
        const modifiedOptions = { ...currentImageOptions, modificationRequest };
        setLoadingState({ progress: 25, message: 'Génération du nouveau visuel de base...' });

        const { imageBase64: newMasterImageNoText, prompt: newPrompt, marginsVerified, textVerified } = await generateEsportImage(
            modifiedOptions,
            allPresets,
            refinedPromptForConfirmation
        );
        
        setMasterImageNoText(newMasterImageNoText);
        setGeneratedPrompt(newPrompt);
        setCurrentImageOptions(modifiedOptions);
        setModificationRequest('');
        setRefinedPromptForConfirmation(null);
        setPromptChangeSummary(null);
        setLoadingState({ progress: 75, message: 'Analyse du nouveau style...' });
        
        const hasText = !currentImageOptions.hideText && (currentImageOptions.eventName || currentImageOptions.baseline || currentImageOptions.eventLocation || currentImageOptions.eventDate);

        if (hasText && !currentImageOptions.transparentBackground) {
            const newTextStyle = await determineTextStyle(newMasterImageNoText);
            setCurrentTextStyle(newTextStyle);
            setLoadingState({ progress: 90, message: 'Application du texte...' });
            const { imageBase64: finalImage } = await addTextToImage(newMasterImageNoText, 'image/png', currentImageOptions, currentImageOptions.format, newTextStyle);
            setGeneratedImage(finalImage);
        } else {
            setGeneratedImage(newMasterImageNoText);
        }

        addToHistory({
            imageUrl: newMasterImageNoText,
            masterImageNoText: newMasterImageNoText,
            options: modifiedOptions,
            prompt: newPrompt,
            qualityCheckResults: { resolution: true, ratio: true, margins: marginsVerified, text: textVerified },
            textStyle: currentTextStyle,
        });

        setLoadingState({ progress: 100, message: 'Terminé !' });
        setView('result');
    } catch (err: unknown) {
        handleApiError(err);
    } finally {
        setIsModifying(false);
    }
  };
  
  const handleStartModification = async () => {
    if (!modificationRequest.trim() || !generatedPrompt) return;
    setIsModificationMode(false);
    setIsModificationConfirmationOpen(true);
    setIsPreparingModification(true);
    setPromptChangeSummary(null);
    setError(null);

    try {
        const refinedPrompt = await refinePromptForModification(generatedPrompt, modificationRequest);
        setRefinedPromptForConfirmation(refinedPrompt);
        const summary = await summarizePromptChanges(generatedPrompt, refinedPrompt, modificationRequest);
        setPromptChangeSummary(summary);
    } catch(err) {
        handleApiError(err);
        setIsModificationConfirmationOpen(false);
    } finally {
        setIsPreparingModification(false);
    }
  };
  
  const handleGenerateAdaptations = async (adaptations: AdaptationRequest[]) => {
    if (!masterImageNoText) return;
    setIsGeneratingAdaptations(true);

    const newDerivedImages = { ...derivedImages };
    adaptations.forEach(({ format, textConfig, cropArea }) => {
        newDerivedImages[format] = {
            format,
            imageUrl: null,
            isGenerating: true,
            textConfig: textConfig,
            cropArea: cropArea,
        };
    });
    setDerivedImages(newDerivedImages);

    for (const { format, textConfig, cropArea } of adaptations) {
        try {
            const adaptationOptions: EsportPromptOptions = { ...currentImageOptions };
            (Object.keys(textConfig) as TextBlock[]).forEach(key => {
                if (!textConfig[key]) {
                    (adaptationOptions as any)[key] = '';
                }
            });

            let adaptedBase: string;

            if (format === '3:1 (Bannière)' && cropArea && currentImageOptions.format === '1:1 (Carré)') {
                const dataUrl = await cropImage(
                    `data:image/png;base64,${masterImageNoText}`,
                    { x: 0, y: cropArea.y, width: 1, height: 1 / 3 }
                );
                adaptedBase = dataUrl.split(',')[1];
            } else {
                const { imageBase64 } = await adaptEsportImage(masterImageNoText, 'image/png', adaptationOptions, format, cropArea);
                adaptedBase = imageBase64;
            }
            
            const hasText = Object.values(textConfig).some(v => v);
            let finalImage = adaptedBase;
            if (hasText && currentTextStyle) {
                const { imageBase64: adaptedWithText } = await addTextToImage(adaptedBase, 'image/png', adaptationOptions, format, currentTextStyle);
                finalImage = adaptedWithText;
            }

            setDerivedImages(prev => ({
                ...prev,
                [format]: { ...prev[format], imageUrl: finalImage, isGenerating: false },
            }));
        } catch (err: unknown) {
            console.error(`Failed to adapt for format ${format}`, err);
            const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
            showToast(`Erreur format ${format}: ${errorMessage}`);
            setDerivedImages(prev => ({
                ...prev,
                [format]: { ...prev[format], imageUrl: null, isGenerating: false },
            }));
        }
    }

    setIsGeneratingAdaptations(false);
  };
  
  const handleAddPreset = (presetData: Omit<UniversePreset, 'id' | 'isCustom' | 'dominant'>) => {
    const newPreset: UniversePreset = {
        ...presetData,
        id: `custom_${Date.now()}`,
        isCustom: true,
        dominant: false,
    };
    setCustomPresets(prev => [...prev, newPreset]);
    showToast(`Univers "${presetData.label}" créé !`);
  };

  const handleUpdatePreset = (presetId: UniverseId, updatedData: Omit<UniversePreset, 'id' | 'isCustom' | 'dominant'>) => {
      setCustomPresets(prev => prev.map(p => p.id === presetId ? { ...p, ...updatedData } : p));
      showToast(`Univers "${updatedData.label}" mis à jour !`);
  };

  const handleDeletePreset = (presetId: UniverseId) => {
      setCustomPresets(prev => prev.filter(p => p.id !== presetId));
      setOptions(prev => ({
          ...prev,
          universes: prev.universes.filter(id => id !== presetId)
      }));
      showToast(`Univers supprimé.`);
  };

  const handleSuggestPreset = async (theme: string) => {
      setIsSuggestingPreset(true);
      setError(null);
      try {
          const preset = await suggestUniversePreset(theme);
          showToast("Suggestion d'univers générée !");
          return preset;
      } catch (err: unknown) {
          handleApiError(err);
          return null;
      } finally {
          setIsSuggestingPreset(false);
      }
  };
  
  if (!isApiKeyReady) {
    return <SelectApiKeyPanel onSelectKey={handleSelectKey} />;
  }

  return (
    <div className="flex h-full bg-gray-900">
      <div className={`transition-all duration-300 ease-in-out ${isPanelOpen ? 'w-full md:w-[400px] lg:w-[450px]' : 'w-0'} flex-shrink-0 relative h-full`}>
        {isPanelOpen && <ControlsPanel 
          options={options}
          setOptions={setOptions}
          onGenerate={() => setIsConfirmationModalOpen(true)}
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
          savedSubjects={savedSubjects}
          onAddSavedSubject={handleAddSavedSubject}
          onDeleteSavedSubject={handleDeleteSavedSubject}
          onSubjectToggle={handleSubjectToggle}
        />}
      </div>

      <div className="flex-1 flex flex-col relative">
        {!isPanelOpen && (
          <button
            onClick={() => setIsPanelOpen(true)}
            className="absolute top-1/2 -translate-y-1/2 left-0 z-20 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-r-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            aria-label="Ouvrir le panneau de création"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        <main className="flex-1 overflow-y-auto h-full">
          {view === 'welcome' && <WelcomePanel onOpenPricingModal={() => setIsPricingModalOpen(true)} />}
          {view === 'loading' && <LoadingPanel progress={loadingState.progress} message={loadingState.message} />}
          {view === 'result' && generatedImage && (
            <ImageResultPanel
              imageSrc={generatedImage}
              options={currentImageOptions}
              qualityCheckResults={qualityCheckResults}
              prompt={generatedPrompt}
              onRegenerate={() => setIsConfirmationModalOpen(true)}
              onBack={() => { setView('welcome'); setIsPanelOpen(true); }}
              onTargetedRegeneration={handleStartModification}
              isModificationMode={isModificationMode}
              setIsModificationMode={setIsModificationMode}
              modificationRequest={modificationRequest}
              setModificationRequest={setModificationRequest}
              isModifying={isModifying}
              onDecline={() => setIsFormatManagerOpen(true)}
              allPresets={allPresets}
            />
          )}
        </main>
      </div>
      
      <Toast message={toastMessage} />

      <FormatManager
        isOpen={isFormatManagerOpen}
        onClose={() => setIsFormatManagerOpen(false)}
        mainImageSrc={generatedImage || ''}
        mainImageOptions={currentImageOptions}
        onGenerate={handleGenerateAdaptations}
        isGenerating={isGeneratingAdaptations}
        derivedImages={derivedImages}
        allPresets={allPresets}
      />

      <PromptEditorModal
        isOpen={isPromptEditorOpen}
        onClose={() => setIsPromptEditorOpen(false)}
        history={promptHistory}
        onSendMessage={handleRefinePrompt}
        isAssistantResponding={isAssistantResponding}
        onFinalize={handleFinalizePrompt}
      />

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />
      
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={startGeneration}
        options={options}
        allPresets={allPresets}
        isLoading={isGenerating}
      />
      
      <ModificationConfirmationModal
        isOpen={isModificationConfirmationOpen}
        onClose={() => setIsModificationConfirmationOpen(false)}
        onConfirm={executeModification}
        summary={promptChangeSummary}
        isLoading={isPreparingModification || isModifying}
      />
    </div>
  );
};
export default App;
