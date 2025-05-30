import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome } from '@expo/vector-icons'; // Utilisation des icônes Expo

// Importer les écrans (à créer)
import HomeScreen from '../screens/HomeScreen';
import DishesScreen from '../screens/DishesScreen';
import FamilyScreen from '../screens/FamilyScreen';
import MealPlannerScreen from '../screens/MealPlannerScreen';

const Tab = createBottomTabNavigator();

function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Accueil') {
              iconName = focused ? 'home' : 'home';
            } else if (route.name === 'Plats') {
              iconName = focused ? 'cutlery' : 'cutlery'; // FaUtensils -> cutlery
            } else if (route.name === 'Famille') {
              iconName = focused ? 'users' : 'users';
            } else if (route.name === 'Planning') {
              iconName = focused ? 'calendar' : 'calendar'; // FaCalendarAlt -> calendar
            }

            // Vous pouvez retourner n'importe quel composant ici !
            return <FontAwesome name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: 'tomato',
          tabBarInactiveTintColor: 'gray',
          headerShown: false // Masquer l'en-tête par défaut pour les onglets
        })}
      >
        <Tab.Screen name="Accueil" component={HomeScreen} />
        <Tab.Screen name="Plats" component={DishesScreen} />
        <Tab.Screen name="Famille" component={FamilyScreen} />
        <Tab.Screen name="Planning" component={MealPlannerScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;

