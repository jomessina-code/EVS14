import React from 'react';
import type { QualityCheckResults } from '../types';

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const WarningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.22 3.006-1.742 3.006H4.42c-1.522 0-2.492-1.672-1.742-3.006l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
  </svg>
);

const QualityCheckItem: React.FC<{ label: string; status: boolean; warningText: string }> = ({ label, status, warningText }) => (
  <li className={`flex items-center text-sm ${status ? 'text-green-400' : 'text-yellow-400'}`}>
    {status ? <CheckIcon /> : <WarningIcon />}
    <span className="ml-2 font-semibold">{label}</span>
    {!status && <span className="ml-2 text-yellow-500 font-normal">- {warningText}</span>}
  </li>
);

const QualityCheckPanel: React.FC<{ results: QualityCheckResults }> = ({ results }) => {
  return (
    <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 ml-auto">
      <h4 className="text-sm font-bold text-gray-300 mb-2 font-orbitron">Contrôle Qualité</h4>
      <ul className="space-y-1">
        <QualityCheckItem 
          label="Résolution HD" 
          status={results.resolution}
          warningText="Génération en basse résolution."
        />
        <QualityCheckItem 
          label="Ratio Conforme" 
          status={results.ratio}
          warningText="Le ratio a pu être altéré."
        />
         <QualityCheckItem 
          label="Aucune Marge" 
          status={results.margins}
          warningText="Des marges blanches sont peut-être présentes."
        />
        <QualityCheckItem 
          label="Texte sans erreur" 
          status={results.text}
          warningText="Le texte a peut-être été mal retranscrit."
        />
      </ul>
    </div>
  );
};

export default QualityCheckPanel;