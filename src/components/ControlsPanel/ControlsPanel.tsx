

import React, { useState } from 'react';
import type { EsportPromptOptions, UniverseId, GenerationHistoryItem, UniversePreset, VisualElements, SavedSubject } from '../../types';
import { GAME_TYPES, GRAPHIC_STYLES, AMBIANCES, VISUAL_ELEMENTS } from '../../constants/options';
import { DECLINATION_FORMATS } from '../../constants/formats';
import SpinnerIcon from '../icons/SpinnerIcon';
import HistoryPanel from '../HistoryPanel';
import TrashIcon from '../icons/TrashIcon';
import AddPresetModal from './AddPresetModal';
import PencilIcon from '../icons/PencilIcon';
import HandshakeIcon from '../icons/HandshakeIcon';
import CalendarIcon from '../icons/CalendarIcon';
import StarIcon from '../icons/StarIcon';
import PaintBrushIcon from '../icons/PaintBrushIcon';
import AdjustmentsIcon from '../icons/AdjustmentsIcon';
import { useVoiceToText } from '../../hooks/useVoiceToText';
import MicrophoneIcon from '../icons/MicrophoneIcon';
import SendIcon from '../icons/SendIcon';
import { SparklesIcon } from '../icons/CheckIcon';
import EyeIcon from '../icons/EyeIcon';

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  collapsable?: boolean;
}

const Section: React.FC<SectionProps> = ({ title, icon, children, collapsable = false }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <h3 
                className={`text-lg font-semibold text-purple-300 mb-4 font-orbitron flex items-center gap-3 ${collapsable ? 'cursor-pointer' : ''}`}
                onClick={() => collapsable && setIsOpen(!isOpen)}
            >
                {icon && React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
                <span>{title}</span>
                 {collapsable && (
                    <svg className={`w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                )}
            </h3>
            {isOpen && <div className="space-y-4">
                {children}
            </div>}
        </div>
    );
};

const Label: React.FC<{ htmlFor?: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-400 mb-1">
    {children}
  </label>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select {...props} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" />
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
    <input {...props} className={`w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200 ${className || ''}`} />
);

const UniverseDetailsModal: React.FC<{ preset: UniversePreset | null; onClose: () => void }> = ({ preset, onClose }) => {
  if (!preset) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in-up" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md p-6 border border-purple-700" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-purple-300 font-orbitron text-lg">{preset.label}</h4>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none" aria-label="Fermer la description">&times;</button>
        </div>
        <p className="text-gray-300 text-sm mb-4">{preset.description}</p>
        <div className="border-t border-gray-700 pt-3 space-y-2 text-sm">
          <div className="flex justify-between items-center gap-2">
            <span className="font-semibold text-gray-400 whitespace-nowrap">Style :</span>
            <span className="text-right text-gray-200">{preset.style}</span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="font-semibold text-gray-400 whitespace-nowrap">Ambiance :</span>
            <span className="text-right text-gray-200">{preset.ambiance || 'Non spécifiée'}</span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="font-semibold text-gray-400 whitespace-nowrap">Sujet type :</span>
            <span className="text-right text-gray-200">{preset.elements}</span>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-400">Mots-clés :</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {preset.keywords.map(keyword => (
              <span key={keyword} className="bg-gray-700 text-purple-300 text-xs px-2 py-1 rounded-full">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


interface ControlsPanelProps {
  options: EsportPromptOptions;
  setOptions: React.Dispatch<React.SetStateAction<EsportPromptOptions>>;
  onGenerate: () => void;
  isLoading: boolean;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  history: GenerationHistoryItem[];
  onRestoreFromHistory: (item: GenerationHistoryItem) => void;
  onDeleteHistoryItem: (itemId: string) => void;
  onUniverseToggle: (universeId: UniverseId) => void;
  onOpenPromptEditor: () => void;
  allPresets: UniversePreset[];
  onAddPreset: (presetData: Omit<UniversePreset, 'id' | 'isCustom' | 'dominant'>) => void;
  onUpdatePreset: (presetId: UniverseId, updatedData: Omit<UniversePreset, 'id' | 'isCustom' | 'dominant'>) => void;
  onDeletePreset: (presetId: UniverseId) => void;
  onSuggestPreset: (theme: string) => Promise<Omit<UniversePreset, 'id' | 'isCustom' | 'dominant'> | null>;
  isSuggestingPreset: boolean;
  onClosePanel: () => void;
  savedSubjects: SavedSubject[];
  onAddSavedSubject: (description: string) => void;
  onDeleteSavedSubject: (subjectId: string) => void;
  onSubjectToggle: (description: string) => void;
}

const EVS_LOGO_URL = "https://i.postimg.cc/nVCRVCHb/logo-EVSV2.png";

const ControlsPanel: React.FC<ControlsPanelProps> = ({
  options,
  setOptions,
  onGenerate,
  isLoading,
  history,
  onRestoreFromHistory,
  onDeleteHistoryItem,
  onUniverseToggle,
  onOpenPromptEditor,
  allPresets,
  onAddPreset,
  onUpdatePreset,
  onDeletePreset,
  onSuggestPreset,
  isSuggestingPreset,
  onClosePanel,
  savedSubjects,
  onAddSavedSubject,
  onDeleteSavedSubject,
  onSubjectToggle,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<UniversePreset | null>(null);
  const [visualElementInput, setVisualElementInput] = useState('');
  const [activePresetDetails, setActivePresetDetails] = useState<UniversePreset | null>(null);

  const { isRecording, isCorrecting, toggleRecording } = useVoiceToText({
    onCorrectedTranscript: (transcript: string) => {
        setVisualElementInput(transcript);
    },
    onError: (error) => {
      console.error("Voice to text error in ControlsPanel:", error);
    },
  });

  const handleToggleRecording = () => {
    if (!isRecording) {
        setVisualElementInput('');
    }
    toggleRecording();
  };

  const executeVisualElementSubmit = () => {
    const description = visualElementInput.trim();
    if (description) {
      onAddSavedSubject(description);
      onSubjectToggle(description);
      setVisualElementInput('');
    }
  };

  const handleVisualElementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeVisualElementSubmit();
  };

  const handleVisualElementKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!isRecording && !isCorrecting && visualElementInput.trim()) {
        executeVisualElementSubmit();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const isChecked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;
    
    if (name === 'visualElements') {
        setOptions(prev => ({ ...prev, visualElements: value as VisualElements, visualElementDescriptions: [] }));
    } else {
        setOptions(prev => ({ ...prev, [name]: isCheckbox ? isChecked : value }));
    }
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOptions(prev => ({ ...prev, [e.target.name]: parseInt(e.target.value, 10) }));
  };

  const handleOpenModal = (preset: UniversePreset | null = null) => {
    setEditingPreset(preset);
    setIsModalOpen(true);
  };
  
  const handleSavePreset = (presetData: Omit<UniversePreset, 'id' | 'isCustom' | 'dominant'>, id?: UniverseId) => {
    if (id) {
        onUpdatePreset(id, presetData);
    } else {
        onAddPreset(presetData);
    }
    setIsModalOpen(false);
  };

  const isSizedElement = options.visualElements === "Personnage central" ||
                         options.visualElements === "Duo de joueurs" ||
                         options.visualElements === "Logo ou trophée";

  return (
    <>
      <div className="relative flex flex-col h-full bg-gray-800 text-gray-200">
        <button
          onClick={onClosePanel}
          className="absolute top-1/2 -translate-y-1/2 right-0 z-30 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-l-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          aria-label="Fermer le panneau de création"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
        </button>
        <header className="flex-shrink-0 p-4 flex justify-between items-center border-b border-gray-700">
          <div className="flex items-center gap-3">
            <img src={EVS_LOGO_URL} alt="Logo" className="h-8" />
            <h1 className="text-xl font-bold font-orbitron">Studio de Création</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          <HistoryPanel history={history} onRestore={onRestoreFromHistory} onDelete={onDeleteHistoryItem} allPresets={allPresets} />
          
          <Section title="Univers" icon={<HandshakeIcon />}>
            <div className="grid grid-cols-2 gap-2">
              {allPresets.map(preset => {
                const isSelected = options.universes.includes(preset.id);
                return (
                  <div key={preset.id} className="relative">
                    <button
                      onClick={() => onUniverseToggle(preset.id)}
                      className={`w-full h-full text-left p-3 rounded-lg border-2 transition-colors duration-200 ease-in-out ${isSelected ? 'bg-purple-800/50 border-purple-500' : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'}`}
                    >
                      <div>
                        <p className="font-bold text-sm text-gray-200">{preset.label}</p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{preset.description}</p>
                      </div>
                    </button>
                    <div className="absolute top-1 right-1">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setActivePresetDetails(preset); }} 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700/80 transition-colors" 
                            aria-label={`Détails pour ${preset.label}`}
                        >
                            <EyeIcon className="w-4 h-4" />
                        </button>
                    </div>
                    {preset.isCustom && (
                        <div className="absolute bottom-1 right-1 flex items-center gap-1">
                            <button onClick={() => handleOpenModal(preset)} className="w-6 h-6 bg-gray-800/80 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-blue-600"><PencilIcon className="w-3 h-3" /></button>
                            <button onClick={() => onDeletePreset(preset.id)} className="w-6 h-6 bg-gray-800/80 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-red-600"><TrashIcon className="w-3 h-3"/></button>
                        </div>
                    )}
                  </div>
                )
              })}
            </div>
            <button onClick={() => handleOpenModal()} className="w-full mt-2 p-2 bg-purple-600/20 text-purple-300 rounded-lg hover:bg-purple-600/40 transition">
              + Créer un univers
            </button>
          </Section>

          <Section title="Sujet principal" icon={<StarIcon />}>
            <div>
                <Label htmlFor="visualElements">Type</Label>
                <Select id="visualElements" name="visualElements" value={options.visualElements} onChange={handleInputChange}>
                    {VISUAL_ELEMENTS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </Select>
            </div>
            {savedSubjects.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label>Sujets enregistrés</Label>
                <div className="flex flex-wrap gap-2">
                  {savedSubjects.map(subject => (
                    <div key={subject.id} className="relative group">
                      <button
                        onClick={() => onSubjectToggle(subject.description)}
                        className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                          options.visualElementDescriptions.includes(subject.description)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                      >
                        {subject.description}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSavedSubject(subject.id);
                        }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-xs rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <form onSubmit={handleVisualElementSubmit} className="mt-4">
              <Label htmlFor="visualElementInput">Décrivez un ou plusieurs sujets (séparés par "et")</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="visualElementInput"
                  name="visualElementInput"
                  value={visualElementInput}
                  onChange={(e) => setVisualElementInput(e.target.value)}
                  onKeyDown={handleVisualElementKeyDown}
                  placeholder={isCorrecting ? 'Transcription...' : isRecording ? 'Enregistrement...' : 'ex: un guerrier et un dragon'}
                  disabled={isRecording || isCorrecting}
                  className={isRecording ? 'recording-glow' : ''}
                />
                <button
                  type="button"
                  onClick={handleToggleRecording}
                  disabled={isCorrecting}
                  className={`flex-shrink-0 w-10 h-10 p-2 rounded-lg transition-colors ${isRecording ? 'bg-red-600' : 'bg-gray-600'}`}
                  aria-label={isRecording ? 'Arrêter' : 'Enregistrer'}
                >
                  <MicrophoneIcon className="w-full h-full" />
                </button>
                <button
                  type="submit"
                  disabled={!visualElementInput.trim()}
                  className="flex-shrink-0 w-10 h-10 p-2 rounded-lg bg-purple-600 disabled:bg-gray-500"
                  aria-label="Ajouter le sujet"
                >
                  <SendIcon className="w-full h-full" />
                </button>
              </div>
            </form>
            
            {isSizedElement && (
              <div className="mt-4">
                  <Label htmlFor="elementSize">Taille du sujet : {options.elementSize ?? 75}%</Label>
                  <Input 
                      type="range"
                      id="elementSize"
                      name="elementSize"
                      min="0"
                      max="100"
                      value={options.elementSize ?? 75}
                      onChange={handleRangeChange}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Fond seul</span>
                      <span>Très gros plan</span>
                  </div>
              </div>
            )}
          </Section>
          
          <Section title="Style & Format" icon={<PaintBrushIcon />} collapsable={true}>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="gameType">Type de jeu</Label>
                    <Select id="gameType" name="gameType" value={options.gameType} onChange={handleInputChange}>
                    {GAME_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </Select>
                </div>
                <div>
                    <Label htmlFor="graphicStyle">Style graphique</Label>
                    <Select id="graphicStyle" name="graphicStyle" value={options.graphicStyle} onChange={handleInputChange}>
                    {GRAPHIC_STYLES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </Select>
                </div>
            </div>
            <div>
              <Label htmlFor="format">Format</Label>
              <Select id="format" name="format" value={options.format} onChange={handleInputChange}>
                  {DECLINATION_FORMATS.map(f => <option key={f.id} value={f.id}>{f.id} ({f.label})</option>)}
              </Select>
            </div>
          </Section>
          
          <Section title="Ambiance & Éclairage" icon={<AdjustmentsIcon />} collapsable={true}>
            <div>
              <Label htmlFor="ambiance">Ambiance</Label>
              <Select id="ambiance" name="ambiance" value={options.ambiance} onChange={handleInputChange}>
                {AMBIANCES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="effectsIntensity">Intensité des effets : {options.effectsIntensity}%</Label>
              <Input type="range" id="effectsIntensity" name="effectsIntensity" min="0" max="100" value={options.effectsIntensity} onChange={handleRangeChange} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"/>
            </div>
          </Section>

          <Section title="Contexte événementiel" icon={<CalendarIcon />} collapsable={true}>
            <div className="grid grid-cols-2 gap-4">
                <Input name="eventName" value={options.eventName} onChange={handleInputChange} placeholder="Nom de l'événement" />
                <Input name="baseline" value={options.baseline} onChange={handleInputChange} placeholder="Slogan / Baseline" />
                <Input name="eventLocation" value={options.eventLocation} onChange={handleInputChange} placeholder="Lieu" />
                <Input name="eventDate" value={options.eventDate} onChange={handleInputChange} placeholder="Date" />
            </div>
             <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="hideText" name="hideText" checked={options.hideText} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                    <Label htmlFor="hideText">Cacher le texte (générer sans)</Label>
                </div>
            </div>
          </Section>

          <Section title="Options avancées" icon={<SparklesIcon />} collapsable={true}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="highResolution" name="highResolution" checked={options.highResolution} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                    <Label htmlFor="highResolution">Haute Résolution (plus lent)</Label>
                </div>
            </div>
            <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <input type="checkbox" id="transparentBackground" name="transparentBackground" checked={options.transparentBackground} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                    <Label htmlFor="transparentBackground">Fond transparent</Label>
                </div>
            </div>
             <div className="mt-2">
                <button onClick={onOpenPromptEditor} className="w-full text-center text-sm text-purple-400 hover:underline">
                    Éditer le prompt manuellement
                </button>
            </div>
          </Section>

        </main>
        
        <footer className="flex-shrink-0 p-4 border-t border-gray-700">
          <button
            onClick={onGenerate}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300"
          >
            {isLoading ? (
              <><SpinnerIcon className="w-5 h-5" /> Génération en cours...</>
            ) : (
              <><SparklesIcon className="w-5 h-5" /> Générer le visuel</>
            )}
          </button>
        </footer>
      </div>
      {activePresetDetails && <UniverseDetailsModal preset={activePresetDetails} onClose={() => setActivePresetDetails(null)} />}
      {isModalOpen && <AddPresetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSavePreset} presetToEdit={editingPreset} onSuggestPreset={onSuggestPreset} isSuggestingPreset={isSuggestingPreset} />}
    </>
  );
};

export default ControlsPanel;