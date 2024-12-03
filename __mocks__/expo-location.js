export const PermissionStatus = {
  GRANTED: 'granted',
  DENIED: 'denied'
};

export const Accuracy = {
  High: 'high'
};

export const requestForegroundPermissionsAsync = jest.fn(() => 
  Promise.resolve({ status: 'granted' })
);

export const getCurrentPositionAsync = jest.fn(() => 
  Promise.resolve({
    coords: {
      latitude: 42.357341,
      longitude: -83.069711,
      accuracy: 10
    }
  })
);

export const watchPositionAsync = jest.fn(() => 
  Promise.resolve({
    remove: jest.fn()
  })
); 