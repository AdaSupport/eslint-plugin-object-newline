# eslint-plugin-object-newline

ESLint plugin to enforce newlines in ES6 object pattern.

There is only one rule in this plugin which will report when there are more than 4 values in a line by default, and if there are less it will report when the object pattern is not on a single line.

## Installation

You'll first need to install [ESLint](http://eslint.org):

```
$ npm i eslint --save-dev
```

Next, install `eslint-plugin-object-newline`:

```
$ npm install eslint-plugin-object-newline --save-dev
```

Or

```
$ yarn add eslint-plugin-object-newline -D
```

## Usage

Add `object-newline` to the plugins section of your `.eslintrc` configuration file.

```json
{
    "plugins": [
        "object-newline"
    ]
}
```

Then add the rule in the rules section.

```json
{
    "rules": {
        "object-newline/enforce": "error"
    }
}
```

### Options

The first and most readable way is to use an object which allows you to specify any of the available options, leaving everything that's not specified as the default.

  ```json
  {
      "rules": {
          "max-len": ["error", 100],
          "object-newline/enforce": [
              "error",
              {
                  "items": 2,
                  "max-len": 100
              }
          ]
      }
  }
  ```

Because of its easy expandability this is the only format that will allow you to configure any new options &ndash; should they be added &ndash; but there is also a shorter syntax that will let you configure just the first two and keep everything else default.

To specify `items` as **6**:

  ```json
  {
      "rules": {
          "object-newline/enforce": [
              "error",
              6
          ]
      }
  }
  ```

To specify `items` as **4** and `max-len` as **120**:

  ```json
  {
      "rules": {
          "max-len": ["error", 120],
          "object-newline/enforce": [
              "error",
              4,
              120
          ]
      }
  }
  ```

#### `items` [number] (default: `4`)

Specifies the maximum number of items before the plugin requires breaking up the `import` to multiple lines. If there are exactly this many or fewer items, then the plugin will make sure the import stays on one line unless it would violate the `max-len` option. More items than this number will always be split onto multiple lines.

Note that the plugin simply inserts newline characters after each token in the import when splitting, and the fix output never includes leading tabs or spaces. To have consistent indentation, be sure to use the built-in `indent` rule.

#### `max-len` [number] (default: `Infinity`)

Specifies the maximum length for source code lines in your project. This allows the plugin to prevent quick fixes that would cause your code to violate this limit from being applied. The rule will also automatically split import lines for you should they exceed the limit, which works great as an automatic fix for the ESLint built-in `max-len` rule (which doesn't have any quick fixes out of the box at the time of writing) for your imports. It's highly recommended you keep this option's value in sync with what you use for the aforementioned rule for best results.

### Testing

Tests can be run via `npm run test`, make sure these pass after every change. Be sure to add tests for new features.
