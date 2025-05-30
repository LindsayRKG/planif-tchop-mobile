import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

// Importer les composants (inchangés ici, mais ils devront être stylisés avec cette même palette)
import AddDishForm from '../components/dishes/AddDishForm';
import DishesList from '../components/dishes/DishesList'; // Chemin d'importation inchangé par rapport à votre code fourni

function DishesScreen() {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Conteneur d'en-tête pour le titre */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Gestion des Plats</Text>
        </View>

        {/* Groupe de boutons stylisé comme une carte */}
        <View style={styles.buttonGroupContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              showAddForm ? styles.activeButton : styles.secondaryButton,
            ]}
            onPress={() => setShowAddForm(true)}
          >
            <FontAwesome
              name="plus"
              size={16} // Taille de l'icône réduite
              color={showAddForm ? '#fff' : styles.ACCENT_GREEN}
              style={styles.buttonIcon}
            />
            <Text style={[styles.buttonText, showAddForm ? styles.activeButtonText : styles.secondaryButtonText]}>Ajouter un Plat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              !showAddForm ? styles.activeButton : styles.secondaryButton,
            ]}
            onPress={() => setShowAddForm(false)}
          >
            <FontAwesome
              name="list-alt"
              size={16} // Taille de l'icône réduite
              color={!showAddForm ? '#fff' : styles.ACCENT_GREEN}
              style={styles.buttonIcon}
            />
            <Text style={[styles.buttonText, !showAddForm ? styles.activeButtonText : styles.secondaryButtonText]}>Voir les Plats</Text>
          </TouchableOpacity>
        </View>

        {/* Section de contenu */}
        <View style={styles.contentSection}>
          {showAddForm ? (
            <AddDishForm />
          ) : (
            <DishesList />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // --- Palette de Couleurs (identique à FamilyScreen pour cohérence) ---
  ACCENT_GREEN: '#007A5E',       // Vert foncé, vif
  ACCENT_RED: '#CE1126',         // Rouge vif
  ACCENT_YELLOW: '#FCD116',      // Jaune vif
  
  BACKGROUND_PRIMARY: '#FFFFFF',    // Blanc pur pour les éléments principaux (cartes, etc.)
  BACKGROUND_SECONDARY: '#F8F8F8', // Gris très très clair, presque blanc (pour le fond général de la page)
  
  BORDER_LIGHT: '#E0E0E0',      // Gris très clair pour les bordures légères
  BORDER_MEDIUM: '#C0C0C0',     // Gris clair pour les bordures moyennes
  
  TEXT_PRIMARY: '#333333',       // Gris très foncé pour le texte principal
  TEXT_SECONDARY: '#666666',     // Gris moyen pour le texte secondaire
  
  // --- Styles spécifiques à l'écran DishesScreen (adaptés de FamilyScreen) ---
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
    alignItems: 'center', // Centre le titre horizontalement
    justifyContent: 'center',
    marginBottom: 30,
    paddingVertical: 10,
  },
  title: {
    fontSize: 32, // Taille du titre cohérente avec FamilyScreen
    fontWeight: 'bold',
    textAlign: 'center', // Centre le texte du titre
    color: '#333333', // TEXT_PRIMARY
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buttonGroupContainer: { // Nouveau conteneur pour le groupe de boutons
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    backgroundColor: '#FFFFFF', // BACKGROUND_PRIMARY
    borderRadius: 12,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    marginHorizontal: 5,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 10, // Taille de bouton réduite comme FamilyScreen
    paddingHorizontal: 15,
    borderRadius: 10,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeButton: {
    backgroundColor: '#007A5E', // ACCENT_GREEN
    borderColor: '#007A5E',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: '#E0E0E0', // BORDER_LIGHT
  },
  buttonIcon: {
    marginRight: 8, // Taille de l'icône réduite
  },
  buttonText: {
    fontSize: 16, // Taille de police réduite
    fontWeight: 'bold',
  },
  activeButtonText: {
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#666666', // TEXT_SECONDARY
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: 5,
  },
});

export default DishesScreen;