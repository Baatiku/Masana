import React, { useState, useEffect } from 'react';
import { Persona } from '../types';

interface PersonaAvatarProps {
  persona: Partial<Persona>;
  className?: string;
}

const getInitials = (name: string = ''): string => {
  const names = name.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + (names.length > 1 ? names[names.length - 1].charAt(0) : '')).toUpperCase();
};

// Consistent color palette for avatars
const COLORS = [
  '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e',
  '#f1c40f', '#e67e22', '#e74c3c', '#95a5a6', '#16a085',
  '#27ae60', '#2980b9', '#8e44ad', '#2c3e50', '#f39c12',
  '#d35400', '#c0392b', '#7f8c8d'
];

const getBackgroundColor = (name: string = ''): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % COLORS.length);
  return COLORS[index];
};

const PersonaAvatar: React.FC<PersonaAvatarProps> = ({ persona, className }) => {
  const [useFallback, setUseFallback] = useState(!persona.avatarUrl);

  useEffect(() => {
    setUseFallback(!persona.avatarUrl);
  }, [persona.avatarUrl]);

  const handleImageError = () => {
    setUseFallback(true);
  };

  if (useFallback) {
    const initials = getInitials(persona.name);
    const bgColor = getBackgroundColor(persona.name);

    return (
      <div
        className={`flex items-center justify-center rounded-full text-white font-bold ${className}`}
        style={{ backgroundColor: bgColor }}
        aria-label={persona.name}
      >
        <span>{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={persona.avatarUrl}
      alt={persona.name || 'Persona Avatar'}
      className={`rounded-full object-cover ${className}`}
      onError={handleImageError}
    />
  );
};

export default PersonaAvatar;