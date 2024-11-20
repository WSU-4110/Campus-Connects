import React from 'react';
import HomeScreen from '../HomeScreen';

describe('HomeScreen Filter Management Tests', () => {
  let instance;

  beforeEach(() => {
    instance = new HomeScreen.prototype.constructor({});
    instance.handleFilterPress = instance.handleFilterPress.bind(instance);
    instance.fetchPlaces = jest.fn();
    
    // Mock setState to update state synchronously
    instance.setState = (newState, callback) => {
      const state = typeof newState === 'function' ? newState(instance.state) : newState;
      instance.state = { ...instance.state, ...state };
      if (callback) {
        callback();
      }
    };

    instance.state = {
      activeFilter: null,
      searchQuery: ''
    };
  });

  test('handleFilterPress toggles filter correctly', () => {
    // Mock fetchPlaces to avoid actual API calls
    instance.fetchPlaces.mockImplementation(() => Promise.resolve());

    // First call - activating filter
    instance.handleFilterPress('restaurant');
    expect(instance.state.activeFilter).toBe('restaurant');
    expect(instance.fetchPlaces).toHaveBeenCalledWith('', null);

    // Reset mock to check second call
    instance.fetchPlaces.mockClear();

    // Second call - deactivating filter
    instance.handleFilterPress('restaurant');
    expect(instance.state.activeFilter).toBe(null);
    expect(instance.fetchPlaces).toHaveBeenCalledWith('', 'restaurant');
  });
}); 