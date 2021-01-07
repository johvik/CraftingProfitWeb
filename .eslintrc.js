module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    "airbnb-typescript/base",
    "prettier/@typescript-eslint",
    "plugin:prettier/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 12,
    project: "./tsconfig.json",
    createDefaultProgram: true,
  },
  plugins: ["@typescript-eslint", "prettier"],
  rules: {
    "@typescript-eslint/type-annotation-spacing": "error",
    "no-param-reassign": ["error", { props: false }],
  },
};
