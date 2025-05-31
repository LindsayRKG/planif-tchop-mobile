import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome } from '@expo/vector-icons'; // Utilisation des icônes Expo

// Importer les écrans
import HomeScreen from '../screens/HomeScreen';
import DishesScreen from '../screens/DishesScreen';
import FamilyScreen from '../screens/FamilyScreen';
import MealPlannerScreen from '../screens/MealPlannerScreen';

// --- Définition des couleurs camerounaises pour la navigation ---
// Ces constantes peuvent être regroupées dans un fichier de "constants/Colors.js"
// si vous voulez les réutiliser partout sans les redéfinir.
const ACCENT_GREEN = '#007A5E';       // Vert foncé, vif (pour l'icône active)
const TEXT_SECONDARY = '#666666';      // Gris moyen (pour l'icône inactive)

const Tab = createBottomTabNavigator();

function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            // Définition de l'icône basée sur le nom de la route
            if (route.name === 'Accueil') {
              iconName = focused ? 'home' : 'home'; // Icône "home"
            } else if (route.name === 'Plats') {
              iconName = focused ? 'cutlery' : 'cutlery'; // Icône "cutlery" (pour les plats)
            } else if (route.name === 'Famille') {
              iconName = focused ? 'users' : 'users'; // Icône "users" (pour la famille)
            } else if (route.name === 'Planning') {
              iconName = focused ? 'calendar' : 'calendar'; // Icône "calendar" (pour le planning)
            }

            // Retourne le composant FontAwesome avec la taille et la couleur appropriées
            return <FontAwesome name={iconName} size={size} color={color} />;
          },
          // --- Adaptation des couleurs des icônes (logos) en fonction de l'état "focused" ---
          tabBarActiveTintColor: ACCENT_GREEN,     // Couleur de l'icône et du texte quand l'onglet est actif
          tabBarInactiveTintColor: TEXT_SECONDARY, // Couleur de l'icône et du texte quand l'onglet est inactif
          
          // Styles supplémentaires pour la barre d'onglets elle-même (facultatif mais recommandé pour la cohérence)
          tabBarStyle: {
            backgroundColor: '#FFFFFF', // Fond blanc pour la barre d'onglets
            borderTopColor: '#E0E0E0',  // Bordure supérieure légère
            height: 80,                 // Hauteur de la barre d'onglets
            paddingBottom: 6,           // Padding en bas pour laisser de l'espace pour les icônes
          },
          tabBarLabelStyle: {
            fontSize: 12,               // Taille du texte des étiquettes d'onglet
            marginTop: -5,              // Remonte légèrement le texte pour le centrer
          },
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