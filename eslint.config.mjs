// @ts-check
import prettier from 'eslint-plugin-prettier/recommended'
import withNuxt from './.nuxt/eslint.config.mjs'
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default withNuxt({
    rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'sort-imports': 'off',
        'no-unused-vars': 'error',
        'vue/no-multiple-template-root': 'off',
        'import/order': [
            'error',
            {
                'newlines-between': 'never',
                groups: ['type', 'builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object'],
                alphabetize: {
                    order: 'asc',
                    caseInsensitive: true
                }
            }
        ],
        'prettier/prettier': [
            'error',
            {
                endOfLine: 'auto'
            }
        ],
        'vue/max-attributes-per-line': [
            'error',
            {
                singleline: 3
            }
        ]
    }
}).append(prettier);