export default class JsonFormatter {
  constructor() {
    this.output = [];
  }

  result({ file, matches }) {
    this.output.push({ file, matches });
  }

  finish() {
    process.stdout.write(JSON.stringify(this.output, null, 2) + '\n');
  }
}
