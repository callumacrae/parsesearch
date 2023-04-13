import { compileTemplate } from '@vue/compiler-sfc';

// https://github.com/vuejs/core/blob/ae5a9323b7eaf3dfa11b2a442a02faa992f88225/packages/compiler-core/src/ast.ts#L28
const NodeTypes = {
  ELEMENT: 1,
  TEXT: 2,
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
  if (attr.includes(" ")) {
    const splitAttrs = attr.split(" ");
    const matchers = splitAttrs.map(splitAttr => shittyAttributeParser(splitAttr));
    return {
      test(node) {
        const locs = [];
        for (const matcher of matchers) {
          locs.push(...matcher.test(node));
        }
        return locs;
      },
    };
  }

  if (attr.startsWith('@')) {
    return shittyAttributeParser(`v-on:${attr.slice(1)}`);
  }
  if (attr.startsWith(':')) {
    return shittyAttributeParser(`v-bind:${attr.slice(1)}`);
  }

  if (attr.startsWith('<')) {
    const normalise = (str) => str.replace(/(?:^|-)([a-z])/g, (_, char) => char.toUpperCase());
    const componentName = normalise(attr.slice(1));
    return {
      test(node) {
        if (node.type === NodeTypes.ELEMENT && normalise(node.tag) === componentName) {
          return [node.loc];
        }
        return [false];
      },
    };
  }

  const shittyAst = {};

  if (attr.startsWith('v-')) {
    shittyAst.type = NodeTypes.DIRECTIVE;
    const [name, arg] = attr.slice(2).split(':');
    shittyAst.name = name;
    if (arg) {
      shittyAst.arg = { type: NodeTypes.SIMPLE_EXPRESSION, content: arg };
    }
  } else {
    // TODO: normalise attribute names
    const attributeMatch = /^([a-z-]+)(?:\s*=\s*(?:"([^"]+)"|'([^']+)'))?$/i.exec(attr);
    if (attributeMatch) {
      shittyAst.type = NodeTypes.ATTRIBUTE;
      shittyAst.name = attributeMatch[1];
      const value = attributeMatch[2] || attributeMatch[3];
      if (value) {
        shittyAst.value = { type: NodeTypes.TEXT, content: value };
      }

      const bindMatcher = shittyAttributeParser(`v-bind:${attr}`);

      return {
        test(node) {
          const boundMatch = bindMatcher.test(node);
          if (boundMatch[0]) {
            return boundMatch;
          }

          // TODO: doesn't work on HTML attributes
          for (const prop of node.props) {
            if (objIsMatch(prop, shittyAst)) {
              return [prop.loc];
            }
          }

          return [false];
        },
      };
    }
  }

  if (!shittyAst.type) {
    throw new Error('Unable to parse attribute');
  }

  return {
    test(node) {
      for (const prop of node.props) {
        if (objIsMatch(prop, shittyAst)) {
          return [prop.loc];
        }
      }

      return [false];
    },
  };
}

export default class VueParser {
  static defaultGlob = '**/*.vue';

  parse(code, context) {
    const { ast } = compileTemplate({ source: code, id: 'idk' });
    const matcher = shittyAttributeParser(context.matcher);
    return this.visitNode(ast, context, matcher);
  }

  visitNode(node, context, matcher) {
    const matches = [];

    if (node.type === NodeTypes.ELEMENT) {
      const matchingLocs = matcher.test(node);
      const allMatching = matchingLocs.every(loc => loc);

      if (allMatching) {
        const startLine = node.loc.start.line;
        const endLine = node.children?.length
          ? node.children[0].loc.start.line - 1
          : node.loc.end.line;
        matches.push({ startLine, endLine, loc: node.loc, matchingLocs });
      }
    }

    if (node.children) {
      for (const child of node.children) {
        const childMatches = this.visitNode(child, context, matcher);
        matches.push(...childMatches);
      }
    }

    return matches;
  }
}
