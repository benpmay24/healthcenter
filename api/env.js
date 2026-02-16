/**
 * Load .env from the api directory into process.env.
 * Uses only Node built-ins so we don't depend on the dotenv package at runtime
 * (avoids module resolution issues on some hosts like Render).
 */
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '.env');

if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split(/\n/)) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) {
      const value = m[2].trim().replace(/^["']|["']$/g, '');
      process.env[m[1].trim()] = value;
    }
  }
}
