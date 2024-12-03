import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../HomeScreen';

describe('HomeScreen Place Management Tests', () => {
  test('renders map container', () => {
    const { getByTestId } = render(<HomeScreen />);
    expect(getByTestId('map-container')).toBeTruthy();
  });
}); 