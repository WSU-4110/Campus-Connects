// Mock react-native
jest.mock('react-native', () => ({
  Platform: {
    select: jest.fn(),
  },
  StyleSheet: {
    create: jest.fn(),
  },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  TextInput: 'TextInput',
  Modal: 'Modal',
  FlatList: 'FlatList',
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
  },
  Animated: {
    Value: jest.fn(),
    timing: jest.fn(),
    NativeModules: {
      NativeAnimatedHelper: {
        addListener: jest.fn(),
        removeListeners: jest.fn(),
      },
    },
  },
  NativeModules: {
    NativeAnimatedHelper: {
      addListener: jest.fn(),
      removeListeners: jest.fn(),
    },
  },
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
  Accuracy: {
    High: 'high'
  }
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: jest.fn(),
    Marker: jest.fn(),
    Polygon: jest.fn(),
    Polyline: jest.fn(),
    PROVIDER_GOOGLE: 'google',
  };
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => ({
  PanGestureHandler: 'PanGestureHandler',
}));

// Mock Alert
global.Alert = {
  alert: jest.fn()
};

// Mock fetch
global.fetch = jest.fn(() => 
  Promise.resolve({
    json: () => Promise.resolve({})
  })
);

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

// Mock React's createRef
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  createRef: () => ({
    current: {
      fitToCoordinates: jest.fn()
    }
  })
}));

// Mock console.error to avoid noise in tests
console.error = jest.fn(); 