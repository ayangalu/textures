import path from 'path';

import { walk } from './walk';

async function run() {
   const pathMap = new Map<string, string[]>();

   for await (const texture of walk(process.argv[2], /\.png$/)) {
      const { name, dir } = path.parse(texture);
      const texturePaths = pathMap.get(name) ?? [];
      texturePaths.push(dir);
      pathMap.set(name, texturePaths);
   }

   for (const [texture, paths] of pathMap) {
      if (paths.length <= 1) {
         continue;
      }

      console.log(texture);

      for (const dir of paths) {
         console.log(`\t${dir}`);
      }
   }
}

run();
