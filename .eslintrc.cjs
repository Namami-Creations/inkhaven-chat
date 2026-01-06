module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'next/core-web-vitals'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules', '.next'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-unused-vars': 'off',
    'no-undef': 'off',
    'react/no-unescaped-entities': 'off',
    '@next/next/no-html-link-for-pages': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    'import/no-anonymous-default-export': 'warn',
    'no-unreachable': 'warn'
  }
}
