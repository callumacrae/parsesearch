# parsesearch

A command line tool for searching for things in a project that regex isn't
suited for—e.g., a Vue component that uses both `v-model` and `v-on:input`.

(if anyone is good at naming things please help)

## Usage

```
Usage: parsesearch [options]

Utility to search for code in a project using a parser, not regex

Options:
  -p, --parser <parser>   The parser to use (choices: "vue-sfc", default: "vue-sfc")
  -m, --match <match...>  The matches to search for
  -f, --files [files...]  The files to search
  -h, --help              display help for command
```

The following finds all Vue components using both `@input` and `v-model`:

```
$ npx parsesearch --match "@input" "v-model"
```

It does a bit of parsing, so `v-on:input` and `@input` are considered to be the
same. It's not very good at it yet though and I can't work out how to use the
actual Vue parser for this side of things.
