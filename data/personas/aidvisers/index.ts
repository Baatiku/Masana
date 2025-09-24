import { advisoryPersonas } from './advisory';
import { expertPersonas } from './experts';
import { healthPersonas } from './health';
import { Persona } from '../../../types';

export const aidvisersPersonas: Persona[] = [
    ...healthPersonas,
    ...advisoryPersonas,
    ...expertPersonas
];
