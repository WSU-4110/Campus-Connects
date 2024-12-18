import * as React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeScreen from './nav-screens/HomeScreen';
import ProfileScreen from './nav-screens/ProfileScreen';
import EventsScreenAlt from './nav-screens/EventsScreenAlt';
import { useNavigation } from '@react-navigation/native';

const Tab = createBottomTabNavigator();

export default function MainContainer() {
    const navigation = useNavigation();

    const goToEvents = () => {
        navigation.navigate('Events');
    };

    return (
        <Tab.Navigator
            initialRouteName="Map"
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Map') {
                        iconName = focused ? 'map' : 'map-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person-circle' : 'person-circle-outline';
                    } else if (route.name === 'Events') {
                        iconName = focused ? 'calendar' : 'calendar-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#0C5449',
                tabBarInactiveTintColor: 'grey',
                tabBarStyle: { display: 'flex' },
            })}
        >
            <Tab.Screen 
                name="Events" 
                component={EventsScreenAlt} 
                options={{ 
                    headerShown: false 
                }} 
            />
            <Tab.Screen 
                name="Map" 
                component={HomeScreen} 
                options={{ 
                    headerTitle: 'Campus Connects',
                    headerShown: false
                }} 
            />
            <Tab.Screen 
                name="Profile" 
                component={ProfileScreen} 
                options={{ 
                    headerShown: false
                }} 
            />
        </Tab.Navigator>
    );
}
