import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  glowColor?: 'cyan' | 'purple';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = true, 
  glow = false,
  glowColor = 'cyan'
}) => {
  const glowStyle = glow 
    ? (glowColor === 'cyan' ? 'shadow-glow border-cyberCyan/30' : 'shadow-neonPurple border-neonPurple/30') 
    : 'border-cyberCyan/10';

  return (
    <div className={`
      relative overflow-hidden rounded-2xl glass-panel p-6 
      ${hover ? 'glass-panel-hover' : ''} 
      ${glowStyle}
      ${className}
    `}>
      {children}
    </div>
  );
};
