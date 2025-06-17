import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome } from '@expo/vector-icons'; // Utilisation des icônes Expo

// Importer les écrans
import HomeScreen from '../screens/HomeScreen';
import DishesScreen from '../screens/DishesScreen';
import FamilyScreen from '../screens/FamilyScreen';
import MealPlannerScreen from '../screens/MealPlannerScreen';
import InventoryScreen from '../screens/InventoryScreen';
import EmailSendScreen from '../screens/EmailSendScreen'; // Nouvel écran pour l'envoi d'emails

// --- Définition des couleurs camerounaises pour la navigation ---
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
              iconName = 'home'; // Icône "home"
            } else if (route.name === 'Plats') {
              iconName = 'cutlery'; // Icône "cutlery" (pour les plats)
            } else if (route.name === 'Famille') {
              iconName = 'users'; // Icône "users" (pour la famille)
            } else if (route.name === 'Planning') {
              iconName = 'calendar'; // Icône "calendar" (pour le planning)
            } else if (route.name === 'Courses') { // Ajouter l'icône pour le nouvel onglet
              iconName = 'shopping-cart'; // Icône "shopping-cart"
            } else if (route.name === 'Emails') { // Icône pour l'écran d'envoi d'emails
              iconName = 'envelope'; // Icône "envelope"
            }

            // Retourne le composant FontAwesome avec la taille et la couleur appropriées
            // Ajuster la taille si nécessaire pour une meilleure apparence
            const iconSize = focused ? size + 2 : size; // Légèrement plus grande si active
            return <FontAwesome name={iconName} size={iconSize} color={color} />;
          },
          // --- Adaptation des couleurs des icônes (logos) en fonction de l'état "focused" ---
          tabBarActiveTintColor: ACCENT_GREEN,     // Couleur de l'icône et du texte quand l'onglet est actif
          tabBarInactiveTintColor: TEXT_SECONDARY, // Couleur de l'icône et du texte quand l'onglet est inactif
          
          // Styles supplémentaires pour la barre d'onglets elle-même
          tabBarStyle: {
            backgroundColor: '#FFFFFF', // Fond blanc pour la barre d'onglets
            borderTopColor: '#E0E0E0',  // Bordure supérieure légère
            height: 75,            // Ajuster la hauteur si nécessaire
            paddingBottom: 5,           // Padding en bas
            paddingTop: 5,            // Padding en haut
          },
          tabBarLabelStyle: {
            fontSize: 11,               // Taille du texte des étiquettes d'onglet
            // marginTop: -5,              // Ajuster si besoin
          },
          headerShown: false // Masquer l'en-tête par défaut pour les onglets
        })}
      >
        {/* Les enfants directs doivent être uniquement des Tab.Screen, Tab.Group ou React.Fragment */}
        <Tab.Screen name="Accueil" component={HomeScreen} />
        <Tab.Screen name="Plats" component={DishesScreen} />
        <Tab.Screen name="Planning" component={MealPlannerScreen} />
        <Tab.Screen name="Courses" component={InventoryScreen} /> 
        <Tab.Screen name="Famille" component={FamilyScreen} />
        <Tab.Screen name="Emails" component={EmailSendScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;

