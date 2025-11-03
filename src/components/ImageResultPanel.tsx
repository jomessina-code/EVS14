import React, { useState, useRef, useEffect } from 'react';
import DownloadIcon from './icons/DownloadIcon';
import QualityCheckPanel from './QualityCheckPanel';
import SpinnerIcon from './icons/SpinnerIcon';
import type { EsportPromptOptions, QualityCheckResults, UniversePreset } from '../types';
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
  allPresets: UniversePreset[];
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
    onDecline,
    allPresets
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
    if (!isRecording) {
        setModificationRequest('');
    }
    toggleRecording();
  };

  const handleDownload = async () => {
    const slugify = (text: string) => text
        .toLowerCase()
        .replace(/\s+/g, '-')
        .slice(0, 50);

    const selectedUniverses = allPresets
        .filter(p => options.universes.includes(p.id))
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

    try {
        const formatDef = DECLINATION_FORMATS.find(f => f.id === options.format);
        if (!formatDef) {
            throw new Error(`Format definition not found for: ${options.format}`);
        }
        
        const [width, height] = formatDef.dimensions.replace('px', '').split('x').map(Number);
        const resizedImageUrl = await resizeAndCropImage(`data:image/png;base64,${imageSrc}`, width, height);
        
        const link = document.createElement('a');
        link.href = resizedImageUrl;

        const formatSlug = slugify(formatDef.label);
        const dimensions = formatDef.dimensions;

        link.download = `${universeSlug}_${formatSlug}_${dimensions}_${timestamp}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Failed to resize and download image:", error);
        alert("Une erreur est survenue lors de la préparation du téléchargement. Le fichier original sera téléchargé.");
        // Fallback to downloading the original image
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${imageSrc}`;
        link.download = `Visuel_${universeSlug}_original_${timestamp}.png`;
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
          <img src={`data:image/png;base64,${imageSrc}`} alt="Visuel généré" className="object-contain max-w-full max-h-full rounded-lg shadow-2xl shadow-black/50" />
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
            Décliner
        </button>
        <button onClick={onRegenerate} className="col-span-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition">
            Variante
        </button>
        <button onClick={() => setIsModificationMode(true)} className="col-span-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition">
            Modifier
        </button>
      </footer>
      
      {isModificationMode && (
        <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center p-4 animate-fade-in-up" onClick={() => setIsModificationMode(false)}>
            <form onSubmit={handleSubmitModification} className="relative bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg p-6 border border-gray-700" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    onClick={() => setIsModificationMode(false)}
                    disabled={isModifying || isRecording || isCorrecting}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    aria-label="Fermer"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h2 className="text-xl font-bold font-orbitron text-purple-300 mb-4 text-center">Modification du visuel</h2>
                
                {voiceError && <p className="text-xs text-red-400 mb-2">{voiceError}</p>}

                <div className="flex items-end gap-2">
                    <textarea
                        value={modificationRequest}
                        onChange={(e) => setModificationRequest(e.target.value)}
                        placeholder={isCorrecting ? "Transcription en cours..." : isRecording ? "Enregistrement en cours..." : "Décrivez la modification..."}
                        className={`flex-grow bg-gray-700 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-all duration-300 border-gray-600 placeholder-scroll-animation ${isRecording ? 'recording-glow' : ''}`}
                        rows={3}
                        disabled={isModifying || isRecording || isCorrecting}
                    />
                    <button
                        type="button"
                        onClick={handleToggleRecording}
                        disabled={isModifying || isCorrecting}
                        className={`h-full p-3 rounded-lg transition-colors duration-200 flex items-center justify-center ${
                        isRecording 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-gray-600 hover:bg-gray-500 text-white'
                        }`}
                        aria-label={isRecording ? 'Arrêter l\'enregistrement' : 'Démarrer l\'enregistrement vocal'}
                    >
                        <MicrophoneIcon className={`h-5 w-5 ${isRecording ? 'animate-pulse' : ''}`} />
                    </button>
                    <button 
                        type="submit"
                        disabled={isModifying || isRecording || isCorrecting || !modificationRequest.trim()}
                        className="h-full p-3 rounded-lg transition flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-500 disabled:cursor-not-allowed"
                        aria-label="Appliquer la modification"
                    >
                        {isModifying || isCorrecting ? (
                            <SpinnerIcon className={`w-5 h-5 ${isCorrecting ? 'text-purple-400' : ''}`} />
                        ) : (
                            <SendIcon className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </form>
        </div>
      )}

    </div>
  );
};

export default ImageResultPanel;