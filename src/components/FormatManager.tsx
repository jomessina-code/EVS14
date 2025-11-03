

import React, { useState, useEffect, useRef } from 'react';
import type { EsportPromptOptions, Format, DerivedImage, TextBlock, TextConfig, AdaptationRequest, CropArea, UniversePreset } from '../types';
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
  onGenerate: (adaptations: AdaptationRequest[]) => void;
  isGenerating: boolean;
  derivedImages: Record<Format, DerivedImage>;
  allPresets: UniversePreset[];
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
  allPresets,
}) => {
  const [selectedFormats, setSelectedFormats] = useState<Set<Format>>(new Set());
  const [isZipping, setIsZipping] = useState(false);
  const [textConfigs, setTextConfigs] = useState<Record<Format, TextConfig>>({} as Record<Format, TextConfig>);
  
  const [bannerCrop, setBannerCrop] = useState<CropArea>({ y: 1/3 }); 
  const [forceBannerRecrop, setForceBannerRecrop] = useState(false);

  const [landscapeCrop, setLandscapeCrop] = useState<CropArea>({ y: (1 - 9 / 16) / 2 });
  const [forceLandscapeRecrop, setForceLandscapeRecrop] = useState(false);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const initialCropYRef = useRef(0);
  

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
    const adaptationsToGenerate = Array.from(selectedFormats).map((format: Format) => {
      const adaptation: AdaptationRequest = {
        format,
        textConfig: textConfigs[format],
      };
      if (format === '3:1 (Bannière)') {
        adaptation.cropArea = bannerCrop;
      }
      if (format === '16:9 (Paysage)') {
        adaptation.cropArea = landscapeCrop;
      }
      return adaptation;
    });
    onGenerate(adaptationsToGenerate);
    setSelectedFormats(new Set());
    setForceBannerRecrop(false);
    setForceLandscapeRecrop(false);
  };
  
  const handleDownload = async (format: Format, imageUrl: string) => {
    try {
        const formatDef = DECLINATION_FORMATS.find(f => f.id === format);
        if (!formatDef) {
            throw new Error(`Format definition not found for ${format}`);
        }

        const [width, height] = formatDef.dimensions.replace('px', '').split('x').map(Number);
        const resizedImageUrl = await resizeAndCropImage(`data:image/png;base64,${imageUrl}`, width, height);

        const link = document.createElement('a');
        link.href = resizedImageUrl;

        const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').slice(0, 50);
        
        const selectedUniverses = allPresets
            .filter(p => mainImageOptions.universes.includes(p.id))
            .map(p => p.label)
            .join(' ');
        
        const universeSlug = selectedUniverses ? slugify(selectedUniverses) : 'univers-personnalise';
        const formatSlug = slugify(formatDef.label);
        const dimensions = formatDef.dimensions;
        
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const timestamp = `${year}-${month}-${day}_${hours}${minutes}`;
        
        link.download = `${universeSlug}_${formatSlug}_${dimensions}_${timestamp}.png`;
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

        const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').slice(0, 50);
        
        const selectedUniverses = allPresets
            .filter(p => mainImageOptions.universes.includes(p.id))
            .map(p => p.label)
            .join(' ');
        
        const universeSlug = selectedUniverses ? slugify(selectedUniverses) : 'univers-personnalise';

        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const timestamp = `${year}-${month}-${day}_${hours}${minutes}`;

        for (const item of downloadableImages) {
            const formatDef = DECLINATION_FORMATS.find(f => f.id === item.format);
            if (!formatDef) {
                console.warn(`Skipping ZIP entry for unknown format: ${item.format}`);
                continue;
            }

            const [width, height] = formatDef.dimensions.replace('px', '').split('x').map(Number);
            const resizedImageUrl = await resizeAndCropImage(`data:image/png;base64,${item.imageUrl}`, width, height);
            
            const response = await fetch(resizedImageUrl);
            const blob = await response.blob();
            const formatSlug = slugify(formatDef.label);
            const dimensions = formatDef.dimensions;
            zip.file(`${universeSlug}_${formatSlug}_${dimensions}_${timestamp}.png`, blob);
        }

        const content = await zip.generateAsync({ type: 'blob' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `Pack_Visuels_${universeSlug}_${timestamp}.zip`;
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

  // BANNER Drag Logic
  const updateBannerCropPosition = (clientY: number) => {
    if (!isDraggingRef.current || !imageContainerRef.current) return;
    const containerHeight = imageContainerRef.current.offsetHeight;
    if (containerHeight === 0) return;
    const deltaY = clientY - dragStartYRef.current;
    const deltaYPercent = deltaY / containerHeight;
    const bannerHeightPercent = 1 / 3;
    const max_y = 1 - bannerHeightPercent;
    const newY = Math.max(0, Math.min(max_y, initialCropYRef.current + deltaYPercent));
    setBannerCrop({ y: newY });
  };
  const handleBannerDragMove = (e: MouseEvent) => updateBannerCropPosition(e.clientY);
  const handleBannerDragEnd = () => {
    isDraggingRef.current = false;
    window.removeEventListener('mousemove', handleBannerDragMove);
    window.removeEventListener('mouseup', handleBannerDragEnd);
  };
  const handleBannerDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartYRef.current = e.clientY;
    initialCropYRef.current = bannerCrop.y;
    window.addEventListener('mousemove', handleBannerDragMove);
    window.addEventListener('mouseup', handleBannerDragEnd);
  };
  const handleBannerTouchMove = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    updateBannerCropPosition(e.touches[0].clientY);
  };
  const handleBannerTouchEnd = () => {
    isDraggingRef.current = false;
    window.removeEventListener('touchmove', handleBannerTouchMove);
    window.removeEventListener('touchend', handleBannerTouchEnd);
    window.removeEventListener('touchcancel', handleBannerTouchEnd);
  };
  const handleBannerTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    isDraggingRef.current = true;
    dragStartYRef.current = e.touches[0].clientY;
    initialCropYRef.current = bannerCrop.y;
    window.addEventListener('touchmove', handleBannerTouchMove, { passive: false });
    window.addEventListener('touchend', handleBannerTouchEnd);
    window.addEventListener('touchcancel', handleBannerTouchEnd);
  };

  // LANDSCAPE Drag Logic
  const updateLandscapeCropPosition = (clientY: number) => {
    if (!isDraggingRef.current || !imageContainerRef.current) return;
    const containerHeight = imageContainerRef.current.offsetHeight;
    if (containerHeight === 0) return;
    const deltaY = clientY - dragStartYRef.current;
    const deltaYPercent = deltaY / containerHeight;
    const landscapeHeightPercent = 9 / 16;
    const max_y = 1 - landscapeHeightPercent;
    const newY = Math.max(0, Math.min(max_y, initialCropYRef.current + deltaYPercent));
    setLandscapeCrop({ y: newY });
  };
  const handleLandscapeDragMove = (e: MouseEvent) => updateLandscapeCropPosition(e.clientY);
  const handleLandscapeDragEnd = () => {
    isDraggingRef.current = false;
    window.removeEventListener('mousemove', handleLandscapeDragMove);
    window.removeEventListener('mouseup', handleLandscapeDragEnd);
  };
  const handleLandscapeDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartYRef.current = e.clientY;
    initialCropYRef.current = landscapeCrop.y;
    window.addEventListener('mousemove', handleLandscapeDragMove);
    window.addEventListener('mouseup', handleLandscapeDragEnd);
  };
  const handleLandscapeTouchMove = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    updateLandscapeCropPosition(e.touches[0].clientY);
  };
  const handleLandscapeTouchEnd = () => {
    isDraggingRef.current = false;
    window.removeEventListener('touchmove', handleLandscapeTouchMove);
    window.removeEventListener('touchend', handleLandscapeTouchEnd);
    window.removeEventListener('touchcancel', handleLandscapeTouchEnd);
  };
  const handleLandscapeTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    isDraggingRef.current = true;
    dragStartYRef.current = e.touches[0].clientY;
    initialCropYRef.current = landscapeCrop.y;
    window.addEventListener('touchmove', handleLandscapeTouchMove, { passive: false });
    window.addEventListener('touchend', handleLandscapeTouchEnd);
    window.addEventListener('touchcancel', handleLandscapeTouchEnd);
  };


  if (!isOpen) return null;

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
              const downloadableImageUrl = isMainFormat ? mainImageSrc : derived?.imageUrl;

              const isBannerCard = formatDef.id === '3:1 (Bannière)';
              const canCropBanner = mainImageOptions.format === '1:1 (Carré)';
              const isBannerGenerated = derived?.imageUrl && !derived.isGenerating;
              const showCropper = isBannerCard && canCropBanner && (!isBannerGenerated || forceBannerRecrop);

              const isLandscapeCard = formatDef.id === '16:9 (Paysage)';
              const canCropLandscape = mainImageOptions.format === '1:1 (Carré)';
              const isLandscapeGenerated = derived?.imageUrl && !derived.isGenerating;
              const showLandscapeCropper = isLandscapeCard && canCropLandscape && (!isLandscapeGenerated || forceLandscapeRecrop);

              let previewImageUrl = downloadableImageUrl;
              let previewAspectRatio = formatDef.ratio;
              if (showCropper || showLandscapeCropper) {
                  previewImageUrl = mainImageSrc;
                  previewAspectRatio = 1;
              }

              const isCurrentlyGenerating = derived?.isGenerating;
              const isInteractive = isSelected || showCropper || showLandscapeCropper;
              
              return (
                <div key={formatDef.id} className={`bg-gray-900/50 rounded-lg border-2 transition-all ${isInteractive && !isMainFormat ? 'border-purple-500' : 'border-gray-700'}`}>
                    <div 
                        ref={(showCropper || showLandscapeCropper) ? imageContainerRef : null}
                        className="relative w-full bg-black/20 flex items-center justify-center overflow-hidden rounded-t-md"
                        style={{ aspectRatio: `${previewAspectRatio}` }}
                    >
                        {previewImageUrl ? (
                            <img src={`data:image/png;base64,${previewImageUrl}`} alt={`Aperçu ${formatDef.label}`} className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-gray-600 text-sm">{formatDef.label}</div>
                        )}
                        
                        {showCropper && previewImageUrl && (
                            <>
                                <div className="absolute inset-0 bg-black/30 pointer-events-none" />
                                <div 
                                    className="absolute w-full border-2 border-dashed border-purple-400 bg-white/10 cursor-ns-resize group"
                                    style={{ 
                                      height: '33.333%', 
                                      top: `${bannerCrop.y * 100}%`,
                                      left: 0
                                    }}
                                    onMouseDown={handleBannerDragStart}
                                    onTouchStart={handleBannerTouchStart}
                                >
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <span className="bg-black/50 text-white text-xs font-bold px-2 py-1 rounded">
                                            Zone Bannière (3:1)
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}

                        {showLandscapeCropper && previewImageUrl && (
                            <>
                                <div className="absolute inset-0 bg-black/30 pointer-events-none" />
                                <div
                                    className="absolute w-full border-2 border-dashed border-purple-400 bg-white/10 cursor-ns-resize group"
                                    style={{
                                        height: `${(9 / 16) * 100}%`,
                                        top: `${landscapeCrop.y * 100}%`,
                                        left: 0,
                                    }}
                                    onMouseDown={handleLandscapeDragStart}
                                    onTouchStart={handleLandscapeTouchStart}
                                >
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <span className="bg-black/50 text-white text-xs font-bold px-2 py-1 rounded">
                                            Zone Paysage (16:9)
                                        </span>
                                    </div>
                                </div>
                            </>
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
                        {(isBannerCard || isLandscapeCard) && !(canCropBanner || canCropLandscape) && !downloadableImageUrl && !isCurrentlyGenerating && (
                            <div className="mt-3 p-2 bg-yellow-900/50 border border-yellow-700 rounded-md text-center">
                                <p className="text-xs text-yellow-300">
                                Pour un recadrage personnalisé, générez d'abord votre visuel principal au format <strong>Carré (1:1)</strong>.
                                </p>
                            </div>
                        )}
                        <TextSelector
                            config={textConfigs[formatDef.id]}
                            onChange={(newConfig) => {
                                setTextConfigs(prev => ({ ...prev, [formatDef.id]: newConfig }));
                            }}
                            options={mainImageOptions}
                            disabled={isGenerating || isZipping || isMainFormat}
                        />
                        {downloadableImageUrl && (
                             <button
                                onClick={() => handleDownload(formatDef.id, downloadableImageUrl)}
                                className="w-full mt-3 flex items-center justify-center gap-2 bg-blue-600/80 hover:bg-blue-600 text-white text-sm font-semibold py-2 px-3 rounded-lg transition"
                             >
                                <DownloadIcon className="w-4 h-4" />
                                Télécharger
                            </button>
                        )}
                        {downloadableImageUrl && (isBannerCard && canCropBanner || isLandscapeCard && canCropLandscape) && !isCurrentlyGenerating && (
                            <button
                                onClick={() => {
                                    if (isBannerCard) setForceBannerRecrop(true);
                                    if (isLandscapeCard) setForceLandscapeRecrop(true);
                                    setSelectedFormats(prev => new Set(prev).add(formatDef.id));
                                }}
                                className="w-full text-center text-xs text-purple-400 hover:text-purple-300 underline mt-2"
                            >
                                Modifier le cadrage
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
                {isZipping ? <><SpinnerIcon className="w-5 h-5 mr-2" /> Création du ZIP...</> : 'Télécharger tout (ZIP)'}
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
            ) : `Générer ${selectedFormats.size} déclinaison(s)`}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default FormatManager;