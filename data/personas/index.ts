import { Persona } from '../../types';

// MASANA
import { masanaPersonas } from './masana';

// AIdvisers
import { aidvisersPersonas } from './aidvisers';

// EDUCATION
import { educationPersonas } from './education';

// CIVIC LIFE
import { civicLifePersonas } from './civic-life';

// TOOLS
import { toolsPersonas } from './tools';


export const personas: Persona[] = [
  // === MASANA ===
  ...masanaPersonas,
  
  // === AIdvisers ===
  ...aidvisersPersonas,

  // === EDUCATION ===
  ...educationPersonas,
  
  // === CIVIC LIFE ===
  ...civicLifePersonas,

  // === TOOLS ===
  ...toolsPersonas,
];