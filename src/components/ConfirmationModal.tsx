

import React from 'react';
import type { EsportPromptOptions, UniversePreset, PromptChangeSummary } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  options: EsportPromptOptions;
  allPresets: UniversePreset[];
  isLoading: boolean;
}

const SummaryItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => {
  if (!value && typeof value !== 'boolean') return null;
  return (
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-md text-white font-semibold">{String(value)}</p>
    </div>
  );
};

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  options,
  allPresets,
  isLoading,
}) => {
  if (!isOpen) return null;

  const selectedUniverses = allPresets
    .filter(p => options.universes.includes(p.id))
    .map(p => p.label)
    .join(', ');

  const hasTextContent = options.eventName || options.baseline || options.eventLocation || options.eventDate;
  const shouldDisplayText = !options.hideText && hasTextContent;

  const isSizedElement = options.visualElements === "Personnage central" ||
                         options.visualElements === "Duo de joueurs" ||
                         options.visualElements === "Logo ou trophée";

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in-up"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 p-6 flex justify-between items-center border-b border-gray-700">
          <h2 className="text-xl font-bold font-orbitron text-purple-300">
            Récapitulatif de votre création
          </h2>
          <button onClick={onClose} disabled={isLoading} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </header>

        <main className="flex-grow p-6 overflow-y-auto space-y-6">
          <section className="space-y-4 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-purple-200 font-orbitron mb-3">Univers & Sujet</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SummaryItem label="Univers" value={selectedUniverses || "Personnalisé"} />
              <SummaryItem label="Sujet Principal" value={options.visualElements} />
              {options.visualElementDescriptions.length > 0 && (
                <SummaryItem label="Description du sujet" value={options.visualElementDescriptions.join(' + ')} />
              )}
              {isSizedElement && (
                 <SummaryItem label="Taille du sujet" value={`${options.elementSize ?? 75}% de la hauteur`} />
              )}
            </div>
          </section>

          <section className="space-y-4 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-purple-200 font-orbitron mb-3">Style & Ambiance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SummaryItem label="Type de jeu" value={options.gameType} />
              <SummaryItem label="Style Graphique" value={options.graphicStyle} />
              <SummaryItem label="Ambiance / Éclairage" value={options.ambiance || "Automatique"} />
              <SummaryItem label="Intensité des effets" value={`${options.effectsIntensity}%`} />
              {options.inspirationImage && <SummaryItem label="Image d'inspiration" value="Oui" />}
            </div>
          </section>

          <section className="space-y-4 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-purple-200 font-orbitron mb-3">Format & Finitions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SummaryItem label="Format" value={options.format} />
              <SummaryItem label="Résolution" value={options.highResolution ? "Haute Définition" : "Standard"} />
              {options.transparentBackground && <SummaryItem label="Fond" value="Transparent (PNG)" />}
              {options.reservePartnerZone && <SummaryItem label="Zone Partenaires" value={`Oui, en ${options.partnerZonePosition === 'bottom' ? 'bas' : 'haut'} (${options.partnerZoneHeight}%)`} />}
            </div>
          </section>

          <section className="space-y-4 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-purple-200 font-orbitron mb-3">Informations de l'événement</h3>
            {shouldDisplayText ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SummaryItem label="Événement" value={options.eventName} />
                <SummaryItem label="Slogan" value={options.baseline} />
                <SummaryItem label="Lieu" value={options.eventLocation} />
                <SummaryItem label="Date" value={options.eventDate} />
              </div>
            ) : (
              <p className="text-gray-400 italic">Aucun texte ne sera affiché sur le visuel.</p>
            )}
          </section>

        </main>

        <footer className="flex-shrink-0 p-6 flex justify-end items-center gap-4 border-t border-gray-700">
          <button type="button" onClick={onClose} disabled={isLoading} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition">
            Modifier
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="w-64 flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg transition"
          >
            {isLoading ? <><SpinnerIcon className="w-5 h-5" /> Lancement...</> : 'Confirmer & Générer'}
          </button>
        </footer>
      </div>
    </div>
  );
};


// --- NEW MODAL FOR MODIFICATION CONFIRMATION ---

interface ModificationConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  summary: PromptChangeSummary | null;
  isLoading: boolean;
}

export const ModificationConfirmationModal: React.FC<ModificationConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  summary,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in-up"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 p-6 flex justify-between items-center border-b border-gray-700">
          <h2 className="text-xl font-bold font-orbitron text-purple-300">
            Confirmation de la modification
          </h2>
          <button onClick={onClose} disabled={isLoading} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </header>

        <main className="flex-grow p-6 overflow-y-auto space-y-6">
          {isLoading || !summary ? (
            <div className="flex flex-col items-center justify-center text-center py-10">
                <SpinnerIcon className="w-12 h-12 text-purple-400 mb-4" />
                <p className="text-lg text-gray-300">J'analyse votre demande et prépare le nouveau prompt...</p>
            </div>
          ) : (
            <>
                <p className="text-gray-300">Voici comment j'ai interprété votre demande de modification. Confirmez-vous ces changements ?</p>
                <section className="space-y-4 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold text-green-400 font-orbitron">Éléments conservés</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-300">
                        {summary.kept.map((item, index) => <li key={`kept-${index}`}>{item}</li>)}
                    </ul>
                </section>
                <section className="space-y-4 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold text-yellow-400 font-orbitron">Éléments modifiés</h3>
                     <ul className="list-disc list-inside space-y-1 text-gray-300">
                        {summary.changed.map((item, index) => <li key={`changed-${index}`}>{item}</li>)}
                    </ul>
                </section>
            </>
          )}
        </main>

        <footer className="flex-shrink-0 p-6 flex justify-end items-center gap-4 border-t border-gray-700">
          <button type="button" onClick={onClose} disabled={isLoading} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition">
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || !summary}
            className="w-64 flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg transition"
          >
            {isLoading && !summary ? <><SpinnerIcon className="w-5 h-5" /> Analyse...</> : 'Confirmer & Modifier'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ConfirmationModal;