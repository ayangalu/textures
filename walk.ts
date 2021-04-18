import { opendir } from 'fs/promises';
import path from 'path';

export async function* walk(dirPath: string, filter = /.+/): AsyncGenerator<string> {
   for await (const entry of await opendir(dirPath)) {
      const next = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
         yield* walk(next, filter);
      } else if (entry.isFile() && filter.test(entry.name)) {
         yield next;
      }
   }
}
