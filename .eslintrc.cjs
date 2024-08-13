/* eslint-env node */
module.exports = {
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:prettier/recommended"],
  parserOptions: {
    project: ["./tsconfig.json"]
  },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  root: true,
  rules: {
    "@typescript-eslint/no-var-requires": "off",
    "no-undef": "off",
    "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "prefer-const": "off",
    "@typescript-eslint/ban-types": "off",
    "no-empty": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-floating-promises": "off",
    "prettier/prettier": "off"
  }
};
