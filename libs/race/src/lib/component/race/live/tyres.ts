import { Tyre } from '@f2020/data';

/** The colours are as F1 shows the compounds. `colour` is for a bar of the compound, `text` for its letter */
export const tyres: Record<Tyre, { letter: string; name: string; colour: string; text: string }> = {
  SOFT: { letter: 'S', name: 'Blød', colour: 'bg-red-600 text-white', text: 'text-red-500' },
  MEDIUM: { letter: 'M', name: 'Medium', colour: 'bg-yellow-400 text-black', text: 'text-yellow-600 dark:text-yellow-400' },
  HARD: { letter: 'H', name: 'Hård', colour: 'bg-gray-100 text-black', text: 'text-gray-500 dark:text-gray-100' },
  INTERMEDIATE: { letter: 'I', name: 'Intermediate', colour: 'bg-green-600 text-white', text: 'text-green-500' },
  WET: { letter: 'W', name: 'Regn', colour: 'bg-blue-600 text-white', text: 'text-blue-500' },
};

export const unknownTyre = { letter: '?', name: 'Ukendt', colour: 'bg-gray-500 text-white', text: 'text-gray-400' };
