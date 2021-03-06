module.exports = {
  extends: 'airbnb-base',
  rules: {
    'no-console': ['error', { allow: ['error', 'warn', 'dir'] }],
    'max-len': ['error', 180]
  },
  env: {
    node: true,
  },
};
