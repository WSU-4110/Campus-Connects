import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import SignUpScreen from './screens/SignUpScreen'; 
import OnboardScreen from './screens/OnboardScreen'; 
import MainContainer from './navigation/MainContainer'; 
import EventsScreen from './navigation/nav-screens/EventsScreen';
import PersonalEventsScreen from './navigation/nav-screens/PersonalEventsScreen';
import CreateEventScreen from './navigation/nav-screens/CreateEventScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          options={{ headerShown: false }}
          name="Welcome"
          component={WelcomeScreen}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Login"
          component={LoginScreen}
        />
        <Stack.Screen 
          name="Home" 
          component={MainContainer} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="SignUp"
          component={SignUpScreen}
        />
          <Stack.Screen
          options={{ headerShown: false }} 
          name="Onboard" 
          component={OnboardScreen}
        />
        <Stack.Screen name="Events" component={EventsScreen} />
        <Stack.Screen name="PersonalEvents" component={PersonalEventsScreen} />
        <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
