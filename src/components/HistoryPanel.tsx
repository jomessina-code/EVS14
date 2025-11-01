import React from 'react';
import type { GenerationHistoryItem } from '../types';
import HistoryIcon from './icons/HistoryIcon';
import TrashIcon from './icons/TrashIcon';
import PencilIcon from './icons/PencilIcon';

interface HistoryPanelProps {
  history: GenerationHistoryItem[];
  onRestore: (item: GenerationHistoryItem) => void;
  onDelete: (itemId: string) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onRestore, onDelete }) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-purple-300 mb-4 font-orbitron flex items-center">
        <HistoryIcon className="w-5 h-5 mr-2" />
        Historique des versions
      </h3>
      <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
        {history.map((item) => (
          <div 
            key={item.id} 
            onClick={() => onRestore(item)}
            className="group relative flex w-full items-center gap-3 rounded-lg bg-gray-700/50 p-2 cursor-pointer transition-colors hover:bg-gray-700"
          >
            <img 
              src={item.imageUrl} 
              alt="Generated poster thumbnail" 
              className="h-16 w-16 flex-shrink-0 rounded-md object-cover" 
            />
            <div className="overflow-hidden text-left">
              <p className="truncate text-sm font-semibold text-gray-300 group-hover:text-white">
                {item.options.eventName || "Génération"}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(item.timestamp).toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center space-x-1">
                <button
                    onClick={(e) => { e.stopPropagation(); onRestore(item); }}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-800/60 text-blue-300 transition-colors hover:bg-blue-700 hover:text-white"
                    aria-label="Modifier / Restaurer cette version"
                >
                    <PencilIcon className="h-4 w-4" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-red-800/60 text-red-300 transition-colors hover:bg-red-700 hover:text-white"
                    aria-label="Supprimer de l'historique"
                >
                    <TrashIcon className="h-4 w-4" />
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryPanel;