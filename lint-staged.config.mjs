export default {
  "web/**/*.{ts,tsx,js,jsx}": [
    "web/node_modules/.bin/eslint --fix --config web/eslint.config.mjs",
  ],
  "web/**/*.{css,scss}": [
    "web/node_modules/.bin/stylelint --fix --config web/.stylelintrc.json",
  ],
  "**/*.{ts,tsx,js,jsx,css,scss,json,md,yml,yaml}": [
    "web/node_modules/.bin/prettier --write",
  ],
};
