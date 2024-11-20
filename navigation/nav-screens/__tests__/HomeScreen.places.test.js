import React from 'react';
import HomeScreen from '../HomeScreen';

describe('HomeScreen Place Management Tests', () => {
  let instance;

  beforeEach(() => {
    instance = new HomeScreen.prototype.constructor({});
    instance.fetchPlaces = instance.fetchPlaces.bind(instance);
    instance.isPointInPolygon = instance.isPointInPolygon.bind(instance);
    instance.setState = jest.fn((state, callback) => {
      instance.state = { ...instance.state, ...state };
      if (callback) callback();
    });
    instance.state = {
      region: {
        latitude: 42.357341,
        longitude: -83.069711,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      places: [],
      selectedPlace: null,
      modalVisible: false
    };
    global.fetch = jest.fn();
    global.Alert = { alert: jest.fn() };
  });

  test('fetchPlaces filters places within WSU boundaries', async () => {
    const mockPlaces = {
      status: 'OK',
      results: [
        {
          geometry: { location: { lat: 42.357341, lng: -83.069711 } }, // Inside boundaries
          name: 'Inside Place'
        },
        {
          geometry: { location: { lat: 42.380000, lng: -83.080000 } }, // Outside boundaries
          name: 'Outside Place'
        }
      ]
    };

    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockPlaces)
      })
    );

    await instance.fetchPlaces('test');

    expect(instance.state.places.length).toBe(1);
    expect(instance.state.places[0].name).toBe('Inside Place');
  });
}); 