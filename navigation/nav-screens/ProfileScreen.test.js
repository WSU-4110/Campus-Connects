import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import ProfileScreen from './ProfileScreen';
import { auth, db } from '../../firebase';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  arrayRemove: jest.fn(),
  arrayUnion: jest.fn(),
}));

beforeAll(() => {
  global.alert = jest.fn(); 
});

// Mock firebase module
jest.mock('../../firebase', () => ({
  auth: {
    currentUser: { uid: '123', email: 'test@example.com' },
    signOut: jest.fn(),
  },
  db: {}
}));

const TestWrapper = () => (
  <NavigationContainer>
    <ProfileScreen />
  </NavigationContainer>
);

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. Test if ProfileScreen renders 
  it('renders ProfileScreen correctly', () => {
    render(<TestWrapper />);
    expect(screen.getByTestId('profile-image')).toBeTruthy();
    expect(screen.getByText('Sign out')).toBeTruthy();
  });

  // 2. Test if fetchUserData is called when the component mounts
  it('calls fetchUserData on mount', async () => {
    getDoc.mockResolvedValueOnce({ exists: true, data: jest.fn(() => ({ firstName: 'John', lastName: 'Doe' })) });

    render(<TestWrapper />);
    await waitFor(() => expect(getDoc).toHaveBeenCalled());
  });

  // 3. Test handleSignOut functionality
  it('calls signOut when the sign out button is pressed', async () => {
    render(<TestWrapper />);
    fireEvent.press(screen.getByTestId('sign-out-button'));
    await waitFor(() => expect(auth.signOut).toHaveBeenCalled());
  });

  // 4. Test if the profile image modal opens
  it('opens profile image modal when profile image is clicked', () => {
    render(<TestWrapper />);
    const profileImage = screen.getByTestId('profile-image');
    fireEvent.press(profileImage);
    expect(screen.getByText('Choose a Profile Picture')).toBeTruthy();
  });

  // 5. Test saving profile data after edit
  it('saves profile data when save button is clicked', async () => {
    const mockSetDoc = jest.fn();
    setDoc.mockImplementation(mockSetDoc);

    render(<TestWrapper />);
    fireEvent.press(screen.getByTestId('edit-profile-button'));

    const saveButton = screen.getByText('Save');
    fireEvent.press(saveButton);

    await waitFor(() => expect(mockSetDoc).toHaveBeenCalledTimes(1));
  });
  
  // 6. Test the sign-out button functionality
  it('signs out the user when the sign out button is pressed', async () => {
    render(<TestWrapper />);
    const signOutButton = screen.getByTestId('sign-out-button');
    fireEvent.press(signOutButton);
    await waitFor(() => expect(auth.signOut).toHaveBeenCalledTimes(1));
  });
});
