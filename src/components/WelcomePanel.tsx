

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
                  className="font-semibold text-gray-300 hover:text-white transition-colors cursor-pointer hover:underline"
                  aria-label="Se connecter (fonctionnalité à venir)"
              >
                  Se connecter
              </a>
              <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="font-semibold bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors cursor-pointer"
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
              Créez facilement des visuels e-sport uniques pour vos tournois, streams, équipes ou simplement pour partager votre univers avec votre communauté.
            </p>
            <div className="space-y-6">
              <div className="bg-black/20 p-6 rounded-lg border border-purple-800/50">
                <div className="text-5xl mb-4 animate-pulse">✨</div>
                  <h3 className="font-bold text-xl text-gray-300 font-orbitron">Comment ça marche ?</h3>
                  <ol className="text-gray-400 list-decimal list-inside mt-4 space-y-2 text-left mx-auto max-w-md">
                      <li>Utilisez le volet de création à gauche pour définir votre univers, votre style et votre ambiance.</li>
                      <li>Ajoutez vos informations d’événement si vous souhaitez afficher du texte.</li>
                      <li>Cliquez sur « ✨ Générer le visuel ✨ » pour créer votre composition.</li>
                      <li>Téléchargez votre visuel ou adaptez-le à différents formats (bannière, carré, story…).</li>
                  </ol>
              </div>

              <div className="bg-black/20 p-6 rounded-lg border border-purple-800/50">
                  <h3 className="font-bold text-xl text-gray-300 font-orbitron">💎 Tarification</h3>
                  <p className="text-gray-400 mt-2 max-w-md mx-auto">
                    Un système simple, transparent et flexible. Pas d’abonnement, juste des crédits pour donner vie à votre créativité.
                  </p>
                  <button onClick={onOpenPricingModal} className="mt-4 text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                    ⚙️ En savoir plus
                  </button>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePanel;