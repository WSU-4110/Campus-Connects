import React from 'react';
import HomeScreen from '../HomeScreen';

describe('HomeScreen Route Management Tests', () => {
  let instance;

  beforeEach(() => {
    instance = new HomeScreen.prototype.constructor({});
    instance.fetchDirections = instance.fetchDirections.bind(instance);
    instance.decodePolyline = instance.decodePolyline.bind(instance);
    instance.createRouteMarkers = instance.createRouteMarkers.bind(instance);
    instance.setState = jest.fn((state, callback) => {
      instance.state = { ...instance.state, ...state };
      if (callback) callback();
    });
    instance.state = {
      route: null,
      routeSteps: [],
      showDirections: false,
      routeMarkers: []
    };
    global.fetch = jest.fn();
    instance.mapRef = { current: { fitToCoordinates: jest.fn() } };
  });

  test('fetchDirections processes route data correctly', async () => {
    const mockDirections = {
      status: 'OK',
      routes: [{
        overview_polyline: { points: '_p~iF~ps|U_ulLnnqC_mqNvxq`@' },
        legs: [{
          steps: [
            {
              distance: { text: '0.1 mi' },
              html_instructions: 'Walk north',
              start_location: { lat: 42.357341, lng: -83.069711 },
              end_location: { lat: 42.358341, lng: -83.069711 }
            }
          ]
        }]
      }]
    };

    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockDirections)
      })
    );

    await instance.fetchDirections(42.357341, -83.069711, 42.358341, -83.069711);

    expect(instance.state.showDirections).toBe(true);
    expect(instance.state.routeSteps).toBeTruthy();
    expect(instance.state.routeMarkers).toBeTruthy();
  });
}); 