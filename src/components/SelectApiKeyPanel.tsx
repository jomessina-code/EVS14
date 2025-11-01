

import React from 'react';

const EVS_LOGO_URL = "https://i.postimg.cc/nVCRVCHb/logo-EVSV2.png";

interface SelectApiKeyPanelProps {
  onSelectKey: () => void;
  platformApiReady: boolean;
}

const SelectApiKeyPanel: React.FC<SelectApiKeyPanelProps> = ({ onSelectKey, platformApiReady }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-gray-900 p-6 text-center">
      <div className="w-full max-w-2xl mx-auto">
        <img 
          src={EVS_LOGO_URL} 
          alt="Logo Esport Visual Studio" 
          className="h-[120px] w-auto mx-auto mb-6"
        />
        <h1 className="text-3xl font-bold text-purple-300 font-orbitron mb-4">Configuration Requise</h1>
        
        {platformApiReady ? (
          <div className="bg-black/20 p-6 rounded-lg border border-purple-800/50 space-y-4">
            <p className="text-lg text-gray-300">
              Pour utiliser les fonctionnalités de génération, vous devez sélectionner une clé API Google AI.
            </p>
            <p className="text-gray-400">
              Cliquez sur le bouton ci-dessous pour ouvrir la boîte de dialogue de sélection. Assurez-vous que la facturation est activée sur le projet Google Cloud associé à votre clé pour éviter toute interruption de service.
            </p>
            <div>
              <button 
                onClick={onSelectKey}
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition text-lg"
              >
                Sélectionner une Clé API
              </button>
            </div>
            <p className="text-xs text-gray-500 pt-4">
              Pour plus d'informations sur la facturation, consultez la 
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline ml-1"
              >
                documentation officielle
              </a>.
            </p>
          </div>
        ) : (
          <div className="bg-black/20 p-6 rounded-lg border border-red-800/50 space-y-4">
            <h2 className="text-xl font-bold text-red-400">Erreur d'Environnement</h2>
            <p className="text-lg text-gray-300">
              Impossible d'initialiser le sélecteur de clé API.
            </p>
            <p className="text-gray-400">
              Cette application doit être exécutée dans un environnement spécifique (comme Google AI Studio) qui fournit la fonctionnalité de sélection de clé. Il semble que cet environnement ne soit pas détecté.
            </p>
            <p className="text-xs text-gray-500 pt-4">
              Veuillez recharger l'application dans l'environnement prévu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectApiKeyPanel;
