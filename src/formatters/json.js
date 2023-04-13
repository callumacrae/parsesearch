export default function formatJson(output) {
  const jsonOutput = [];

  for (const { file, matches } of output) {
    if (!matches.length) continue;

    jsonOutput.push({
      file,
      matches,
    });
  }

  process.stdout.write(JSON.stringify(jsonOutput, null, 2) + '\n');
}
