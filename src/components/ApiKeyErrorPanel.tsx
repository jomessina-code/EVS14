
import React from 'react';

const EVS_LOGO_URL = "https://i.postimg.cc/nVCRVCHb/logo-EVSV2.png";

const ApiKeyErrorPanel: React.FC = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-gray-900 p-6 text-center">
      <div className="w-full max-w-2xl mx-auto">
        <img 
          src={EVS_LOGO_URL} 
          alt="Logo Esport Visual Studio" 
          className="h-[120px] w-auto mx-auto mb-6"
        />
        <h1 className="text-3xl font-bold text-red-400 font-orbitron mb-4">Configuration Requise</h1>
        <div className="bg-black/20 p-6 rounded-lg border border-red-800/50 space-y-4">
          <p className="text-lg text-gray-300">
            La clé d'API pour le service Gemini est manquante ou invalide.
          </p>
          <p className="text-gray-400">
            Pour que l'application fonctionne, vous devez configurer la variable d'environnement <code className="bg-gray-700 text-purple-300 px-2 py-1 rounded-md text-sm">API_KEY</code> dans les paramètres de votre projet sur votre plateforme d'hébergement (par ex. Vercel).
          </p>
          <div>
            <a 
              href="https://vercel.com/docs/projects/environment-variables" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              Voir la documentation Vercel
            </a>
          </div>
          <p className="text-xs text-gray-500 pt-4">
            Après avoir ajouté la clé, n'oubliez pas de redéployer votre application.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyErrorPanel;