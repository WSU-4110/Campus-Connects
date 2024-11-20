import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from './ProfileScreen'; 
import { auth, db } from '../../firebase'; 
import { getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

jest.mock('../../firebase', () => ({
  auth: {
    currentUser: { uid: 'user1', email: 'user1@gmail.com' },
    signOut: jest.fn(),
  },
  db: {
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    arrayUnion: jest.fn(),
    arrayRemove: jest.fn(),
  },
}));

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the profile information', async () => {
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        firstName: 'Annie',
        lastName: 'Smith',
        email: 'user1@gmail.com',
        dateOfBirth: '1999-01-01',
        year: 'Senior',
        major: 'Computer Science',
        clubs: 'Coding Club',
        profilePicture: 'testProfilePictureUrl',
      }),
    });

    const { getByText } = render(<ProfileScreen bookmarks={[]} />);

    await waitFor(() => {
      expect(getByText('Annie Smtih')).toBeTruthy();
      expect(getByText('Email: user1@gmail.com')).toBeTruthy();
      expect(getByText('Year: Senior')).toBeTruthy();
      expect(getByText('Major: Computer Science')).toBeTruthy();
    });
  });

  it('handles profile image change', async () => {
    const { getByTestId } = render(<ProfileScreen bookmarks={[]} />);

    const newImage = 'newProfileImageUrl';
    setDoc.mockResolvedValueOnce({});

    const profileImageButton = getByTestId('profile-image-button');
    fireEvent.press(profileImageButton);

    const newImageButton = getByTestId('profile-image-select-button'); 
    fireEvent.press(newImageButton);

    await waitFor(() => {
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(), 
        { profilePicture: newImage },
        { merge: true }
      );
      expect(getByTestId('profile-image').props.source.uri).toBe(newImage);
    });
  });

  it('handles sign out', async () => {
    const { getByText } = render(<ProfileScreen bookmarks={[]} />);

    const signOutButton = getByText('Sign out');
    fireEvent.press(signOutButton);

    await waitFor(() => {
      expect(auth.signOut).toHaveBeenCalled();
    });
  });

  it('fetches and displays personal event bookmarks', async () => {
    const bookmarksData = [
      { id: 'event1', title: 'Event 1', location: 'Location 1', date: '2024-12-01' },
      { id: 'event2', title: 'Event 2', location: 'Location 2', date: '2024-12-05' },
    ];

    getDocs.mockResolvedValueOnce({
      docs: bookmarksData.map((event) => ({
        id: event.id,
        data: () => event,
      })),
    });

    const { getByText, getByTestId } = render(<ProfileScreen bookmarks={[]} />);

    const bookmarksButton = getByText('Personal Event Bookmarks');
    fireEvent.press(bookmarksButton);
    await waitFor(() => {
      expect(getByText('Event 1')).toBeTruthy();
      expect(getByText('Event 2')).toBeTruthy();
    });
  });

  it('handles bookmark toggle correctly', async () => {
    const eventId = 'event1';
    const isBookmarked = true;
    const updateDocMock = jest.fn();
    updateDoc.mockImplementation(updateDocMock);

    const { getByTestId } = render(<ProfileScreen bookmarks={[]} />);
    const bookmarkButton = getByTestId('bookmark-button'); 
    fireEvent.press(bookmarkButton);

    await waitFor(() => {
      expect(updateDocMock).toHaveBeenCalledWith(
        expect.anything(),
        { bookmarks: expect.anything() } 
      );
    });
  });
});

