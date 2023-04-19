export default class QuickfixFormatter {
  result({ file, content, matches }) {
    if (!matches.length) return;

    const splitContent = content.split('\n');

    for (const match of matches) {
      const loc = match.loc.start;
      const lineContent = splitContent[loc.line - 1];
      process.stdout.write(`${file}:${loc.line}:${loc.column}: ${lineContent.trim()}\n`);
    }
  }
}
