import { readFile, writeFile } from 'fs/promises';
import path from 'path';

import cheerio from 'cheerio';

import { walk } from './walk';

async function run() {
   const excessAttributes = ['inkscape:export-xdpi', 'inkscape:export-ydpi', 'sodipodi:absref'] as const;

   for await (const svg of walk('src', /\.svg$/)) {
      const $ = cheerio.load(await readFile(svg), { xml: true, decodeEntities: false });

      const { name } = path.parse(svg);

      for (const element of $('*')) {
         for (const attribute of excessAttributes) {
            delete element.attribs[attribute];
         }
      }

      await writeFile(svg, $.html().replace(/&apos;/gmu, `'`));
   }
}

run();
