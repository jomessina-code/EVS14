import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../../types';
import SpinnerIcon from '../icons/SpinnerIcon';
import MicrophoneIcon from '../icons/MicrophoneIcon';
import { useVoiceToText } from '../../hooks/useVoiceToText';

interface PromptEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ChatMessage[];
  onSendMessage: (message: string) => void;
  isAssistantResponding: boolean;
  onFinalize: () => void;
}

const PromptEditorModal: React.FC<PromptEditorModalProps> = ({ 
  isOpen,
  onClose, 
  history, 
  onSendMessage, 
  isAssistantResponding,
  onFinalize
}) => {
  const [userInput, setUserInput] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const prevHistoryLength = useRef<number | null>(null);

  const { isRecording, isCorrecting, toggleRecording } = useVoiceToText({
    onCorrectedTranscript: (correctedTranscript: string) => {
        setUserInput(correctedTranscript);
    },
    onError: (error) => setVoiceError(error),
  });

  const handleToggleRecording = () => {
    setVoiceError('');
    toggleRecording();
  };


  useEffect(() => {
    // This effect handles auto-scrolling.
    // It scrolls to the bottom only when the modal opens for the first time
    // or when a new message is added to the history.
    // This prevents the scrollbar from jumping down if the user has scrolled up to read previous messages.
    const currentLength = history.length;
    const prevLength = prevHistoryLength.current;

    if (isOpen && (prevLength === null || currentLength > prevLength)) {
        // We use a short timeout to ensure the DOM has rendered the new message before scrolling
        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
    }
    
    // Update the ref to the current length for the next render cycle.
    prevHistoryLength.current = currentLength;

    // When the modal closes, reset the ref so it auto-scrolls correctly the next time it opens.
    if (!isOpen) {
        prevHistoryLength.current = null;
    }
  }, [history, isOpen]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRecording) {
      toggleRecording();
      return;
    }
    if (userInput.trim() && !isAssistantResponding && !isCorrecting) {
      onSendMessage(userInput.trim());
      setUserInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in-up"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col p-6 border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold font-orbitron text-purple-300">💬 Prévisualisation & édition du prompt</h2>
          <button onClick={onClose} disabled={isAssistantResponding || isRecording || isCorrecting} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>
        
        <div className="bg-gray-900/50 p-3 rounded-md border border-gray-700 flex flex-col flex-grow min-h-0">
          <div className="flex-grow overflow-y-auto pr-2 space-y-4">
            {history.map((msg, index) => (
                <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className="text-xs text-gray-400 mb-1 px-1">{msg.sender === 'user' ? 'Vous' : 'Assistant'}</div>
                  <div className={`max-w-[85%] p-3 rounded-lg text-sm whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-200 select-none'}`}>
                    {msg.text}
                  </div>
                </div>
            ))}
            {isAssistantResponding && (
              <div className="flex flex-col items-start">
                <div className="text-xs text-gray-400 mb-1">Assistant</div>
                <div className="bg-gray-700 text-gray-200 p-3 rounded-lg inline-flex items-center">
                    <SpinnerIcon className="w-4 h-4 mr-2" />
                    <span className="text-sm">en train d'écrire...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="mt-4 flex-shrink-0">
            {voiceError && <p className="text-xs text-red-400 mb-2">{voiceError}</p>}
            <div className="flex items-end gap-2">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRecording ? "Enregistrement en cours..." : isCorrecting ? "Correction du texte en cours..." : "Décrivez les ajustements que vous souhaitez apporter..."}
                className="flex-grow bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={2}
                disabled={isAssistantResponding || isRecording || isCorrecting}
              />
              <button
                type="button"
                onClick={handleToggleRecording}
                disabled={isAssistantResponding || isCorrecting}
                className={`h-full p-3 rounded-lg transition-colors duration-200 flex items-center justify-center ${
                  isRecording 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-500 text-white'
                }`}
                aria-label={isRecording ? 'Arrêter l\'enregistrement' : 'Démarrer l\'enregistrement vocal'}
              >
                <MicrophoneIcon className={`h-5 w-5 ${isRecording ? 'animate-pulse' : ''}`} />
              </button>
              <button type="submit" disabled={isAssistantResponding || isRecording || isCorrecting || !userInput.trim()} className="h-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 text-white font-bold p-3 rounded-lg transition-colors duration-200 flex items-center justify-center">
                {isCorrecting ? <SpinnerIcon className="w-5 h-5" /> : <svg xmlns="http://www.w.org/2000/svg" className="h-5 w-5" viewBox="http://www.w3.org/2000/svg" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 flex-shrink-0">
          <button
            onClick={onFinalize}
            disabled={isAssistantResponding || isRecording || isCorrecting}
            className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300"
          >
            ✅ Valider et utiliser ce prompt
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptEditorModal;