import { Persona } from '../../../types';
import { federalPersonas } from './federal';
import { figuresPersonas } from './figures';
import { statePersonas } from './states';

export const civicLifePersonas: Persona[] = [
    ...federalPersonas,
    ...statePersonas,
    ...figuresPersonas,
];
