import React from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  
  return (
    <div 
      key={location.pathname} 
      className="animate-fade-in"
      style={{
        animationDuration: '0.4s',
        animationFillMode: 'both'
      }}
    >
      {children}
    </div>
  );
};