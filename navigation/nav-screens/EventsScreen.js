import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';

const eventsData = [
  {
    id: '1',
    title: 'Green Warriors General Body Meeting',
    date: '2024-10-3',
    time: '6:15 PM - 8:00 PM',
    description: 'Overview and fun new updates on what to expect from PBS.',
    location: 'Student Center 301',
  },
  {
    id: '2',
    title: 'Oktoberfest',
    date: '2024-10-3',
    time: '11:00 AM - 3:00 PM',
    description: 'Enjoy a fun day of German-inspired eats and treats at the Towers Cafe.',
    location: 'Towers Cafe',
  },
  {
    id: '3',
    title: 'WSU All-Majors In-Person Career Fair',
    date: '2024-10-10',
    time: '12:00 PM - 5:00 PM',
    description: 'Meet employers and explore job opportunities.',
    location: '2nd Floor Student Center',
  },
  {
    id: '4',
    title: 'Grief and Loss Support Group',
    date: '2024-10-15',
    time: '4:00 PM - 5:00 PM',
    description: 'Offers support to students who are struggling with loss.',
    location: 'Online',
  },
  {
    id: '5',
    title: 'WSU AIGA Bake Sale',
    date: '2024-10-8',
    time: '12:00 PM - 3:00 PM',
    description: 'An autumn themed bake sake, all proceeds go to support club events.',
    location: 'Student Center',
  },
];

const groupEventsByDate = (events) => {
  return events.reduce((acc, event) => {
    (acc[event.date] = acc[event.date] || []).push(event);
    return acc;
  }, {});
};

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', options);
}

const EventsScreen = () => {
  const groupedEvents = groupEventsByDate(eventsData);
  const eventDates = Object.keys(groupedEvents);


  const renderEventItem = ({ item }) => (
    <TouchableOpacity style={styles.eventCard}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventDate}>{item.time}</Text>
      <Text style={styles.eventDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  const renderDateHeader = (date) => (
    <Text style={styles.dateHeader}>{formatDate(date)}</Text>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={eventDates}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <>
            {renderDateHeader(item)}
            <FlatList
              data={groupedEvents[item]}
              renderItem={renderEventItem}
              keyExtractor={(event) => event.id}
              style={styles.eventList}
            />
          </>
        )}
      />
    </View>
  );
};

export default EventsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 8,
    paddingRight: 8,
    backgroundColor: '#f3f4f3',
  },
  dateHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
    marginTop: 15,
    color: '#333',
  },
  eventList: {
    paddingBottom: 0,
  },
  eventCard: {
    backgroundColor: '#ffffff',
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventDate: {
    fontSize: 14,
    color: '#888',
    marginVertical: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#333',
  },
});
