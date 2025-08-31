const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/test-results/',
    '<rootDir>/playwright-report/',
    '<rootDir>/tests/',
    '<rootDir>/tests/performance/',
    '<rootDir>/tests/__screenshots__/'
  ],
  testMatch: [
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}'
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/index.{js,jsx,ts,tsx}',
    '!src/**/types.{js,jsx,ts,tsx}',
    '!src/utils/modelLoader.ts',
    '!src/components/DraggableFurniture.tsx',
    'src/components/Real3DRoom.tsx',
    '!src/components/EditableFurniture.tsx',
    '!src/components/FurnitureModel.tsx',
    '!src/components/Room.tsx',
    '!src/components/RoomEditor.tsx',
    '!src/components/RoomFurniture.tsx',
    '!src/components/EnhancedDragDrop.tsx',
    '!src/components/GridSystem.tsx',
    '!src/components/LODSystem.tsx',
    '!src/components/PerformanceMonitor.tsx',
    '!src/utils/modelCache.ts',
    '!src/utils/performanceMonitor.ts',
    '!src/hooks/usePerformanceOptimization.ts',
    '!src/hooks/useKeyboardShortcuts.ts',
    '!src/components/Avatar.tsx',
    '!src/components/BottomCategoryTabs.tsx',
    '!src/components/CardNav.tsx',
    '!src/components/EditModeTransition.tsx',
    '!src/components/EditToolbar.tsx',
    '!src/components/EditableRoomFurniture.tsx',
    '!src/components/EditorTest.tsx',
    '!src/components/ErrorModal.tsx',
    '!src/components/FurnitureCatalog.tsx',
    '!src/components/FurnitureLibrary.tsx',
    '!src/components/GridSnapGuide.tsx',
    '!src/components/MegaMenu.tsx',
    '!src/components/MobileTouchHandler.tsx',
    '!src/components/RoomTemplateSelector.tsx',
    '!src/components/RotationSnapGuide.tsx',
    '!src/components/SettingsModal.tsx',
    '!src/components/ThemeSelector.tsx',
    '!src/components/UndoRedoHistory.tsx',
    '!src/app/**/*',
    '!src/data/**/*',
    '!src/constants/**/*',
    '!src/store/**/*',
    '!src/components/KeyboardShortcuts.tsx',
    '!src/utils/storageManager.ts',
    '!src/utils/storeOptimizer.ts'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/\\.next/',
    '/coverage/',
    '/test-results/',
    '/playwright-report/',
    '/tests/',
    '/tests/__screenshots__/'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  testTimeout: 10000,
  verbose: true,
  transformIgnorePatterns: [
    '/node_modules/(?!(three|@react-three|three-stdlib)/)'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js'
  ],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^three$': '<rootDir>/src/__mocks__/three.js',
    '^@react-three/fiber$': '<rootDir>/src/__mocks__/@react-three/fiber.js',
    '^@react-three/drei$': '<rootDir>/src/__mocks__/@react-three/drei.js',
    '^three/examples/jsm/loaders/GLTFLoader.js$': '<rootDir>/src/__mocks__/gltfLoader.js',
    '^three/examples/jsm/loaders/DRACOLoader.js$': '<rootDir>/src/__mocks__/dracoloader.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/__mocks__/fileMock.js'
  }
}

module.exports = createJestConfig(customJestConfig)
