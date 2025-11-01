import React, { useState, useEffect, useRef } from 'react';
import type { EsportPromptOptions, Format, DerivedImage, TextBlock, TextConfig } from '../types';
import { DECLINATION_FORMATS } from '../constants/formats';
import SpinnerIcon from './icons/SpinnerIcon';
import DownloadIcon from './icons/DownloadIcon';
import { resizeAndCropImage } from '../utils/image';
import ChevronDownIcon from './icons/ChevronDownIcon';

const textBlockLabels: Record<TextBlock, string> = {
    eventName: "Nom de l'événement",
    baseline: "Baseline",
    eventLocation: "Lieu",
    eventDate: "Date",
};

interface TextSelectorProps {
    config: TextConfig | undefined;
    onChange: (newConfig: TextConfig) => void;
    options: EsportPromptOptions;
    disabled: boolean;
}

const TextSelector: React.FC<TextSelectorProps> = ({ config, onChange, options, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    if (!config) return null;

    const handleCheckboxChange = (block: TextBlock) => {
        onChange({ ...config, [block]: !config[block] });
    };

    const availableBlocks = (Object.keys(textBlockLabels) as TextBlock[]).filter(
        block => options[block]?.trim()
    );
    
    const selectedCount = availableBlocks.filter(block => config[block]).length;

    if (availableBlocks.length === 0) {
        return <p className="text-xs text-gray-500 mt-3 text-center">Aucun texte à afficher.</p>;
    }

    return (
        <div className="relative mt-3" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="w-full flex items-center justify-between gap-2 bg-gray-700/60 hover:bg-gray-700 text-white text-sm font-semibold py-2 px-3 rounded-lg transition disabled:opacity-50"
            >
                <span>Texte ({selectedCount}/{availableBlocks.length})</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute bottom-full left-0 w-full bg-gray-600 rounded-lg shadow-lg p-2 z-10 mb-1 border border-gray-500">
                    <div className="space-y-1">
                        {availableBlocks.map(block => (
                            <label key={block} className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-500 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config[block]}
                                    onChange={() => handleCheckboxChange(block)}
                                    className="h-4 w-4 rounded border-gray-400 bg-gray-700 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-200">{textBlockLabels[block]}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


interface FormatManagerProps {
  isOpen: boolean;
  onClose: () => void;
  mainImageSrc: string;
  mainImageOptions: EsportPromptOptions;
  onGenerate: (adaptations: { format: Format, textConfig: TextConfig }[]) => void;
  isGenerating: boolean;
  derivedImages: Record<Format, DerivedImage>;
}

declare const JSZip: any;

const FormatManager: React.FC<FormatManagerProps> = ({
  isOpen,
  onClose,
  mainImageSrc,
  mainImageOptions,
  onGenerate,
  isGenerating,
  derivedImages,
}) => {
  const [selectedFormats, setSelectedFormats] = useState<Set<Format>>(new Set());
  const [isZipping, setIsZipping] = useState(false);
  const [textConfigs, setTextConfigs] = useState<Record<Format, TextConfig>>({} as Record<Format, TextConfig>);

  useEffect(() => {
    if (isOpen) {
        const initialConfigs: Record<Format, TextConfig> = {} as Record<Format, TextConfig>;
        const hasText = (key: TextBlock) => !!mainImageOptions[key]?.trim();
        
        for (const formatDef of DECLINATION_FORMATS) {
            const existingConfig = derivedImages[formatDef.id]?.textConfig;
            if (existingConfig) {
                initialConfigs[formatDef.id] = existingConfig;
            } else {
                initialConfigs[formatDef.id] = {
                    eventName: hasText('eventName'),
                    baseline: hasText('baseline'),
                    eventLocation: hasText('eventLocation'),
                    eventDate: hasText('eventDate'),
                };
            }
        }
        setTextConfigs(initialConfigs);
    }
  }, [isOpen, mainImageOptions, derivedImages]);

  const handleToggleFormat = (format: Format) => {
    setSelectedFormats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(format)) {
        newSet.delete(format);
      } else {
        newSet.add(format);
      }
      return newSet;
    });
  };

  const handleGenerateClick = () => {
    const adaptationsToGenerate = Array.from(selectedFormats).map(format => ({
        format,
        textConfig: textConfigs[format],
    }));
    onGenerate(adaptationsToGenerate);
  };
  
  const handleDownload = async (format: Format, imageUrl: string) => {
    try {
        const formatDef = DECLINATION_FORMATS.find(f => f.id === format);
        if (!formatDef) {
            throw new Error(`Format definition not found for ${format}`);
        }

        const [width, height] = formatDef.dimensions.replace('px', '').split('x').map(Number);
        const resizedImageUrl = await resizeAndCropImage(imageUrl, width, height);

        const link = document.createElement('a');
        link.href = resizedImageUrl;

        const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 50);
        const eventNameSlug = slugify(mainImageOptions.eventName || 'affiche-esport');
        const formatSlug = slugify(formatDef.label);
        
        link.download = `Affiche_${eventNameSlug}_${formatSlug}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error(`Failed to resize and download image for format ${format}:`, error);
        alert(`Une erreur est survenue lors de la préparation du téléchargement pour le format ${format}.`);
    }
  };
  
  const handleDownloadZip = async () => {
    if (typeof JSZip === 'undefined') {
        alert("Erreur: La librairie de compression (JSZip) n'a pas pu être chargée.");
        return;
    }
    setIsZipping(true);
    try {
        const zip = new JSZip();
        const downloadableImages = DECLINATION_FORMATS.map(f => {
            const isMain = mainImageOptions.format === f.id;
            const derived = derivedImages[f.id];
            return {
                format: f.id,
                imageUrl: isMain ? mainImageSrc : derived?.imageUrl,
            };
        }).filter((item): item is { format: Format; imageUrl: string } => !!item.imageUrl);

        const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 50);
        const eventNameSlug = slugify(mainImageOptions.eventName || 'affiche-esport');

        for (const item of downloadableImages) {
            const formatDef = DECLINATION_FORMATS.find(f => f.id === item.format);
            if (!formatDef) {
                console.warn(`Skipping ZIP entry for unknown format: ${item.format}`);
                continue;
            }

            const [width, height] = formatDef.dimensions.replace('px', '').split('x').map(Number);
            const resizedImageUrl = await resizeAndCropImage(item.imageUrl, width, height);
            
            const response = await fetch(resizedImageUrl);
            const blob = await response.blob();
            const formatSlug = slugify(formatDef.label);
            zip.file(`Affiche_${eventNameSlug}_${formatSlug}.png`, blob);
        }

        const content = await zip.generateAsync({ type: 'blob' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `Pack_Affiches_${eventNameSlug}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

    } catch (error) {
        console.error("Failed to create ZIP file", error);
        alert("Une erreur est survenue lors de la création du fichier ZIP.");
    } finally {
        setIsZipping(false);
    }
  };

  if (!isOpen) return null;

  // FIX: Explicitly typed the parameter 'd' in the '.some()' callback to 'DerivedImage' to resolve a TypeScript error where 'd' was being inferred as 'unknown'. This ensures that properties like 'imageUrl' can be safely accessed.
  const hasGeneratedDeclinations = Object.values(derivedImages).some((d: DerivedImage) => d.imageUrl) || DECLINATION_FORMATS.some(f => f.id === mainImageOptions.format);

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in-up"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 p-6 flex justify-between items-center border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold font-orbitron text-purple-300">Déclinaisons Multi-formats</h2>
            <p className="text-gray-400">Adaptez votre visuel à chaque canal de communication.</p>
          </div>
          <button onClick={onClose} disabled={isGenerating || isZipping} className="text-gray-400 hover:text-white text-3xl leading-none disabled:opacity-50">&times;</button>
        </header>
        
        <main className="flex-grow p-6 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {DECLINATION_FORMATS.map(formatDef => {
              const isSelected = selectedFormats.has(formatDef.id);
              const derived = derivedImages[formatDef.id];
              const isMainFormat = mainImageOptions.format === formatDef.id;
              const imageUrl = isMainFormat ? mainImageSrc : derived?.imageUrl;
              const isCurrentlyGenerating = derived?.isGenerating;
              
              return (
                <div key={formatDef.id} className={`bg-gray-900/50 rounded-lg border-2 transition-all ${isSelected && !isMainFormat ? 'border-purple-500' : 'border-gray-700'}`}>
                    <div 
                        className="relative w-full bg-black/20 flex items-center justify-center overflow-hidden rounded-t-md"
                        style={{ aspectRatio: `${formatDef.ratio}` }}
                    >
                        {imageUrl ? (
                            <img src={imageUrl} alt={`Aperçu ${formatDef.label}`} className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-gray-600 text-sm">{formatDef.label}</div>
                        )}
                        {isCurrentlyGenerating && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                                <SpinnerIcon className="w-8 h-8 text-purple-400" />
                            </div>
                        )}
                    </div>

                    <div className="p-4">
                        <div className="flex justify-between items-start">
                             <div>
                                <h3 className="font-bold text-white">{formatDef.label}</h3>
                                <p className="text-xs text-gray-400">{formatDef.description}</p>
                                <p className="text-xs text-gray-500">{formatDef.dimensions}</p>
                             </div>
                             {!isMainFormat && (
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleFormat(formatDef.id)}
                                    className="h-5 w-5 rounded border-gray-500 bg-gray-700 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                    disabled={isGenerating || isZipping}
                                />
                             )}
                        </div>
                        <TextSelector
                            config={textConfigs[formatDef.id]}
                            onChange={(newConfig) => {
                                setTextConfigs(prev => ({ ...prev, [formatDef.id]: newConfig }));
                            }}
                            options={mainImageOptions}
                            disabled={isGenerating || isZipping || isMainFormat}
                        />
                        {imageUrl && (
                             <button
                                onClick={() => handleDownload(formatDef.id, imageUrl)}
                                className="w-full mt-3 flex items-center justify-center gap-2 bg-blue-600/80 hover:bg-blue-600 text-white text-sm font-semibold py-2 px-3 rounded-lg transition"
                             >
                                <DownloadIcon className="w-4 h-4" />
                                Télécharger
                            </button>
                        )}
                    </div>
                </div>
              );
            })}
          </div>
        </main>

        <footer className="flex-shrink-0 p-6 border-t border-gray-700 bg-gray-800/50 flex flex-col sm:flex-row justify-end items-center gap-4">
          {hasGeneratedDeclinations && (
            <button
                onClick={handleDownloadZip}
                disabled={isZipping || isGenerating}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
                {isZipping ? <><SpinnerIcon className="w-5 h-5 mr-2" /> Création du ZIP...</> : '📦 Télécharger tout (ZIP)'}
            </button>
          )}
          <button
            onClick={handleGenerateClick}
            disabled={isGenerating || isZipping || selectedFormats.size === 0}
            className="w-full sm:w-96 flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition"
          >
            {isGenerating ? (
              <>
                <SpinnerIcon className="w-5 h-5 mr-3" />
                Génération des déclinaisons...
              </>
            ) : `🖼️ Générer ${selectedFormats.size} déclinaison(s)`}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default FormatManager;