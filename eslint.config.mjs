// @ts-check
import prettier from 'eslint-plugin-prettier/recommended'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'sort-imports': 'off',
    'import/order': [
      'error',
      {
        groups: ['type', 'builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object'],
        'newlines-between': 'never',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true
        }
      }
    ],
    'no-unused-vars': 'error',
    'prettier/prettier': 'error',
    'vue/no-multiple-template-root': 'off',
    'vue/max-attributes-per-line': [
      'error',
      {
        singleline: 3
      }
    ]
  }
}).append(prettier)
