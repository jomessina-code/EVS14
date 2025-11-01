
import React from 'react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const packs = [
  { icon: '🎯', name: 'Découverte', price: '4,90 €', credits: '100', approx: '~20 visuels' },
  { icon: '⚡', name: 'Créateur', price: '9,90 €', credits: '200', approx: '~40 visuels' },
  { icon: '🚀', name: 'Pro Gamer', price: '24,90 €', credits: '500', approx: '~100 visuels' },
  { icon: '🏫', name: 'Association', price: '44,90 €', credits: '1 000', approx: '~200 visuels' },
];

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in-up"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 p-6 flex justify-between items-start border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold font-orbitron text-purple-300">💎 Tarification</h2>
            <p className="text-gray-400">Simple. Flexible. Sans abonnement.</p>
          </div>
          <div className="flex items-center gap-4">
             <a 
                  href="#" 
                  onClick={(e) => e.preventDefault()} 
                  className="font-semibold text-gray-300 hover:text-white transition-colors cursor-pointer hover:underline text-sm"
                  aria-label="Se connecter (fonctionnalité à venir)"
              >
                  Se connecter
              </a>
              <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="font-semibold bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-lg transition-colors cursor-pointer text-sm"
                  aria-label="S'inscrire (fonctionnalité à venir)"
              >
                  S'inscrire
              </a>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
          </div>
        </header>

        <main className="flex-grow p-6 overflow-y-auto space-y-6">
          <p className="text-gray-300">
            Esport Visual Studio utilise un système de crédits : vous payez uniquement ce que vous consommez, visuel par visuel.
          </p>

          <section>
            <h3 className="text-lg font-semibold text-white font-orbitron mb-3">⚙️ Comment ça marche</h3>
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
              <ul className="space-y-2 text-gray-300">
                <li className="flex justify-between items-center"><span>Génération standard</span> <span className="font-bold text-purple-400">5 crédits</span></li>
                <li className="flex justify-between items-center"><span>Univers personnalisé</span> <span className="font-bold text-purple-400">10 crédits</span></li>
                <li className="flex justify-between items-center"><span>Variation ou format story</span> <span className="font-bold text-purple-400">2 à 3 crédits</span></li>
              </ul>
              <hr className="border-gray-600 my-3" />
              <p className="text-sm text-gray-400">Les crédits peuvent être achetés à tout moment et n’expirent jamais.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-white font-orbitron mb-3">💰 Packs de crédits</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left bg-gray-900/50 rounded-lg border border-gray-700">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="p-3">Pack</th>
                    <th className="p-3 text-center">Prix</th>
                    <th className="p-3 text-center">Crédits inclus</th>
                    <th className="p-3 text-right">Environ</th>
                  </tr>
                </thead>
                <tbody>
                  {packs.map((pack) => (
                    <tr key={pack.name} className="border-t border-gray-700">
                      <td className="p-3 font-semibold">{pack.icon} {pack.name}</td>
                      <td className="p-3 text-center font-bold text-purple-300">{pack.price}</td>
                      <td className="p-3 text-center">{pack.credits} crédits</td>
                      <td className="p-3 text-right text-gray-400">{pack.approx}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          
          <section>
            <h3 className="text-lg font-semibold text-white font-orbitron mb-3">💜 Avantages</h3>
             <ul className="text-gray-300 list-inside space-y-1">
                <li>✅ 15 crédits offerts à l’inscription</li>
                <li>✅ Aucun abonnement automatique</li>
                <li>✅ Crédits bonus lors d’événements partenaires</li>
            </ul>
          </section>

        </main>
      </div>
    </div>
  );
};

export default PricingModal;