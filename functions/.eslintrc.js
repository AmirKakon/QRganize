module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2018, // Removed unnecessary quotes
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "linebreak-style": 0,
    "no-restricted-globals": ["error", "name", "length"], // Removed "max-len"
    "prefer-arrow-callback": "error",
    "quotes": ["error", "double", { allowTemplateLiterals: true }],
    "indent": ["error", 2, { SwitchCase: 1 }],
    "object-curly-spacing": ["error", "always"],
    "max-len": "off", // Explicitly disable line length restriction
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
