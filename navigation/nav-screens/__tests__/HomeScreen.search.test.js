import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../HomeScreen';

describe('HomeScreen Search Management Tests', () => {
  test('renders search bar with correct placeholder', () => {
    const { getByPlaceholderText } = render(<HomeScreen />);
    const searchBar = getByPlaceholderText('Search buildings or businesses...');
    expect(searchBar).toBeTruthy();
  });
}); 