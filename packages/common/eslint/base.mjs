/**
 * Shared ESLint flat-config entries, spread into each app's eslint.config.mjs.
 */
const base = [
  {
    rules: {
      "no-var": "error",
      "prefer-const": "error",
      "object-shorthand": ["warn", "always"],
    },
  },
];

export default base;
