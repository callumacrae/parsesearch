import { compileTemplate } from '@vue/compiler-sfc';

// https://github.com/vuejs/core/blob/ae5a9323b7eaf3dfa11b2a442a02faa992f88225/packages/compiler-core/src/ast.ts#L28
const NodeTypes = {
  ELEMENT: 1,
  SIMPLE_EXPRESSION: 4,
  ATTRIBUTE: 6,
  DIRECTIVE: 7,
};

function objIsMatch(object, source) {
  return Object.keys(source).every(key => {
    if (typeof object[key] === 'object') {
      if (typeof source[key] !== 'object') {
        return false;
      }
      return objIsMatch(object[key], source[key]);
    }
    return object[key] === source[key];
  });
}

// TODO: can this use vue's parseAttribute?
// https://github.com/vuejs/core/blob/ae5a9323b7eaf3dfa11b2a442a02faa992f88225/packages/compiler-core/src/parse.ts#L755
function shittyAttributeParser(attr) {
  if (attr.startsWith('@')) {
    return shittyAttributeParser(`v-on:${attr.slice(1)}`);
  }
  if (attr.startsWith(':')) {
    return shittyAttributeParser(`v-bind:${attr.slice(1)}`);
  }

  const prop = {};

  if (attr.startsWith('v-')) {
    prop.type = NodeTypes.DIRECTIVE;
    const [name, arg] = attr.slice(2).split(':');
    prop.name = name;
    if (arg) {
      prop.arg = { type: NodeTypes.SIMPLE_EXPRESSION, content: arg };
    }

    return prop;
  }

  throw new Error('Unable to parse attribute');
}

export default class VueParser {
  static defaultGlob = '**/*.vue';

  parse(code, context) {
    const { ast } = compileTemplate({ source: code, id: 'idk' });
    return this.visitNode(ast, context);
  }

  visitNode(node, context) {
    const matches = [];

    if (node.type === NodeTypes.ELEMENT) {
      const allMatching = context.matches.every((matcher) => {
        const shittyAst = shittyAttributeParser(matcher);
        return node.props.some(prop => objIsMatch(prop, shittyAst));
      });

      if (allMatching) {
        const startLine = node.loc.start.line;
        const endLine = node.children?.length ? node.children[0].loc.start.line - 1 : node.loc.end.line;
        matches.push({ startLine, endLine });
      }
    }

    if (node.children) {
      for (const child of node.children) {
        const childMatches = this.visitNode(child, context);
        matches.push(...childMatches);
      }
    }

    return matches;
  }
}
