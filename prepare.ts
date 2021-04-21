import { readFile, writeFile } from 'fs/promises';
import path from 'path';

import cheerio from 'cheerio';
import { command, restPositionals, run } from 'cmd-ts';

import { format } from './format';
import { walk } from './walk';

run(
   command({
      name: 'prepare',
      args: {
         filter: restPositionals(),
      },
      handler: async ({ filter }) => {
         for await (const svg of walk('src', /\.svg$/)) {
            const { dir, name } = path.parse(svg);

            if (!filter.some(($) => `${dir}/${name}`.includes($))) {
               continue;
            }

            const $ = cheerio.load(await readFile(svg), { xml: true, decodeEntities: false });

            for (const image of $('g[inkscape\\:label="dump"] image')) {
               image.attribs['id'] = path.parse(image.attribs['xlink:href']).name;
            }

            await writeFile(svg, format($.html()));
         }
      },
   }),
   process.argv.slice(2),
);
