
import React from 'react';

const PaintBrushIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M14.063 4.188a2.625 2.625 0 0 1 3.712 0l1.838 1.838a2.625 2.625 0 0 1 0 3.712l-8.213 8.212a.75.75 0 0 1-1.06 0l-5.55-5.55a.75.75 0 0 1 0-1.06L14.063 4.188Z" />
    <path d="M5.337 18.063a.75.75 0 0 1 .53-1.28l1.768-.21a.75.75 0 0 0 .61-.61l.21-1.768a.75.75 0 0 1 1.28-.53l4.188 4.188a.75.75 0 0 1-.53 1.28l-1.768.21a.75.75 0 0 0-.61.61l-.21 1.768a.75.75 0 0 1-1.28.53L5.337 18.063Z" />
  </svg>
);

export default PaintBrushIcon;
