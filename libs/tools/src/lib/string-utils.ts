/**
 * Converts a camelCase string to title case with spaces.
 * @param {string} str - The camelCase string.
 * @return {string} The title case string with spaces.
 */
function humanizeCamelCase(str: string) {
  return str
    // Replace underscores with spaces
    .replace(/_/g, ' ')
    // Insert a space before each uppercase letter or digit that is preceded by a lowercase letter
    .replace(/([a-z])([A-Z0-9])/g, '$1 $2')
    // Insert a space before each uppercase letter followed by a lowercase letter
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    // Capitalize the first letter of the entire string
    .replace(/^./, (match) => match.toUpperCase())
    // Capitalize the first letter after each space
    .replace(/(\s\w)/g, (match) => match.toUpperCase())
    // Trim leading/trailing spaces
    .trim();
}

function titleCase(str: string): string {
  return str.toLowerCase().split(' ').map(function(word) {
    return word.replace(word[0], word[0].toUpperCase());
  }).join(' ');
}

function normalizeString(str: string) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export const StringUtils = {
  /**
   * Returns a string with the first letter capitalized.
   * @param str The string to capitalize.
   * @returns The capitalized string.
   * @example
   * capitalize('hello world'); // 'Hello world'
   */
  capitalizeFirstLetter: (str: string): string => str.charAt(0).toUpperCase() + str.slice(1),
  camelCase: (str: string): string => {
    const count = [...str].findIndex(c => !StringUtils.isUpperCase(c));
    return str.substring(0, count).toLocaleLowerCase() + str.substring(count);
  },
  isUpperCase: (c: string): boolean => !!c && c !== c.toLocaleLowerCase(),
  humanizeCamelCase,
  titleCase,
  normalize: normalizeString,
};
