#! /usr/bin/env node

import path from 'path';
import { readFile } from 'fs/promises';

import { program, Option } from 'commander';
import { globby } from 'globby';

import VueParser from './parsers/vue-sfc.js';
import formatPretty from './formatters/pretty.js';
import formatJson from './formatters/json.js';
import formatQuickfix from './formatters/quickfix.js';

program
  .name('parsesearch')
  .description('Utility to search for code in a project using a parser, not regex')
  .addOption(
    new Option('-p, --parser <parser>', 'The parser to use')
      .choices(['vue-sfc'])
      .default('vue-sfc')
  )
  .addOption(
    new Option('-f, --format <formatter>', 'The formatter to output with')
      .choices(['pretty', 'json', 'quickfix'])
      .default(process.env.VIMRUNTIME ? 'quickfix' : 'pretty')
  )
  .option('--color', 'Force color output', false)
  .option('--no-color', 'Force no color output')
  .argument('<match>', 'The match to search for')
  .argument('[file...]', 'The file(s) to search');

program.parse();

const [matcher, ...fileArgs] = program.args;

const options = program.opts();
const Parser = options.parser === 'vue-sfc' ? VueParser : null;
const parser = new Parser();

const cwd = process.cwd();
const filesAllInCwd = fileArgs.every((file) =>
  (!path.isAbsolute(file) || file.startsWith(cwd)) && !file.startsWith('../')
);
const files = await globby(fileArgs.length ? fileArgs : Parser.defaultGlob, {
  cwd,
  gitignore: filesAllInCwd,
  expandDirectories: { files: [Parser.defaultGlob] },
});

const output = [];

for (const file of files) {
  const content = await readFile(file, 'utf8');
  const matches = parser.parse(content, { path: file, matcher });

  output.push({ file, content, matches });
}

if (options.format === 'pretty') {
  formatPretty(output, options);
} else if (options.format === 'json') {
  formatJson(output, options);
} else if (options.format === 'quickfix') {
  formatQuickfix(output, options);
} else {
  throw new Error('Unknown formatter');
}

