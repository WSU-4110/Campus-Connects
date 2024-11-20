import React from 'react';
import HomeScreen from '../HomeScreen';

describe('HomeScreen Search Management Tests', () => {
  let instance;

  beforeEach(() => {
    instance = new HomeScreen.prototype.constructor({});
    instance.handleSearch = instance.handleSearch.bind(instance);
    instance.fetchPlaces = instance.fetchPlaces.bind(instance);
    instance.fetchPlaceDetails = instance.fetchPlaceDetails.bind(instance);
    instance.setState = (newState, callback) => {
      instance.state = {
        ...instance.state,
        ...(typeof newState === 'function' ? newState(instance.state) : newState)
      };
      if (callback) callback();
    };
    instance.state = {
      searchQuery: 'test query',
      selectedPlace: null,
      modalVisible: false,
      autocompleteResults: [],
      activeFilter: null,
      region: {
        latitude: 42.357341,
        longitude: -83.069711,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    };
    global.fetch = jest.fn();
    global.Alert = { alert: jest.fn() };
  });

  test('handleSearch without placeId triggers fetchPlaces', async () => {
    const mockFetchPlaces = jest.spyOn(instance, 'fetchPlaces');
    mockFetchPlaces.mockImplementation(() => Promise.resolve());

    await instance.handleSearch();

    expect(mockFetchPlaces).toHaveBeenCalledWith('test query', null);
    expect(instance.state.autocompleteResults).toEqual([]);
  });
}); 