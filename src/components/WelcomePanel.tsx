

import React from 'react';

const EVS_LOGO_URL = "https://i.postimg.cc/nVCRVCHb/logo-EVSV2.png";

interface WelcomePanelProps {
  onOpenPricingModal: () => void;
}

const WelcomePanel: React.FC<WelcomePanelProps> = ({ onOpenPricingModal }) => {
  return (
    <div className="h-full flex flex-col bg-gray-900 p-6 text-center overflow-y-auto">
      <header className="w-full flex justify-end flex-shrink-0 mb-6">
          <div className="text-right text-sm flex items-center gap-4">
               <a 
                  href="#" 
                  onClick={(e) => e.preventDefault()} 
                  className="font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Switch to English (coming soon)"
               >
                  EN
               </a>
              <span className="text-gray-600">|</span>
              <a 
                  href="#" 
                  onClick={(e) => e.preventDefault()} 
                  className="font-bold text-gray-300 hover:text-white transition-colors cursor-pointer hover:underline"
                  aria-label="Se connecter (fonctionnalité à venir)"
              >
                  Se connecter
              </a>
              <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="font-bold bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors cursor-pointer"
                  aria-label="S'inscrire (fonctionnalité à venir)"
              >
                  S'inscrire
              </a>
          </div>
      </header>
      <div className="flex-grow flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl mx-auto">
            <img 
              src={EVS_LOGO_URL} 
              alt="Logo Esport Visual Studio" 
              className="h-[120px] w-auto mx-auto mb-6"
            />
            <h1 className="text-4xl font-bold text-white font-orbitron mb-4">Esport Visual Studio</h1>
            <p className="text-lg text-gray-400 mb-8">
              Crée facilement des visuels e-sport uniques pour tes tournois, streams, équipes ou simplement pour partager ton univers avec ta communauté.
            </p>
            <div className="space-y-6">
              <div className="bg-black/20 p-6 rounded-lg border border-purple-800/50">
                  <div className="text-5xl mb-2 pulse-emoji text-yellow-300">✨</div>
                  <h3 className="font-bold text-xl text-gray-300 font-orbitron mb-4">Comment ça marche ?</h3>
                  <ol className="text-gray-400 list-decimal list-inside space-y-2 text-left mx-auto max-w-md">
                      <li>Utilise le Studio de Création à gauche pour définir ton univers, ton style et ton ambiance.</li>
                      <li>Ajoute tes informations d’événement si tu souhaites afficher du texte.</li>
                      <li>Clique sur « <span className="text-yellow-300">✨</span> Générer le visuel <span className="text-yellow-300">✨</span> » pour créer ta composition.</li>
                      <li>Télécharge ton visuel ou adapte-le à différents formats (affiche, carré, story, bannière, etc.).</li>
                  </ol>
              </div>

              <div className="bg-black/20 p-6 rounded-lg border border-purple-800/50">
                  <h3 className="font-bold text-xl text-gray-300 font-orbitron">Tarification</h3>
                  <p className="text-gray-400 mt-2 max-w-md mx-auto">
                    Un système simple, transparent et flexible. Pas d’abonnement, juste des crédits pour donner vie à ta créativité.
                  </p>
                  <button onClick={onOpenPricingModal} className="mt-4 text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                    En savoir plus
                  </button>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePanel;