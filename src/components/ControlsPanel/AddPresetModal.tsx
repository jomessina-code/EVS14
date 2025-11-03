import React, { useState, useEffect, useRef } from 'react';
import type { UniversePreset, GameType, GraphicStyle, Ambiance, VisualElements, UniverseId } from '../../types';
import { GAME_TYPES, GRAPHIC_STYLES, AMBIANCES, VISUAL_ELEMENTS } from '../../constants/options';
import SpinnerIcon from '../icons/SpinnerIcon';
import MicrophoneIcon from '../icons/MicrophoneIcon';
import { useVoiceToText } from '../../hooks/useVoiceToText';
import SendIcon from '../icons/SendIcon';

// --- New Hexagonal ColorPicker Component ---

const Hexagon: React.FC<{ color: string; onClick: () => void; isSelected?: boolean }> = ({ color, onClick, isSelected = false }) => (
  <div 
    className="relative w-[12px] h-[14px] cursor-pointer transition-transform duration-150 hover:scale-125"
    onClick={onClick}
    role="button"
    aria-label={`Select color ${color}`}
    style={{ backfaceVisibility: 'hidden' }} // perf hint
  >
    <div 
      className="absolute inset-0 bg-gray-600"
      style={{
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
      }}
    />
    <div 
      className={`absolute inset-[1px] transition-all duration-200 ${isSelected ? 'transform scale-110 z-10' : ''}`}
      style={{
        backgroundColor: color,
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
      }}
    />
    {isSelected && <div 
        className="absolute inset-0 ring-1 ring-offset-1 ring-offset-gray-800 ring-purple-400"
        style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
    />}
  </div>
);

const generateHexagonalPalette = () => {
    const palette: string[][] = [];
    const radius = 6; // Controls the size of the overall hexagon.

    // Generate the main color hexagon
    for (let q = -radius; q <= radius; q++) {
        const row: string[] = [];
        const r1 = Math.max(-radius, -q - radius);
        const r2 = Math.min(radius, -q + radius);
        for (let r = r1; r <= r2; r++) {
            // Map axial coordinates (q, r) to HSL color space
            const col = q + radius; // 0 to 2*radius
            const rowIdx = r + q / 2 + radius; // 0 to 2*radius, approximately

            const hue = (180 + (col / (2 * radius)) * 360) % 360;
            const lightness = 90 - (rowIdx / (2 * radius)) * 80;
            
            const lightnessNorm = (lightness - 10) / 80;
            const saturation = 100 - Math.pow(Math.abs(lightnessNorm - 0.5) * 2, 1.5) * 80;
            
            row.push(`hsl(${hue.toFixed(0)}, ${saturation.toFixed(0)}%, ${lightness.toFixed(0)}%)`);
        }
        palette.push(row);
    }
    
    // Generate a separate grayscale row for the bottom
    const grayscaleRow: string[] = [];
    const grayscaleWidth = radius * 2 + 1; // Make it as wide as the center row
    for (let i = 0; i < grayscaleWidth; i++) {
        const lightness = 100 - (i / (grayscaleWidth - 1)) * 100;
        grayscaleRow.push(`hsl(0, 0%, ${lightness.toFixed(0)}%)`);
    }
    // Insert a spacer empty row before grayscale
    palette.push([]);
    palette.push(grayscaleRow);

    return palette;
};

const PALETTE = generateHexagonalPalette();


const ColorPicker: React.FC<{
  onClose: () => void;
  onSetPalette: (palette: string[]) => void;
  currentPalette: string[];
}> = ({ onClose, onSetPalette, currentPalette }) => {
  const [localPalette, setLocalPalette] = useState(currentPalette);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleHexClick = (color: string) => {
    if (localPalette.length < 4 && !localPalette.includes(color)) {
      setLocalPalette(prev => [...prev, color]);
    }
  };
  
  const handleRemoveColor = (colorToRemove: string) => {
    setLocalPalette(prev => prev.filter(c => c !== colorToRemove));
  };

  const handleSet = () => {
    onSetPalette(localPalette);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div ref={modalRef} className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-sm p-6 border border-gray-700 text-white animate-fade-in-up">
        <h3 className="text-xl font-bold font-orbitron text-purple-300 mb-4 text-center">Sélecteur de couleurs</h3>
        
        <div className="flex flex-col items-center gap-0 mb-6" role="list">
          {PALETTE.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center" style={{ marginTop: row.length > 0 ? '-4px' : '0px' }}>
              {row.map((color, colIndex) => (
                <div key={colIndex} className="p-[1px]" role="listitem">
                   <Hexagon 
                     color={color} 
                     onClick={() => handleHexClick(color)}
                     isSelected={localPalette.includes(color)}
                   />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="mb-6">
            <p className="text-sm text-center text-gray-400 mb-3">Palette en cours de création ({localPalette.length}/4)</p>
            <div className="flex items-center justify-center gap-3 p-2 bg-gray-900/50 border border-gray-700 rounded-lg min-h-[56px]">
                {localPalette.map(color => (
                     <div key={color} className="relative group w-9 h-10 cursor-pointer" onClick={() => handleRemoveColor(color)}>
                        <div 
                            className="absolute inset-0 bg-gray-600" 
                            style={{ 
                                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                            }}
                        />
                         <div 
                            className="absolute inset-[1px]" 
                            style={{ 
                                backgroundColor: color,
                                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                            }}
                        />
                        <div className="absolute inset-0 bg-red-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                            <span className="text-white text-xl font-bold">&times;</span>
                        </div>
                    </div>
                ))}
                {Array.from({ length: 4 - localPalette.length }).map((_, index) => (
                    <div key={`empty-${index}`} className="relative w-9 h-10">
                        <div 
                            className="absolute inset-0 bg-gray-600" 
                            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                        />
                        <div 
                            className="absolute inset-[1px] bg-gray-700/50" 
                            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                        />
                    </div>
                ))}
            </div>
        </div>

        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition">
            Annuler
          </button>
          <button onClick={handleSet} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition">
            Définir
          </button>
        </div>
      </div>
    </div>
  );
};


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

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
  <input {...props} className={`w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${className || ''}`} />
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
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const isEditing = !!presetToEdit;

  const { isRecording, isCorrecting, toggleRecording } = useVoiceToText({
    onCorrectedTranscript: (correctedTranscript: string) => {
        setSuggestionTheme(correctedTranscript);
    },
    onError: (error) => setVoiceError(error),
  });

  const handleToggleRecording = () => {
    setVoiceError('');
    if (!isRecording) {
        setSuggestionTheme('');
    }
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

  const handleSetPalette = (newPalette: string[]) => {
    setFormState(prev => ({
      ...prev,
      colorPalette: newPalette
    }));
    setIsColorPickerOpen(false);
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
  
  const handleSuggestionAction = () => {
    if (isRecording) {
      toggleRecording(); // Stop recording, transcript will be processed by the hook
    } else if (suggestionTheme.trim()) {
      handleSuggest(); // Submit text for suggestion
    }
  };

  if (!isOpen) return null;

  return (
    <>
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
                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-3">
                    <Label htmlFor="suggestionTheme">Suggérer un univers en vocal...</Label>
                    {voiceError && <p className="text-xs text-red-400">{voiceError}</p>}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-grow">
                            <Input 
                                id="suggestionTheme" 
                                value={suggestionTheme} 
                                onChange={e => setSuggestionTheme(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSuggestionAction(); }}}
                                placeholder={isRecording ? "Enregistrement en cours..." : isCorrecting ? "Transcription en cours..." : "Bataille de corsaires dans la galaxie"}
                                disabled={isSuggestingPreset || isRecording || isCorrecting}
                                className={isRecording ? 'recording-glow' : ''}
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
                            type="button"
                            onClick={handleSuggestionAction}
                            disabled={isSuggestingPreset || isCorrecting || (!isRecording && !suggestionTheme.trim())}
                            className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 text-white font-bold py-2 px-2 rounded-lg transition"
                            aria-label={isRecording ? 'Arrêter et traiter la voix' : 'Suggérer avec l\'IA'}
                        >
                            {isRecording ? <div className="w-3 h-3 bg-white rounded-sm"></div>
                              : isSuggestingPreset || isCorrecting ? <SpinnerIcon className={`w-5 h-5 ${isCorrecting ? 'text-purple-400' : ''}`} /> 
                              : <SendIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
              )}
              {!isEditing && (
                <p className="text-center text-gray-500 text-sm">Ou décrivez le...</p>
              )}
              <form id="preset-form" onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
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
                    <Label>Sélecteur de couleurs ({formState.colorPalette.length}/4)</Label>
                    <div className="flex items-center gap-3 px-3 h-[42px] bg-gray-700 border border-gray-600 rounded-lg">
                        {formState.colorPalette.map((color) => (
                            <div key={color} className="relative group w-5 h-6">
                                <div 
                                    className="absolute inset-0 bg-gray-600"
                                    style={{ 
                                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                                    }}
                                />
                                <div 
                                    className="absolute inset-[1px]" 
                                    style={{ 
                                        backgroundColor: color,
                                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveColor(color)}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                    aria-label={`Supprimer la couleur ${color}`}
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                        {formState.colorPalette.length < 4 && (
                            <button
                                type="button"
                                onClick={() => setIsColorPickerOpen(true)}
                                className="relative w-5 h-6 flex items-center justify-center cursor-pointer group"
                            >
                                <div 
                                    className="absolute inset-0 bg-gray-600"
                                    style={{ 
                                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                                    }}
                                />
                                <div 
                                    className="absolute inset-[1px] bg-gray-700 group-hover:bg-gray-600 transition-colors"
                                    style={{ 
                                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                                    }}
                                />
                                <span className="relative text-lg font-light text-gray-400 group-hover:text-white transition-colors">+</span>
                            </button>
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
      {isColorPickerOpen && (
        <ColorPicker
            onClose={() => setIsColorPickerOpen(false)}
            onSetPalette={handleSetPalette}
            currentPalette={formState.colorPalette}
        />
      )}
    </>
  );
};

export default AddPresetModal;