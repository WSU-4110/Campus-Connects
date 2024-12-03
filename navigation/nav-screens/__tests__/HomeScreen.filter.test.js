import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../HomeScreen';

describe('HomeScreen Filter Tests', () => {
  test('renders filter buttons', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Restaurants')).toBeTruthy();
    expect(getByText('Academic')).toBeTruthy();
    expect(getByText('Parking')).toBeTruthy();
  });
}); 