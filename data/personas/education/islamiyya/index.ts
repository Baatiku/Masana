import { Persona } from '../../../../types';
import { eduIslamiyyaQuran } from './edu-islamiyya-quran';
import { eduIslamiyyaFiqh } from './edu-islamiyya-fiqh';
import { eduIslamiyyaSeerah } from './edu-islamiyya-seerah';
import { eduIslamiyyaArabic } from './edu-islamiyya-arabic';
import { eduIslamiyyaAkhlaq } from './edu-islamiyya-akhlaq';
import { eduIslamiyyaTarikh } from './edu-islamiyya-tarikh';

export const islamiyyaPersonas: Persona[] = [
    eduIslamiyyaQuran,
    eduIslamiyyaFiqh,
    eduIslamiyyaSeerah,
    eduIslamiyyaArabic,
    eduIslamiyyaAkhlaq,
    eduIslamiyyaTarikh,
];
