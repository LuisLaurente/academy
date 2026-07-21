export default {
  '*.{js,cjs,mjs,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{css,json,jsonc,md,yaml,yml}': ['prettier --write'],
};
