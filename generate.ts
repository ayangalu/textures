import { spawn, spawnSync } from 'child_process';
import { mkdir } from 'fs/promises';
import path from 'path';

import { command, flag, option, restPositionals, run, Type } from 'cmd-ts';

import { walk } from './walk';

const uint: Type<string, number> = {
   from: async (input) => {
      if (!input.match(/^(?:\d|[1-9]\d+)$/)) {
         throw new Error(`'${input}' is not an uint`);
      }

      return parseInt(input);
   },
};

run(
   command({
      name: 'generate',
      args: {
         all: flag({
            long: 'all',
         }),
         scaleMin: option({
            long: 'scale-min',
            type: uint,
            defaultValue: () => 4,
         }),
         scaleMax: option({
            long: 'scale-max',
            type: uint,
            defaultValue: () => 8,
         }),
         scaleStep: option({
            long: 'scale-step',
            type: uint,
            defaultValue: () => 1,
         }),
         filter: restPositionals(),
      },
      handler: async ({ all, scaleMin, scaleMax, scaleStep, filter }) => {
         const inkscape = spawn('inkscape', ['--shell']);

         const write = (input: string) =>
            new Promise((resolve) => {
               if (inkscape.stdin.write(input)) {
                  process.nextTick(resolve);
               } else {
                  inkscape.stdin.once('drain', resolve);
               }
            });

         for await (const svg of walk('src', /\.svg$/)) {
            console.log(svg);

            const { dir, name } = path.parse(svg);

            if (!all && !filter.some(($) => `${dir}/${name}`.includes($))) {
               console.log('\tskip');
               continue;
            }

            const [_, ...dirParts] = dir.split(path.sep);

            const texIds = spawnSync('inkscape', ['--query-all', svg], { encoding: 'utf8' })
               .stdout.split('\n')
               .filter((line) => line.startsWith('tex1_'))
               .map((line) => line.split(',')[0]);

            await write(`file-open:${svg}\n`);

            for (let scale = scaleMin; scale <= scaleMax; scale += scaleStep) {
               console.log(`\tgenerate ${scale}x`);

               const destinationPath = path.join('dist', `${scale}x`, ...dirParts, name);

               await mkdir(destinationPath, { recursive: true });

               for (const id of texIds) {
                  const exportActions = Object.entries({
                     id,
                     filename: path.resolve(destinationPath, `${id}.png`),
                     dpi: scale * 96,
                  })
                     .map(([key, value]) => `export-${key}:${value}`)
                     .join('; ');

                  await write(`${exportActions}; export-do\n`);
                  await new Promise<void>((resolve) => {
                     const exportListener = (data: string) => {
                        if (data.includes('export')) {
                           inkscape.stderr.removeListener('data', exportListener);
                           resolve();
                        }
                     };

                     inkscape.stderr.addListener('data', exportListener);
                  });
               }
            }
         }

         inkscape.stdin.end();
      },
   }),
   process.argv.slice(2),
);
