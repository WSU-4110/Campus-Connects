import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../HomeScreen';

describe('HomeScreen Route Tests', () => {
  test('renders map container', () => {
    const { getByTestId } = render(<HomeScreen />);
    expect(getByTestId('map-container')).toBeTruthy();
  });
}); 