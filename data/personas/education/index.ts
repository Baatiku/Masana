import { primaryPersonas } from './primary';
import { secondaryPersonas } from './secondary';
import { tertiaryPersonas } from './tertiary';
import { islamiyyaPersonas } from './islamiyya';

export const educationPersonas = [
    ...tertiaryPersonas,
    ...secondaryPersonas,
    ...primaryPersonas,
    ...islamiyyaPersonas
];
