import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../HomeScreen';

describe('HomeScreen Location Tests', () => {
  test('renders map view', () => {
    const { getByTestId } = render(<HomeScreen />);
    expect(getByTestId('map-view')).toBeTruthy();
  });
}); 