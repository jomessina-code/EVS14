import React from 'react';

const EyeIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639l4.34-7.483c.2-.351.52-.593.886-.593H16.74c.366 0 .686.242.886.593l4.34 7.483a1.012 1.012 0 0 1 0 .639l-4.34 7.483c-.2.351-.52-.593-.886-.593H7.262c-.366 0-.686-.242-.886-.593l-4.34-7.483Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

export default EyeIcon;
