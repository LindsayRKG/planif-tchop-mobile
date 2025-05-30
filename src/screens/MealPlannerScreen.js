import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

// Importer le composant de planification (inchangé ici)
import MealPlanner from '../components/planning/MealPlanner';

function MealPlannerScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
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
  BACKGROUND_SECONDARY: '#F8F8F8', // Gris très très clair, presque blanc (pour le fond général de la page)
  
  BORDER_LIGHT: '#E0E0E0',      // Gris très clair pour les bordures légères
  BORDER_MEDIUM: '#C0C0C0',     // Gris clair pour les bordures moyennes
  
  TEXT_PRIMARY: '#333333',       // Gris très foncé pour le texte principal
  TEXT_SECONDARY: '#666666',     // Gris moyen pour le texte secondaire
  
  // --- Styles spécifiques à l'écran MealPlannerScreen (adaptés de FamilyScreen) ---
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F8F8', // BACKGROUND_SECONDARY
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8F8F8', // BACKGROUND_SECONDARY
  },
  headerContainer: {
    flexDirection: 'row', // Aligner icône et texte sur la même ligne
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30, // Espace sous l'en-tête
    paddingVertical: 10,
  },
  title: {
    fontSize: 32, // Grande taille pour le titre, cohérent avec les autres écrans
    fontWeight: 'bold',
    marginLeft: 15, // Espace entre l'icône et le texte
    color: '#333333', // TEXT_PRIMARY pour un titre sobre
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: 5,
    marginTop: 0, // Pas besoin de marge supplémentaire ici si le marginBottom du header est suffisant
  },
});

export default MealPlannerScreen;