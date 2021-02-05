/* eslint-env mocha */
const { RuleTester } = require("eslint");
const rule = require("../lib/enforce.js");

const ruleTester = new RuleTester({
  parser: require.resolve("babel-eslint"),
  parserOptions: {
    ecmaVersion: 2015,
    sourceType: "module",
  },
});

const repeatString = (str, times) => [...new Array(times + 1)].join(str);

ruleTester.run("enforce", rule, {
  valid: [
    {
      code: "const { a, b, c, d } = test",
    },
    {
      code: "const { a: {b, c} } = test",
    },
    {
      code: "const { a, b, c, d } = test",
      options: [{
        items: 6,
      }],
    },
    {
      code: "const {\na,\nb,\nc\n} = test",
      options: [2],
    },
    {
      code: "const {\na,\nb,\nc\n} = test",
      options: [{
        items: 2,
      }],
    },
    {
      code: "const { a, b, c, d } = test",
      options: [4, 50],
    },
    {
      code: "const { a, b, c, d } = test",
      options: [{
        items: 4,
        "max-len": 50,
      }],
    },
    {
      code: `const { ${repeatString("a", 25)} } = test`,
      options: [1, 50],
    },
    {
      code: `const { ${repeatString("a", 25)} } = test`,
      options: [{
        items: 1,
        "max-len": 50,
      }],
    },
    {
      code: `const {\n${repeatString("a", 25)},\n${repeatString("b", 25)}\n} = test`,
      options: [6, 50],
    },
    {
      code: `const {\n${repeatString("a", 25)},\n${repeatString("b", 25)}\n} = test`,
      options: [{
        items: 6,
        "max-len": 50,
      }],
    },
    {
      code: "const { a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t } = test",
      options: [20, 83],
    },
    {
      code: "const { a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t } = test",
      options: [{
        items: 20,
        "max-len": 83,
      }],
    },
    {
      code: `const { ${repeatString("a", 512)} } = test`,
      options: [1],
    },
    {
      code: `const { ${repeatString("a", 512)} } = test`,
      options: [{
        items: 1,
      }],
    },
  ],

  invalid: [
    {
      code: "let { a, b, c, d } = test",
      output: "let {\n  a,\n  b,\n  c,\n  d,\n} = test",
      options: [1],
      errors: [{ messageId: "mustSplitMany" }],
    },
    {
      code: "const { a, b, c, d } = object;",
      output: "const {\n  a,\n  b,\n  c,\n  d,\n} = object;",
      options: [{
        items: 1,
      }],
      errors: [{ messageId: "mustSplitMany" }],
    },
    {
      code: "const {\n\na,\nb\n\n\n} = test",
      output: "const {\n  a,\n  b,\n} = test",
      options: [1],
      errors: [{ messageId: "limitLineCount" }],
    },
    {
      code: "const {\na, b, c\n} = test",
      output: "const {\n  a,\n  b,\n  c,\n} = test",
      options: [1],
      errors: [{ messageId: "limitLineCount" }],
    },
    {
      code: "const { getPublicStaticVoidFinalObjectClassExtensionFactory } = test",
      output: "const {\n  getPublicStaticVoidFinalObjectClassExtensionFactory,\n} = test",
      options: [4, 50],
      errors: [{ messageId: "mustSplitLong" }],
    },
    {
      code: "const { aaaaaaaaaa, bbbbbbbbbb, cccccccccc, dddddddddd } = test",
      output: "const {\n  aaaaaaaaaa,\n  bbbbbbbbbb,\n  cccccccccc,\n  dddddddddd,\n} = test",
      options: [4, 50],
      errors: [{ messageId: "mustSplitLong" }],
    },
    {
      code: "const { aaaaaaaaaaa, aaaaaaaaaaaaaaaaaaa, aaaaaaaaaaaaa } = aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa;",
      output: "const {\n  aaaaaaaaaaa,\n  aaaaaaaaaaaaaaaaaaa,\n  aaaaaaaaaaaaa,\n} = aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa;",
      options: [{
        items: 4,
        "max-len": 140,
      }],
      errors: [{ messageId: "mustSplitLong" }],
    },
    {
      code: "const { aaaaaaaaaaa: b, aaaaaaaaaaaaaaaaaaa, aaaaaaaaaaaaa } = aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa;",
      output: "const {\n  aaaaaaaaaaa: b,\n  aaaaaaaaaaaaaaaaaaa,\n  aaaaaaaaaaaaa,\n} = aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa;",
      options: [{
        items: 4,
        "max-len": 140,
      }],
      errors: [{ messageId: "mustSplitLong" }],
    },
    {
      code: "const { a: {b, c}, d: f, e, g, h } = test;",
      output: "const {\n  a: {b, c},\n  d: f,\n  e,\n  g,\n  h,\n} = test;",
      options: [{
        items: 4,
        "max-len": 140,
      }],
      errors: [{ messageId: "mustSplitMany" }],
    },
    {
      code: "const { a: {}, d: f, e, g, h } = test;",
      output: "const {\n  a: {},\n  d: f,\n  e,\n  g,\n  h,\n} = test;",
      options: [{
        items: 4,
        "max-len": 140,
      }],
      errors: [{ messageId: "mustSplitMany" }],
    },
    {
      code: "const { a: {}, d: f, e, g, h }: Type = test;",
      output: "const {\n  a: {},\n  d: f,\n  e,\n  g,\n  h,\n}: Type = test;",
      options: [{
        items: 4,
        "max-len": 140,
      }],
      errors: [{ messageId: "mustSplitMany" }],
    },
    {
      code: "const a = ({a, b = 1, c, d, e}: P) => null;",
      output: "const a = ({\n  a,\n  b = 1,\n  c,\n  d,\n  e,\n}: P) => null;",
      options: [{
        items: 4,
      }],
      errors: [{ messageId: "mustSplitMany" }],
    },
    {
      code: "const a = ({a, b: alias = 1, c, d, e}: P) => null;",
      output: "const a = ({\n  a,\n  b: alias = 1,\n  c,\n  d,\n  e,\n}: P) => null;",
      options: [{
        items: 4,
      }],
      errors: [{ messageId: "mustSplitMany" }],
    },
    {
      code: `
const f = () => {
  return ({ a, b,
    c,
  }: {
    a: number;
    b: boolean;
    c: number;
  }) => null
}`,
      output: (`
const f = () => {
  return ({
    a,
    b,
    c,
  }: {
    a: number;
    b: boolean;
    c: number;
  }) => null
}`
      ),
      options: [{
        items: 2,
      }],
      errors: [{ messageId: "limitLineCount" }],
    },
    {
      code: "const {g: {veryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryLongProperty}} = props",
      output: "const {\n  g: {veryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryLongProperty},\n} = props",
      options: [{
        items: 4,
        "max-len": 100,
      }],
      errors: [{ messageId: "mustSplitLong" }, { messageId: "mustSplitLong" }],
    },
    {
      code: `
const f = () => {
  const {
  // Zzz1
  z: D, // Zzz2
  // Zzz3
  // Zzz4
  x: Y, // Yooo
    // Hello
  a, b, // Hi
  // Ccc
  c: { x, y, z }, ...xx
  } = test;
}
`,
      output: `
const f = () => {
  const {
    // Zzz1
    z: D, // Zzz2
    // Zzz3
    // Zzz4
    x: Y, // Yooo
    // Hello
    a,
    b, // Hi
    // Ccc
    c: { x, y, z },
    ...xx
  } = test;
}
`,
      options: [{
        items: 4,
        "max-len": 100,
      }],
      errors: [{ messageId: "limitLineCount" }],
    },
  ],
});
