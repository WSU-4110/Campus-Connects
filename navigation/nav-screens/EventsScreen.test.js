import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EventsScreen from './EventsScreen';
import { useNavigation } from '@react-navigation/native';
import { stripHtmlTags } from './EventsScreen'; 

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

// Mock API response
const mockEvents = [
  {
    id: 1,
    name: 'Test Event 1',
    location: 'Test Location 1',
    startsOn: new Date().toISOString(),
    endsOn: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    description: '<p>Test description 1</p>',
  },
  {
    id: 2,
    name: 'Test Event 2',
    location: 'Test Location 2',
    startsOn: new Date().toISOString(),
    endsOn: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    description: '<p>Test description 2</p>',
  },
];

describe('EventsScreen', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    useNavigation.mockReturnValue({
      navigate: mockNavigate,
    });
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ value: mockEvents }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should render the loading indicator initially', () => {
    const { getByText } = render(<EventsScreen />);
    expect(getByText('Loading events...')).toBeTruthy();
  });

  test('should render events after fetching', async () => {
    const { getByText, queryByText } = render(<EventsScreen />);
    
    await waitFor(() => {
      expect(queryByText('Loading events...')).toBeNull(); 
    });

    expect(getByText('Test Event 1')).toBeTruthy();
    expect(getByText('Location: Test Location 1')).toBeTruthy();
    expect(getByText('Test Event 2')).toBeTruthy();
    expect(getByText('Location: Test Location 2')).toBeTruthy();
  });

  test('should render no events message if no events are fetched', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ value: [] }),
    });

    const { getByText } = render(<EventsScreen />);
    
    await waitFor(() => {
      expect(getByText('No events found.')).toBeTruthy();
    });
  });

  test('should navigate to My Events screen when "My Events" link is pressed', async () => {
    const { getByText } = render(<EventsScreen />);

    await waitFor(() => {
      const myEventsLink = getByText('My Events');
      fireEvent.press(myEventsLink);
      expect(mockNavigate).toHaveBeenCalledWith('PersonalEvents');
    });
  });
});

describe('stripHtmlTags', () => {
  test('should strip HTML tags and return plain text', () => {
    const htmlString = '<p>This is a <strong>test</strong> description.</p>';
    const result = stripHtmlTags(htmlString);
    expect(result).toBe('This is a test description.');
  });

  test('should handle empty strings', () => {
    const htmlString = '';
    const result = stripHtmlTags(htmlString);
    expect(result).toBe('');
  });

  test('should handle strings without HTML tags', () => {
    const plainText = 'This is plain text.';
    const result = stripHtmlTags(plainText);
    expect(result).toBe('This is plain text.');
  });
});