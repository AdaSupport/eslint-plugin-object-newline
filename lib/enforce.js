const VALID_ITEM_TYPES = new Set([
  "Property",
  "ExperimentalRestProperty",
  "RestElement",
]);

const fixer = (context, nestTab, node, spacer = "\n") => (eslintFixer) => {
  const tab = spacer === "\n" ? `${nestTab}  ` : "";
  const source = context.getSourceCode();
  const type = node.typeAnnotation ? source.getText(node.typeAnnotation) : "";

  const { properties } = node;

  let leadingCommentUsed = false;

  const mapper = properties.map((p) => {
    const nextP = properties[properties.indexOf(p) + 1];
    const isRestProperty = p.type === "ExperimentalRestProperty" || p.type === "RestElement";
    const valText = isRestProperty ? source.getText(p) : source.getText(p.value);

    let value;

    if (isRestProperty) {
      value = valText;
    } else {
      value = valText === p.key.name ? "" : `: ${valText}`;
    }

    const pLeadingComments = source.getCommentsBefore(p);
    const pTrailingComments = source.getCommentsAfter(p);
    const nextPLeadingComments = nextP && source.getCommentsBefore(nextP)

    const leadingComments = (pLeadingComments || []).slice(leadingCommentUsed ? 1 : 0).map((c) => (
      c.type === "Line" ? `//${c.value}` : `/*${c.value}*/`
    )).join(`\n${tab}`);

    let trailingComments = (pTrailingComments || []).map((c) => ` //${c.value}`).join("\n");

    if (
      nextPLeadingComments
      && nextPLeadingComments[0]
      && nextPLeadingComments[0].loc.start.line === p.loc.start.line
    ) {
      trailingComments = ` //${nextPLeadingComments[0].value}`;
      leadingCommentUsed = true;
    } else {
      leadingCommentUsed = false;
    }

    const prefix = leadingComments ? `${tab}${leadingComments}\n${tab}` : `${tab}`;
    const postfix = `,${trailingComments}`;

    if (isRestProperty) {
      return `${prefix}${value}${trailingComments}`;
    }

    if (p.value.type === "AssignmentPattern") {
      if (p.value.left.name === p.key.name) {
        return `${prefix}${valText}${postfix}`;
      }

      return `${prefix}${p.key.name}: ${valText}${postfix}`;
    }

    return `${prefix}${p.key.name}${value}${postfix}`;
  });

  const newVal = `{${spacer}${mapper.join(`${spacer}`)}${spacer}${nestTab}}${type}`;

  return eslintFixer.replaceText(node, newVal);
};

const DEFAULT_ITEMS = 4;
const MIN_ITEMS = 0;
const DEFAULT_MAX_LENGTH = Infinity;
const MIN_MAX_LENGTH = 17;

module.exports = {
  includeComments: true,
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
      limitLineCount: "Each line can have maximum one element. (Expected to span {{expectedLineCount}} lines, saw {{lineCount}})",
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

        const startLine = node.loc.start.line;
        const endLine = node.loc.end.line;

        properties.forEach((p) => {
          if (!VALID_ITEM_TYPES.has(p.type)) {
            throw new Error(`Unknown property type: ${p.type}`);
          }
        });

        const source = context.getSourceCode();
        const { lines } = source;
        const nestTab = lines[startLine - 1].match(/^\s*/)[0];
        const blankLinesReported = false;
        let lineCount = 1 + (endLine - startLine);

        if (node.typeAnnotation) {
          lineCount = 1 + (node.typeAnnotation.loc.start.line - startLine);
        }

        // Ignore comments
        properties.forEach((p) => {
          const pLeadingComments = source.getCommentsBefore(p);
          const previousProperty = properties[properties.indexOf(p) - 1];
          (pLeadingComments || []).forEach((c) => {
            let commentLines = (c.loc.end.line - c.loc.start.line + 1);

            if (c.loc.start.line === startLine) {
              commentLines -= 1;
            }

            if (previousProperty && (c.loc.start.line === previousProperty.loc.end.line)) {
              commentLines -= 1;
            }

            lineCount -= commentLines;
          });
        });

        if (!blankLinesReported) {
          const singleLine = lineCount === 1;
          if (singleLine) {
            const line = lines[startLine - 1];
            if (line.length > maxLineLength) {
              context.report({
                node,
                messageId: "mustSplitLong",
                data: { maxLineLength, lineLength: line.length },
                fix: fixer(context, nestTab, node),
              });
              return;
            }
            if (properties.length > maxItems) {
              context.report({
                node,
                messageId: "mustSplitMany",
                data: { maxItems },
                fix: fixer(context, nestTab, node),
              });
            }
            return;
          }

          const expectedLineCount = properties.length + 2;

          if (lineCount !== expectedLineCount) {
            context.report({
              node,
              messageId: "limitLineCount",
              data: { expectedLineCount, lineCount },
              fix: fixer(context, nestTab, node),
            });
          }
        }
      },
    };
  },
};
