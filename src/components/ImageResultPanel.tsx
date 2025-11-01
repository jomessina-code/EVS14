import React, { useState, useRef, useEffect } from 'react';
import DownloadIcon from './icons/DownloadIcon';
import QualityCheckPanel from './QualityCheckPanel';
import SpinnerIcon from './icons/SpinnerIcon';
import type { EsportPromptOptions, QualityCheckResults } from '../types';
import MicrophoneIcon from './icons/MicrophoneIcon';
import { useVoiceToText } from '../hooks/useVoiceToText';
import { resizeAndCropImage } from '../utils/image';
import { DECLINATION_FORMATS } from '../constants/formats';
import SendIcon from './icons/SendIcon';

interface ImageResultPanelProps {
  imageSrc: string;
  options: EsportPromptOptions;
  qualityCheckResults: QualityCheckResults | null;
  prompt: string;
  onRegenerate: () => void;
  onBack: () => void;
  onTargetedRegeneration: () => void;
  isModificationMode: boolean;
  setIsModificationMode: React.Dispatch<React.SetStateAction<boolean>>;
  modificationRequest: string;
  setModificationRequest: React.Dispatch<React.SetStateAction<string>>;
  isModifying: boolean;
  onDecline: () => void;
}

const EVS_LOGO_URL = "https://i.postimg.cc/nVCRVCHb/logo-EVSV2.png";

const ImageResultPanel: React.FC<ImageResultPanelProps> = ({ 
    imageSrc, 
    options, 
    qualityCheckResults, 
    prompt,
    onRegenerate, 
    onBack,
    onTargetedRegeneration,
    isModificationMode,
    setIsModificationMode,
    modificationRequest,
    setModificationRequest,
    isModifying,
    onDecline
}) => {
  const [voiceError, setVoiceError] = useState('');

  const { isRecording, isCorrecting, toggleRecording } = useVoiceToText({
    onCorrectedTranscript: (correctedTranscript: string) => {
        setModificationRequest(correctedTranscript);
    },
    onError: (error) => setVoiceError(error),
  });

  const handleToggleRecording = () => {
    setVoiceError('');
    toggleRecording();
  };

  const handleDownload = async () => {
    try {
        const formatDef = DECLINATION_FORMATS.find(f => f.id === options.format);
        if (!formatDef) {
            throw new Error(`Format definition not found for: ${options.format}`);
        }
        
        const [width, height] = formatDef.dimensions.replace('px', '').split('x').map(Number);
        const resizedImageUrl = await resizeAndCropImage(imageSrc, width, height);
        
        const link = document.createElement('a');
        link.href = resizedImageUrl;

        const slugify = (text: string) => text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .slice(0, 50);

        const eventNameSlug = slugify(options.eventName || 'visuel-esport');
        const formatSlug = slugify(formatDef.label);

        link.download = `Visuel_${eventNameSlug}_${formatSlug}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Failed to resize and download image:", error);
        alert("Une erreur est survenue lors de la préparation du téléchargement. Le fichier original sera téléchargé.");
        // Fallback to downloading the original image
        const link = document.createElement('a');
        link.href = imageSrc;
        link.download = `Visuel_esport_original.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const handleSubmitModification = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isRecording) {
      toggleRecording();
    } else {
      onTargetedRegeneration();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white relative">
      <header className="flex-shrink-0 p-4 flex justify-center items-center bg-gray-900/80 backdrop-blur-sm z-10 relative">
        <div className="flex items-center gap-3">
          <img src={EVS_LOGO_URL} alt="Logo" className="h-8" />
          <h1 className="text-xl font-bold font-orbitron">Esport Visual Studio</h1>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4 overflow-auto">
        <div className="relative max-w-full max-h-full">
          <img src={imageSrc} alt="Visuel généré" className="object-contain max-w-full max-h-full rounded-lg shadow-2xl shadow-black/50" />
           {qualityCheckResults && (
            <div className="absolute bottom-4 right-4">
              <QualityCheckPanel results={qualityCheckResults} />
            </div>
          )}
        </div>
      </main>

      <footer className="flex-shrink-0 p-4 bg-gray-800 border-t border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-3 z-10">
        <button onClick={handleDownload} className="col-span-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition">
          <DownloadIcon className="w-5 h-5" />
          Télécharger
        </button>
        <button onClick={onDecline} className="col-span-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition">
            🖼️ Décliner
        </button>
        <button onClick={onRegenerate} className="col-span-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition">
            🎲 Variante
        </button>
        <button onClick={() => setIsModificationMode(true)} className="col-span-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition">
            🎨 Modifier
        </button>
      </footer>
      
      {isModificationMode && (
        <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center p-4 animate-fade-in-up" onClick={() => setIsModificationMode(false)}>
            <form onSubmit={handleSubmitModification} className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg p-6 border border-gray-700" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-gray-200 mb-4">Décrivez précisément ce que vous souhaitez modifier dans l'image actuelle :</h3>
                
                <div className="relative">
                    <textarea
                        value={modificationRequest}
                        onChange={(e) => setModificationRequest(e.target.value)}
                        placeholder={isCorrecting ? "Correction du texte en cours..." : "Ex: Remplacer le personnage féminin par un robot futuriste"}
                        className="w-full bg-gray-700 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-all duration-300 border-gray-600"
                        rows={4}
                        disabled={isModifying || isRecording || isCorrecting}
                    />
                </div>

                {voiceError && <p className="text-xs text-red-400 mt-2">{voiceError}</p>}
                
                 <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={handleToggleRecording}
                        disabled={isModifying || isCorrecting}
                        className={`w-full h-12 flex-shrink-0 p-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 ${
                        isRecording 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-gray-600 hover:bg-gray-500 text-white'
                        }`}
                        aria-label={isRecording ? 'Arrêter l\'enregistrement' : 'Démarrer l\'enregistrement vocal'}
                    >
                        <MicrophoneIcon className={`h-6 w-6 ${isRecording ? 'animate-pulse' : ''}`} />
                        <span>{isRecording ? 'En cours...' : isCorrecting ? 'Correction...' : 'Voix'}</span>
                    </button>
                    <button 
                        type="submit"
                        disabled={isModifying || isRecording || isCorrecting || !modificationRequest.trim()}
                        className="w-full h-12 flex-shrink-0 p-3 rounded-lg transition flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-500 disabled:cursor-not-allowed"
                        aria-label="Appliquer la modification"
                    >
                        {isModifying ? (
                            <>
                                <SpinnerIcon className="w-6 h-6" />
                                <span>Modification...</span>
                            </>
                        ) : isCorrecting ? (
                             <>
                                <SpinnerIcon className="w-6 h-6" />
                                <span>Correction...</span>
                            </>
                        ) : (
                            <>
                                <SendIcon className="w-6 h-6" />
                                <span>Appliquer</span>
                            </>
                        )}
                    </button>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModificationMode(false)} disabled={isModifying || isRecording || isCorrecting} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition disabled:opacity-50">
                        Annuler
                    </button>
                </div>
            </form>
        </div>
      )}

    </div>
  );
};

export default ImageResultPanel;