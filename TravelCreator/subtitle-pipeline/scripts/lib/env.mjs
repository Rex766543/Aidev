import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function loadEnv(cwd = process.cwd()) {
  for (const fname of ['.env.local', '.env']) {
    try {
      const content = await readFile(path.join(cwd, fname), 'utf8');
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (!m || process.env[m[1]]) continue;
        let v = m[2].trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        process.env[m[1]] = v;
      }
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
  }
}
