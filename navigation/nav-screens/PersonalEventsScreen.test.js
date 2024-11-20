import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PersonalEventsScreen from './PersonalEventsScreen';
import { db, auth } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

// Mock Firebase and navigation
jest.mock('../../firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'mockUserId' } },
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
  })),
}));

describe('PersonalEventsScreen', () => {


    // Test 1: Test if public events are fetched correctly
it('fetches public events correctly', async () => {
    const mockEvents = [
      { id: '1', title: 'Public Event 1', location: 'Location 1', date: '2024-11-20', startTime: '10:00 AM', endTime: '12:00 PM', description: 'Description 1', isPublic: true },
      { id: '2', title: 'Private Event 1', location: 'Location 2', date: '2024-11-21', startTime: '2:00 PM', endTime: '4:00 PM', description: 'Description 2', isPublic: false },
    ];
  
    getDocs.mockResolvedValueOnce({
      docs: mockEvents.map(event => ({ id: event.id, data: () => event })),
    });
  
    const { getByText } = render(<PersonalEventsScreen />);
    
    // Ensure public event is fetched
    await waitFor(() => expect(getByText('Public Event 1')).toBeTruthy(), { timeout: 6000 });
  });



  // Test 2: Test if private events are fetched correctly
it('fetches private events correctly', async () => {
    const mockEvents = [
      { id: '1', title: 'Public Event 1', location: 'Location 1', date: '2024-11-20', startTime: '10:00 AM', endTime: '12:00 PM', description: 'Description 1', isPublic: true },
      { id: '2', title: 'Private Event 1', location: 'Location 2', date: '2024-11-21', startTime: '2:00 PM', endTime: '4:00 PM', description: 'Description 2', isPublic: false },
    ];
  
    getDocs.mockResolvedValueOnce({
      docs: mockEvents.map(event => ({ id: event.id, data: () => event })),
    });
  
    const { getByText } = render(<PersonalEventsScreen />);
    
    // Ensure private event is fetched
    await waitFor(() => expect(getByText('Private Event 1')).toBeTruthy(), { timeout: 6000 });
  });



  // Test 3: Test fetchEvents method
  it('fetches events correctly', async () => {
    const mockEvents = [
      { id: '1', title: 'Public Event 1', location: 'Location 1', date: '2024-11-20', startTime: '10:00 AM', endTime: '12:00 PM', description: 'Description 1', isPublic: true },
      { id: '2', title: 'Private Event 1', location: 'Location 2', date: '2024-11-21', startTime: '2:00 PM', endTime: '4:00 PM', description: 'Description 2', isPublic: false },
    ];

    getDocs.mockResolvedValueOnce({
      docs: mockEvents.map(event => ({ id: event.id, data: () => event })),
    });

    const { getByText } = render(<PersonalEventsScreen />);
    
    await waitFor(() => expect(getByText('Public Event 1')).toBeTruthy(), { timeout: 6000 });
    await waitFor(() => expect(getByText('Private Event 1')).toBeTruthy(), { timeout: 6000 });
  });



  // Test 4: Test useEffect hook (fetches events on mount)
  it('fetches events when component mounts', async () => {
    const mockEvents = [{ id: '1', title: 'Public Event 1', location: 'Location 1', date: '2024-11-20', startTime: '10:00 AM', endTime: '12:00 PM', description: 'Description 1', isPublic: true }];
    
    getDocs.mockResolvedValueOnce({
      docs: mockEvents.map(event => ({ id: event.id, data: () => event })),
    });

    const { getByText } = render(<PersonalEventsScreen />);
    
    await waitFor(() => expect(getByText('Public Event 1')).toBeTruthy(), { timeout: 6000 });
  });


  // Test 6: Test fetch error handling
  it('shows an error message when there is an error fetching events', async () => {
    getDocs.mockRejectedValueOnce(new Error('Error fetching events'));
    
    const { findByText } = render(<PersonalEventsScreen />);
    
    const errorMessage = await findByText(/Error fetching events/);
    expect(errorMessage).toBeTruthy();
  });



  it('navigates to CreateEvent screen when Create New Event is pressed', async () => {
    const mockNavigate = jest.fn();
    useNavigation.mockReturnValue({ navigate: mockNavigate });
  
    const { getByText } = render(<PersonalEventsScreen />);
  
    // Find the 'Create New Event' button
    const createEventButton = getByText('Create New Event');
    fireEvent.press(createEventButton);
  
    // Expect navigate to have been called with 'CreateEvent'
    expect(mockNavigate).toHaveBeenCalledWith('CreateEvent');
  });
});
