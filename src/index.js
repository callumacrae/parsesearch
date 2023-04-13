#! /usr/bin/env node

import { readFile } from 'fs/promises';

import { program, Option } from 'commander';
import styles from 'ansi-styles';
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

    process.stdout.write('\n' + chalk.green.bold(file) + '\n');

    const highlightedFile = emphasize.highlight('html', content).value;
    const splitFile = highlightedFile.split('\n');

    for (const match of matches) {
      process.stdout.write('\n');

      for (let line = match.startLine; line < match.endLine + 1; line++) {
        process.stdout.write(chalk.yellow.bold(padNum(line)) + ': ');

        const lineContent = splitFile[line - 1];

        // TODO: support multi-line matches
        const matchingLocs = match.matchingLocs.filter(loc => loc.start.line === line);
        if (matchingLocs.length) {
          let printableCol = -1;
          let isInAnsiChar = false;
          let isInMatchingLoc = false;

          // If there's a match on the line, we have to iterate through character
          // by character to highlight the match
          for (let col = 0; col < lineContent.length; col++) {
            const char = lineContent[col];
            if (char === '\u001b') isInAnsiChar = true;
            if (!isInAnsiChar) printableCol += 1;
            if (isInAnsiChar && char === 'm') isInAnsiChar = false;

            process.stdout.write(char);

            if (!isInAnsiChar) {
              if (isInMatchingLoc && matchingLocs.some(loc => loc.end.column - 2 === printableCol)) {
                process.stdout.write(styles.bgColor.close);
                isInMatchingLoc = false;
              }

              if (!isInMatchingLoc && matchingLocs.some(loc => loc.start.column - 1 === printableCol + 1)) {
                process.stdout.write(styles.bgColor.ansi256(styles.hexToAnsi256('#333')));
                isInMatchingLoc = true;
              }
            }
          }

          process.stdout.write('\n');
        } else {
          process.stdout.write(lineContent + '\n');
        }
      }
    }
  }
}
