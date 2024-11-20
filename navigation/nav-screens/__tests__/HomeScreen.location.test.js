import React from 'react';
import { StyleSheet } from 'react-native';
import HomeScreen from '../HomeScreen';
import * as Location from 'expo-location';

jest.mock('expo-location');
jest.mock('react-native', () => ({
  StyleSheet: {
    create: jest.fn(styles => styles)
  },
  Alert: {
    alert: jest.fn()
  }
}));

describe('HomeScreen Location Management Tests', () => {
  let instance;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    instance = new HomeScreen.prototype.constructor({});
    instance.handleLocationPermission = instance.handleLocationPermission.bind(instance);
    
    // Mock setState
    instance.setState = (newState, callback) => {
      const state = typeof newState === 'function' ? newState(instance.state) : newState;
      instance.state = { ...instance.state, ...state };
      if (callback) callback();
    };

    instance.state = {
      location: null,
      errorMsg: null
    };
  });

  test('handleLocationPermission requests permissions correctly', async () => {
    // Mock successful permission and location
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    const mockLocation = {
      coords: {
        latitude: 42.357341,
        longitude: -83.069711,
        accuracy: 10
      }
    };
    Location.getCurrentPositionAsync.mockResolvedValue(mockLocation);
    Location.watchPositionAsync.mockImplementation(() => Promise.resolve({
      remove: jest.fn()
    }));

    await instance.handleLocationPermission();

    expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
    expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({
      accuracy: Location.Accuracy.High,
      maximumAge: 10000,
    });
    expect(instance.state.location).toEqual(mockLocation);
  });

  test('handleLocationPermission handles denied permissions', async () => {
    // Mock denied permission
    Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });

    await instance.handleLocationPermission();

    expect(instance.state.errorMsg).toBe('Permission to access location was denied');
  });
}); 