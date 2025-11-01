import React from 'react';

const MicrophoneIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z"></path>
    <path d="M17 11a1 1 0 0 0-1 1 4 4 0 0 1-8 0 1 1 0 0 0-2 0 6 6 0 0 0 6 6v3a1 1 0 0 0 2 0v-3a6 6 0 0 0 6-6 1 1 0 0 0-1-1z"></path>
  </svg>
);

export default MicrophoneIcon;