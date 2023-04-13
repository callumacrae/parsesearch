export default function formatQuickfix(output) {
  for (const { file, content, matches } of output) {
    if (!matches.length) continue;

    const splitContent = content.split('\n');

    for (const match of matches) {
      const loc = match.loc.start;
      const lineContent = splitContent[loc.line - 1];
      process.stdout.write(`${file}:${loc.line}:${loc.column}: ${lineContent.trim()}\n`);
    }
  }
}
