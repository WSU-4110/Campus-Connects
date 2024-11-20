module.exports = {
    preset: 'react-native',
    transform: {
      '^.+\\.jsx?$': 'babel-jest',
    },
    moduleNameMapper: {
      '\\.(css|less|scss)$': 'identity-obj-proxy',
    },
    setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
    transformIgnorePatterns: [
      'node_modules/(?!@react-native|react-native|react-native-button|react-native-.*)',
    ],
  };