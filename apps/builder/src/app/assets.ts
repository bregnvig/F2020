import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

/**
 * Path to a file in the assets folder, which the build copies next to main.js.
 * Resolved from the bundle rather than the working directory, which is the workspace root under nx serve.
 */
export const assetPath = (file: string) => join(dirname(fileURLToPath(import.meta.url)), 'assets', file);
