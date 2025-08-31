import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  {
    ignores: ['src/__mocks__/**/*', 'src/__mocks__/**']
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        // 브라우저 전역 변수들
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        performance: 'readonly',
        process: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        // DOM 타입들
        HTMLDivElement: 'readonly',
        HTMLImageElement: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        // 이벤트 타입들
        Event: 'readonly',
        TouchEvent: 'readonly',
        Touch: 'readonly',
        KeyboardEvent: 'readonly',
        // Node.js 타입들
        NodeJS: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': react,
      'react-hooks': reactHooks
    },
    rules: {
      // TypeScript 관련 규칙 강화
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }],
      '@typescript-eslint/no-explicit-any': 'error', // warn에서 error로 강화
      '@typescript-eslint/explicit-function-return-type': 'warn', // 함수 리턴 타입 명시
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'error', // warn에서 error로 강화
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/prefer-const': 'error',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/no-implicit-any-catch': 'error',

      // React 관련 규칙 강화
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/no-unknown-property': 'off', // Three.js props 허용
      'react/no-unescaped-entities': 'error', // warn에서 error로 강화
      'react/no-array-index-key': 'error', // warn에서 error로 강화
      'react/jsx-key': ['error', { checkFragmentShorthand: true }],
      'react/jsx-no-useless-fragment': 'error',
      'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
      'react/self-closing-comp': 'error',
      'react/jsx-boolean-value': ['error', 'never'],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error', // warn에서 error로 강화

      // 일반 규칙 강화
      'no-console': 'error', // warn에서 error로 강화 (프로덕션에서는 console 제거)
      'no-duplicate-imports': 'error',
      'no-undef': 'off', // TypeScript가 처리하므로 비활성화
      'no-unused-vars': 'off', // TypeScript 규칙 사용
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      'no-else-return': 'error',
      'consistent-return': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'brace-style': ['error', '1tbs'],
      'comma-dangle': ['error', 'always-multiline'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'always'],
      'indent': ['error', 2, { SwitchCase: 1 }],
      'max-len': ['error', { code: 100, ignoreUrls: true, ignoreStrings: true }],
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
      'eol-last': 'error',

      // 환경별 규칙 강화
      'no-alert': 'error', // warn에서 error로 강화
      'no-debugger': 'error'
    }
  }
];
