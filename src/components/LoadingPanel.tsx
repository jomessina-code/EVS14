import React from 'react';

interface LoadingPanelProps {
  progress: number;
  message: string;
}

const EVS_LOGO_URL = "https://i.postimg.cc/nVCRVCHb/logo-EVSV2.png";

const LoadingPanel: React.FC<LoadingPanelProps> = ({ progress, message }) => {
  return (
    <div className="h-full flex flex-col bg-gray-900">
      <main className="flex-grow flex flex-col items-center justify-center p-6 text-center">
        <img 
          src={EVS_LOGO_URL} 
          alt="Logo Esport Visual Studio" 
          className="h-[120px] w-auto mx-auto mb-6"
        />
        <h1 className="text-4xl font-bold text-white font-orbitron mb-8">Esport Visual Studio</h1>

        <div className="creative-spinner mb-12">
          <div className="spinner-glow"></div>
          <div className="spinner-core"></div>
          <div className="spinner-ball"></div>
        </div>

        <div className="w-full max-w-md">
          <h2 className="text-xl font-semibold text-white font-orbitron mb-4">{message}</h2>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-purple-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="mt-2 text-gray-400 text-sm">{progress}%</p>
        </div>
      </main>
    </div>
  );
};

export default LoadingPanel;