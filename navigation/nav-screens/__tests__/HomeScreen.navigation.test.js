import React from 'react';
import HomeScreen from '../HomeScreen';

describe('HomeScreen Navigation Management Tests', () => {
  let instance;

  beforeEach(() => {
    instance = new HomeScreen.prototype.constructor({});
    instance.handleNavigation = instance.handleNavigation.bind(instance);
    instance.fetchDirections = jest.fn();
    instance.setState = (newState, callback) => {
      instance.state = {
        ...instance.state,
        ...(typeof newState === 'function' ? newState(instance.state) : newState)
      };
      if (callback) callback();
    };
    instance.state = {
      location: null
    };
    global.Alert = { alert: jest.fn() };
  });

  test('handleNavigation with valid location calls fetchDirections', async () => {
    instance.setState({
      location: {
        coords: { latitude: 42.357341, longitude: -83.069711 }
      }
    });

    const destination = { latitude: 42.358341, longitude: -83.070711 };
    await instance.handleNavigation(destination);

    expect(instance.fetchDirections).toHaveBeenCalledWith(
      42.357341,
      -83.069711,
      42.358341,
      -83.070711
    );
  });
}); 