#! /usr/bin/env node

import { readFile } from 'fs/promises';

import { program, Option } from 'commander';
import chalk from 'chalk';
import { globby } from 'globby';
import { emphasize } from 'emphasize/lib/all.js';

import VueParser from './parsers/vue-sfc.js';

program
  .name('parsesearch')
  .description('Utility to search for code in a project using a parser, not regex')
  .addOption(
    new Option('-p, --parser <parser>', 'The parser to use')
      .choices(['vue-sfc'])
      .default('vue-sfc')
  )
  .option('-m, --match <match...>', 'The matches to search for')
  .option('-f, --file [file...]', 'The file(s) to search');

program.parse();

const options = program.opts();
const Parser = options.parser === 'vue-sfc' ? VueParser : null;
const parser = new Parser();

const files = await globby(options.file || Parser.defaultGlob, {
  gitignore: true,
  expandDirectories: { files: [Parser.defaultGlob] },
});

for (const file of files) {
  const content = await readFile(file, 'utf8');
  const matches = parser.parse(content, { path: file, matches: options.match });

  if (matches.length) {
    const biggestLineNumber = matches.reduce((acc, match) => Math.max(acc, match.endLine), 0);
    const lineNumberLength = biggestLineNumber.toString().length;
    const padNum = (lineNumber) => lineNumber.toString().padStart(lineNumberLength, ' ');

    console.log('\n' + chalk.green.bold(file));

    const highlightedFile = emphasize.highlightAuto(content).value;
    const splitFile = highlightedFile.split('\n');

    for (const match of matches) {
      console.log();

      for (let line = match.startLine - 1; line < match.endLine; line++) {
        console.log(chalk.yellow.bold(padNum(line)) + ': ' + splitFile[line]);
      }
    }
  }
}
