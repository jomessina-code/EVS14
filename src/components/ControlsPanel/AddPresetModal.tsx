import React, { useState, useEffect, useRef } from 'react';
import type { UniversePreset, GameType, GraphicStyle, Ambiance, VisualElements, UniverseId } from '../../types';
import { GAME_TYPES, GRAPHIC_STYLES, AMBIANCES, VISUAL_ELEMENTS } from '../../constants/options';
import SpinnerIcon from '../icons/SpinnerIcon';
import MicrophoneIcon from '../icons/MicrophoneIcon';
import { useVoiceToText } from '../../hooks/useVoiceToText';
import SendIcon from '../icons/SendIcon';

interface AddPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (presetData: Omit<UniversePreset, 'id' | 'isCustom' | 'dominant'>, id?: UniverseId) => void;
  presetToEdit?: UniversePreset | null;
  onSuggestPreset: (theme: string) => Promise<Omit<UniversePreset, 'id' | 'isCustom' | 'dominant'> | null>;
  isSuggestingPreset: boolean;
}

const Label: React.FC<{ htmlFor?: string; children: React.ReactNode; required?: boolean }> = ({ htmlFor, children, required }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-400 mb-2">
    {children} {required && <span className="text-red-400">*</span>}
  </label>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select {...props} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" />
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" />
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" />
);

const initialFormState = {
  label: '',
  description: '',
  gameType: "MOBA" as GameType,
  style: "Cyberpunk / Néon" as GraphicStyle,
  ambiance: "" as Ambiance,
  elements: "Personnage central" as VisualElements,
  keywords: '',
  colorPalette: [] as string[],
  influenceWeight: 0.6,
};

const AddPresetModal: React.FC<AddPresetModalProps> = ({ isOpen, onClose, onSave, presetToEdit, onSuggestPreset, isSuggestingPreset }) => {
  const [formState, setFormState] = useState(initialFormState);
  const [error, setError] = useState('');
  const [suggestionTheme, setSuggestionTheme] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const isEditing = !!presetToEdit;

  const { isRecording, isCorrecting, toggleRecording } = useVoiceToText({
    onCorrectedTranscript: (correctedTranscript: string) => {
        setSuggestionTheme(correctedTranscript);
    },
    onError: (error) => setVoiceError(error),
  });

  const handleToggleRecording = () => {
    setVoiceError('');
    toggleRecording();
  };

  useEffect(() => {
    if (isOpen) {
      if (presetToEdit) {
        setFormState({
          label: presetToEdit.label,
          description: presetToEdit.description,
          gameType: presetToEdit.gameType,
          style: presetToEdit.style,
          ambiance: presetToEdit.ambiance,
          elements: presetToEdit.elements,
          keywords: presetToEdit.keywords.join(', '),
          colorPalette: presetToEdit.colorPalette,
          influenceWeight: presetToEdit.influenceWeight,
        });
      } else {
        setFormState(initialFormState);
      }
      setError('');
      setVoiceError('');
      setSuggestionTheme('');
    }
  }, [isOpen, presetToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState(prev => ({ ...prev, influenceWeight: parseFloat(e.target.value) }));
  };
  
  const handleSuggest = async () => {
    if (!suggestionTheme.trim()) return;
    if (isRecording) toggleRecording();
    const suggestion = await onSuggestPreset(suggestionTheme);
    if (suggestion) {
        setFormState({
            label: suggestion.label,
            description: suggestion.description,
            gameType: suggestion.gameType,
            style: suggestion.style,
            ambiance: suggestion.ambiance,
            elements: suggestion.elements,
            keywords: suggestion.keywords.join(', '),
            colorPalette: suggestion.colorPalette,
            influenceWeight: suggestion.influenceWeight,
        });
        setSuggestionTheme('');
    }
  };

  const handleAddColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    if (formState.colorPalette.length < 4 && newColor && !formState.colorPalette.includes(newColor)) {
      setFormState(prev => ({
        ...prev,
        colorPalette: [...prev.colorPalette, newColor]
      }));
    }
  };

  const handleRemoveColor = (colorToRemove: string) => {
    setFormState(prev => ({
      ...prev,
      colorPalette: prev.colorPalette.filter(c => c !== colorToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formState.label || !formState.description) {
      setError('Le nom et la description sont obligatoires.');
      return;
    }

    const presetData = {
      ...formState,
      keywords: formState.keywords.split(',').map(k => k.trim()).filter(Boolean),
      colorPalette: formState.colorPalette,
    };
    
    onSave(presetData, presetToEdit?.id);
  };
  
  const handleSuggestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSuggest();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-700" onClick={(e) => e.stopPropagation()}>
        <header className="flex-shrink-0 p-6 flex justify-between items-center border-b border-gray-700">
          <h2 className="text-xl font-bold font-orbitron text-purple-300">
            {isEditing ? 'Modifier l\'univers' : 'Créer un nouvel univers'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </header>

        <div className="flex-grow flex flex-col min-h-0">
          <div className="p-6 overflow-y-auto space-y-4">
            {!isEditing && (
              <form onSubmit={handleSuggestionSubmit} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-3">
                  <Label htmlFor="suggestionTheme">💡 Pas d'inspiration ? Suggérez un univers à partir d'un thème :</Label>
                  {voiceError && <p className="text-xs text-red-400">{voiceError}</p>}
                  <div className="flex items-center gap-2">
                        <div className="relative flex-grow">
                            <Input 
                                id="suggestionTheme" 
                                value={suggestionTheme} 
                                onChange={e => setSuggestionTheme(e.target.value)} 
                                placeholder={isRecording ? "Enregistrement..." : isCorrecting ? "Correction..." : "Bataille de corsaires dans la galaxie"}
                                disabled={isSuggestingPreset || isRecording || isCorrecting}
                                className="w-full"
                            />
                        </div>
                        <button 
                            type="button" 
                            onClick={handleToggleRecording}
                            disabled={isSuggestingPreset || isCorrecting}
                            className={`w-10 h-10 flex-shrink-0 p-2 rounded-lg transition-colors duration-200 flex items-center justify-center ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-500'}`}
                            aria-label={isRecording ? 'Arrêter l\'enregistrement' : 'Démarrer l\'enregistrement vocal'}
                        >
                            <MicrophoneIcon className={`w-5 h-5 text-white ${isRecording ? 'animate-pulse' : ''}`} />
                        </button>
                        <button 
                            type="submit"
                            disabled={isSuggestingPreset || isRecording || isCorrecting || !suggestionTheme.trim()}
                            className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 text-white font-bold py-2 px-2 rounded-lg transition"
                        >
                            {isSuggestingPreset || isCorrecting ? <SpinnerIcon className="w-5 h-5" /> : <SendIcon className="w-5 h-5" />}
                        </button>
                  </div>
              </form>
            )}
            <form id="preset-form" onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <Label htmlFor="label" required>Nom de l'univers</Label>
                      <Input id="label" name="label" value={formState.label} onChange={handleChange} placeholder="Cybernetic Showdown" required />
                  </div>
                  <div>
                     <Label htmlFor="influenceWeight">Poids d'influence: {Math.round(formState.influenceWeight * 100)}%</Label>
                     <input id="influenceWeight" type="range" min="0.1" max="1" step="0.05" name="influenceWeight" value={formState.influenceWeight} onChange={handleRangeChange} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"/>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" required>Description</Label>
                  <Textarea id="description" name="description" value={formState.description} onChange={handleChange} placeholder="Courte description de l'ambiance et du style." rows={2} required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gameType">Type de jeu</Label>
                    <Select id="gameType" name="gameType" value={formState.gameType} onChange={handleChange}>
                      {GAME_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="style">Style graphique</Label>
                    <Select id="style" name="style" value={formState.style} onChange={handleChange}>
                      {GRAPHIC_STYLES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ambiance">Ambiance visuelle</Label>
                    <Select id="ambiance" name="ambiance" value={formState.ambiance} onChange={handleChange}>
                      {AMBIANCES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="elements">Éléments clés</Label>
                    <Select id="elements" name="elements" value={formState.elements} onChange={handleChange}>
                      {VISUAL_ELEMENTS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="keywords">Mots-clés (séparés par une virgule)</Label>
                  <Input id="keywords" name="keywords" value={formState.keywords} onChange={handleChange} placeholder="néons, ville nocturne, cyborg..." />
                </div>
                
                 <div>
                  <Label>Palette de couleurs (4 max)</Label>
                  <div className="flex items-center gap-3 p-2 bg-gray-700 border border-gray-600 rounded-lg min-h-[56px]">
                    {formState.colorPalette.map((color) => (
                      <div key={color} className="relative group w-8 h-8 rounded-full border-2 border-gray-500 shadow-md" style={{ backgroundColor: color }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(color)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                          aria-label={`Supprimer la couleur ${color}`}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    {formState.colorPalette.length < 4 && (
                      <label className="w-8 h-8 rounded-full border-2 border-dashed border-gray-500 flex items-center justify-center cursor-pointer hover:border-white hover:text-white text-gray-400 transition-colors">
                        <span className="text-2xl font-light">+</span>
                        <input
                          type="color"
                          onChange={handleAddColor}
                          className="absolute w-0 h-0 opacity-0"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </form>
          </div>

          <footer className="flex-shrink-0 p-6 flex justify-end items-center gap-4 border-t border-gray-700">
              <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                  Annuler
              </button>
              <button type="submit" form="preset-form" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition">
                  {isEditing ? 'Sauvegarder les modifications' : 'Créer l\'univers'}
              </button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default AddPresetModal;