import { renderDocs } from '../lib';
import yargs = require('yargs');

export async function main() {
  const args = yargs
    .env('GEN')
    .usage('Usage: $0 [node_modules]')
    .option('outdir', { type: 'string', default: 'dist', alias: 'o', required: true, desc: 'Output directory' })
    .argv;

  const modulesDirectory = args._[0] as string ?? 'node_modules';
  await renderDocs({
    modulesDirectory,
    outdir: args.outdir,
  });
}


main().catch(e => {
  // tslint:disable-next-line:no-console
  console.error(e);
  process.exit(1);
});
