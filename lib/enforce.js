const fixer = (context, node, spacer = "\n") => (eslintFixer) => {
  const tab = spacer === "\n" ? "  " : "";
  const source = context.getSourceCode();
  const type = node.typeAnnotation ? source.getText(node.typeAnnotation) : "";

  const mapper = node.properties.map((p) => {
    const valText = source.getText(p.value);
    const value = valText === p.key.name ? "" : `: ${valText}`;

    if (p.value.type === "AssignmentPattern") {
      return `${tab}${valText}`;
    }

    return `${tab}${p.key.name}${value}`;
  });

  const newVal = `{${spacer}${mapper.join(`,${spacer}`)}${tab ? "," : ""}${spacer}}${type}`;

  return eslintFixer.replaceText(node, newVal);
};

const DEFAULT_ITEMS = 4;
const MIN_ITEMS = 0;
const DEFAULT_MAX_LENGTH = Infinity;
const MIN_MAX_LENGTH = 17;

module.exports = {
  meta: {
    type: "layout",
    docs: {
      description: "enforce multiple lines for object pattern statements past a certain number of items",
      category: "Stylistic Issues",
      url: "AdaSupport/eslint-plugin-object-pattern-newline",
    },
    fixable: "whitespace",
    schema: {
      oneOf: [
        {
          type: "array",
          minItems: 1,
          maxItems: 1,
          items: {
            type: "object",
            properties: {
              items: {
                type: "number",
                minimum: 1,
              },
              "max-len": {
                type: "number",
                minimum: 17,
              },
            },
          },
        },
        {
          type: "array",
          minItems: 0,
          maxItems: 2,
          items: {
            type: "number",
          },
        },
      ],
    },
    messages: {
      mustSplitMany: "Items must be broken into multiple lines if there are more than {{maxItems}} elements.",
      mustSplitLong: "Items must be broken into multiple lines if the line length exceeds {{maxLineLength}} characters, saw {{lineLength}}.",
      mustNotSplit: "Items must not be broken into multiple lines if there are {{maxItems}} or less elements.",
      noBlankBetween: "Cannot have more than one blank line",
      limitLineCount: "Each line can have maximum one element. (Expected import to span {{expectedLineCount}} lines, saw {{importLineCount}})",
    },
  },
  create(context) {
    let maxItems;
    let maxLineLength;
    if (typeof context.options[0] === "object") {
      const optionsObj = context.options[0];
      maxItems = typeof optionsObj.items !== "undefined" ? optionsObj.items : DEFAULT_ITEMS;
      maxLineLength = typeof optionsObj["max-len"] !== "undefined" ? optionsObj["max-len"] : DEFAULT_MAX_LENGTH;
    } else {
      [
        maxItems = DEFAULT_ITEMS,
        maxLineLength = DEFAULT_MAX_LENGTH,
      ] = context.options;
    }
    if (maxItems < MIN_ITEMS) {
      throw new Error(`Minimum items must not be less than ${MIN_MAX_LENGTH}`);
    }
    if (maxLineLength < MIN_MAX_LENGTH) {
      throw new Error(`Maximum line length must not be less than ${MIN_MAX_LENGTH}`);
    }
    return {
      ObjectPattern(node) {
        const { properties } = node;

        if (!properties.length) {
          return;
        }

        const { lines } = context.getSourceCode();
        let blankLinesReported = false;
        const importLineCount = 1 + (node.loc.end.line - node.loc.start.line);
        const importedItems = properties.reduce((a, c) => a + (c.type === "Property" ? 1 : 0), 0);

        properties.slice(1).forEach((currentItem, index) => {
          const previousItem = properties[index];
          const previousEndLine = previousItem.loc.end.line;
          const currentStartLine = currentItem.loc.start.line;
          const lineDifference = currentStartLine - previousEndLine;
          if (!blankLinesReported && lineDifference > 1) {
            context.report({
              node,
              messageId: "noBlankBetween",
              fix: fixer(context, node),
            });
            blankLinesReported = true;
          }
        });

        if (!blankLinesReported) {
          const singleLine = importLineCount === 1;
          if (singleLine) {
            const line = lines[node.loc.start.line - 1];
            if (line.length > maxLineLength) {
              context.report({
                node,
                messageId: "mustSplitLong",
                data: { maxLineLength, lineLength: line.length },
                fix: fixer(context, node),
              });
              return;
            }
            if (importedItems > maxItems) {
              context.report({
                node,
                messageId: "mustSplitMany",
                data: { maxItems },
                fix: fixer(context, node),
              });
            }
            return;
          }

          // One item per line + line with import + line with from
          const expectedLineCount = importedItems + 2;
          if (importLineCount !== expectedLineCount) {
            context.report({
              node,
              messageId: "limitLineCount",
              data: { expectedLineCount, importLineCount },
              fix: fixer(context, node),
            });
            return;
          }

          if (importedItems <= maxItems) {
            let fixedValue;
            const fix = fixer(context, node, " ");
            fix({
              replaceText: (_node, value) => {
                fixedValue = value;
              },
            });
            // Only enforce this rule if fixing it would not cause going over the line length limit
            if (fixedValue.length <= maxLineLength) {
              context.report({
                node,
                messageId: "mustNotSplit",
                data: { maxItems },
                fix,
              });
            }
          }
        }
      },
    };
  },
};
