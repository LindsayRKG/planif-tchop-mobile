import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

// Importer le composant de planification
import MealPlanner from '../components/planning/MealPlanner';

function MealPlannerScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.headerContainer}>
          {/* Icône du calendrier avec la couleur accentuée */}
          <FontAwesome name="calendar" size={32} color={styles.ACCENT_RED} />
          <Text style={styles.title}>Planning des Repas</Text>
        </View>

        <View style={styles.contentSection}>
          <MealPlanner />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // --- Palette de Couleurs (identique aux autres écrans pour cohérence) ---
  ACCENT_GREEN: '#007A5E',       // Vert foncé, vif
  ACCENT_RED: '#CE1126',         // Rouge vif
  ACCENT_YELLOW: '#FCD116',      // Jaune vif

  BACKGROUND_PRIMARY: '#FFFFFF',    // Blanc pur pour les éléments principaux (cartes, etc.)
  // Nouvelle couleur de fond pour les écrans
  SCREEN_BACKGROUND: '#EEF7F4', // Le vert très clair de HomeScreen (et maintenant partout)

  BORDER_LIGHT: '#E0E0E0',        // Gris très clair pour les bordures légères
  BORDER_MEDIUM: '#C0C0C0',       // Gris clair pour les bordures moyennes

  TEXT_PRIMARY: '#333333',         // Gris très foncé pour le texte principal
  TEXT_SECONDARY: '#666666',      // Gris moyen pour le texte secondaire

  // --- Styles spécifiques à l'écran MealPlannerScreen (adaptés de FamilyScreen) ---
  safeArea: {
    flex: 1,
    backgroundColor: '#EEF7F4', // Applique le fond vert clair ici
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#EEF7F4', // Applique le fond vert clair ici aussi
    // padding: 20, // Retiré d'ici pour être mis dans contentContainerStyle
  },
  contentContainer: { // Ajout pour gérer le padding de la ScrollView
    padding: 20,
    paddingBottom: 40, // Ajoute un peu de marge en bas
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    paddingVertical: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginLeft: 15,
    color: '#333333', // TEXT_PRIMARY pour un titre sobre
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: 5,
    marginTop: 0,
  },
});

export default MealPlannerScreen;