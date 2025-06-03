import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform } from 'react-native'; // Removed ScrollView
import { FontAwesome } from '@expo/vector-icons';
import MealPlanner from '../components/planning/MealPlanner'; // The component that likely contains the FlatList

function MealPlannerScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header remains outside the list component */}
      <View style={styles.headerContainer}>
        <FontAwesome name="calendar" size={32} color={styles.ACCENT_RED} />
        <Text style={styles.title}>Planning des Repas</Text>
      </View>

      {/* The MealPlanner component now takes the full remaining space and handles its own scrolling */}
      <View style={styles.contentSection}>
        <MealPlanner />
      </View>
    </SafeAreaView>
  );
}

// Styles adjusted to remove ScrollView specifics and ensure contentSection fills space
const styles = StyleSheet.create({
  // --- Palette de Couleurs ---
  ACCENT_GREEN: '#007A5E',
  ACCENT_RED: '#CE1126',
  ACCENT_YELLOW: '#FCD116',
  BACKGROUND_PRIMARY: '#FFFFFF',
  SCREEN_BACKGROUND: '#EEF7F4',
  BORDER_LIGHT: '#E0E0E0',
  BORDER_MEDIUM: '#C0C0C0',
  TEXT_PRIMARY: '#333333',
  TEXT_SECONDARY: '#666666',

  safeArea: {
    flex: 1,
    backgroundColor: '#EEF7F4',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  // container style removed
  // contentContainer style removed
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20, // Adjusted margin
    paddingVertical: 10,
    paddingHorizontal: 20, // Added horizontal padding
  },
  title: {
    fontSize: 28, // Slightly smaller
    fontWeight: 'bold',
    marginLeft: 15,
    color: '#333333',
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  contentSection: {
    flex: 1, // Make content take remaining space
    // paddingHorizontal: 5, // Removed, MealPlanner should handle its internal padding
    // marginTop: 0, // Removed
  },
});

export default MealPlannerScreen;
