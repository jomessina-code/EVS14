

import React, { useState } from 'react';
import type { EsportPromptOptions, UniverseId, GenerationHistoryItem, UniversePreset } from '../../types';
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

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" />
);

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
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<UniversePreset | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const isChecked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;
    
    setOptions(prev => ({ ...prev, [name]: isCheckbox ? isChecked : value }));
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

  const isSquareFormat = options.format === '1:1 (Carré)';

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
          <HistoryPanel history={history} onRestore={onRestoreFromHistory} onDelete={onDeleteHistoryItem} />
          
          <Section title="Univers & Synergies" icon={<HandshakeIcon />}>
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
                    {preset.isCustom && (
                      <div className="absolute top-1 right-1 flex gap-1">
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

          <Section title="Contexte de l'événement" icon={<CalendarIcon />} collapsable>
            <div>
              <Label htmlFor="eventName">Nom de l'événement</Label>
              <Input id="eventName" name="eventName" value={options.eventName} onChange={handleInputChange} placeholder="Ex: Summer Split Finals" />
            </div>
            <div>
              <Label htmlFor="baseline">Baseline / Slogan</Label>
              <Input id="baseline" name="baseline" value={options.baseline} onChange={handleInputChange} placeholder="Ex: Qui sera le champion ?" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <Label htmlFor="eventLocation">Lieu</Label>
                  <Input id="eventLocation" name="eventLocation" value={options.eventLocation} onChange={handleInputChange} placeholder="Ex: En ligne" />
               </div>
               <div>
                  <Label htmlFor="eventDate">Date</Label>
                  <Input id="eventDate" name="eventDate" value={options.eventDate} onChange={handleInputChange} placeholder="Ex: 24.08.2024" />
               </div>
            </div>
            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="hideText" name="hideText" checked={options.hideText} onChange={handleInputChange} className="h-4 w-4 rounded bg-gray-700 text-purple-600 focus:ring-purple-500" />
                    <Label htmlFor="hideText">Masquer le texte</Label>
                </div>
                {!options.hideText && (
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="textLock" name="textLock" checked={options.textLock} onChange={handleInputChange} className="h-4 w-4 rounded bg-gray-700 text-purple-600 focus:ring-purple-500" />
                        <Label htmlFor="textLock">Verrouiller texte</Label>
                    </div>
                )}
            </div>
          </Section>

          <Section title="Élément Principal" icon={<StarIcon />}>
             <div>
              <Label htmlFor="visualElements">Éléments visuels clés</Label>
              <Select id="visualElements" name="visualElements" value={options.visualElements} onChange={handleInputChange}>
                {VISUAL_ELEMENTS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </Select>
            </div>
            {isSizedElement && (
              <div>
                <Label htmlFor="elementSize">Taille de l'élément principal : {options.elementSize ?? 75}%</Label>
                <input id="elementSize" type="range" min="0" max="100" step="1" name="elementSize" value={options.elementSize ?? 75} onChange={handleRangeChange} className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer ${isSquareFormat ? 'accent-gray-500' : 'accent-purple-500'}`}/>
              </div>
            )}
          </Section>

          <Section title="Style global" icon={<PaintBrushIcon />}>
            <div>
              <Label htmlFor="gameType">Type de jeu</Label>
              <Select id="gameType" name="gameType" value={options.gameType} onChange={handleInputChange}>
                {GAME_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="graphicStyle">Style graphique dominant</Label>
              <Select id="graphicStyle" name="graphicStyle" value={options.graphicStyle} onChange={handleInputChange}>
                {GRAPHIC_STYLES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </Select>
            </div>
             <div>
              <Label htmlFor="ambiance">Ambiance visuelle / Éclairage</Label>
              <Select id="ambiance" name="ambiance" value={options.ambiance} onChange={handleInputChange}>
                {AMBIANCES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </Select>
            </div>
          </Section>
          
          <Section title="Format & Finitions" icon={<AdjustmentsIcon />} collapsable>
             <div>
                <Label htmlFor="format">Format de sortie initial</Label>
                <Select id="format" name="format" value={options.format} onChange={handleInputChange}>
                    {DECLINATION_FORMATS.map(opt => <option key={opt.id} value={opt.id}>{opt.label} ({opt.description})</option>)}
                </Select>
            </div>
            <div>
                <Label htmlFor="effectsIntensity">Intensité des effets spéciaux : {options.effectsIntensity}%</Label>
                <input id="effectsIntensity" type="range" min="0" max="100" step="10" name="effectsIntensity" value={options.effectsIntensity} onChange={handleRangeChange} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"/>
            </div>
            <div className="flex items-center gap-2">
                <input type="checkbox" id="highResolution" name="highResolution" checked={options.highResolution} onChange={handleInputChange} className="h-4 w-4 rounded bg-gray-700 text-purple-600 focus:ring-purple-500" />
                <Label htmlFor="highResolution">Génération Haute Définition</Label>
            </div>
          </Section>
        </main>
        
        <footer className="flex-shrink-0 p-4 border-t border-gray-700 space-y-3">
          <button 
            onClick={onOpenPromptEditor}
            className="w-full text-center text-sm text-gray-400 hover:text-white underline"
          >
            Prévisualiser & éditer le prompt
          </button>
          <button 
            onClick={onGenerate} 
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-lg transition"
          >
            {isLoading ? <><SpinnerIcon className="w-5 h-5" /> Génération en cours...</> : '✨ Générer le visuel ✨'}
          </button>
        </footer>
      </div>
      <AddPresetModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePreset}
        presetToEdit={editingPreset}
        onSuggestPreset={onSuggestPreset}
        isSuggestingPreset={isSuggestingPreset}
      />
    </>
  );
};

export default ControlsPanel;