import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

// Importer les composants (inchangés ici, ils devront être stylisés avec cette nouvelle palette)
import FamilyForm from '../components/family/FamilyForm';
import FamilyList from '../components/family/FamilyList';

function FamilyScreen() {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.headerContainer}>
          {/* L'icône du titre peut être rouge, vert, ou même un gris foncé pour la sobriété */}
          <FontAwesome name="users" size={32} color={styles.ACCENT_RED} />
          <Text style={styles.title}>Gestion de la Famille</Text>
        </View>

        {/* Groupe de boutons stylisé comme un segment de contrôle ou une carte */}
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
            <Text style={[styles.buttonText, showAddForm ? styles.activeButtonText : styles.secondaryButtonText]}>Ajouter un Membre</Text>
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
            <Text style={[styles.buttonText, !showAddForm ? styles.activeButtonText : styles.secondaryButtonText]}>Voir les Membres</Text>
          </TouchableOpacity>
        </View>

        {/* Section de contenu qui pourrait contenir le formulaire ou la liste */}
        <View style={styles.contentSection}>
          {showAddForm ? (
            <FamilyForm />
          ) : (
            <FamilyList />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // --- Nouvelle Palette de Couleurs (inspirée mais adoucie) ---
  // Couleurs d'accent (celles du drapeau, utilisées avec parcimonie)
  ACCENT_GREEN: '#007A5E',       // Vert foncé, vif
  ACCENT_RED: '#CE1126',         // Rouge vif
  ACCENT_YELLOW: '#FCD116',      // Jaune vif
  
  // Couleurs de fond (plus douces et neutres)
  BACKGROUND_PRIMARY: '#FFFFFF',    // Blanc pur pour les éléments principaux (cartes, etc.)
  BACKGROUND_SECONDARY: '#F8F8F8', // Gris très très clair, presque blanc (pour le fond général de la page)
  
  // Couleurs de bordure
  BORDER_LIGHT: '#E0E0E0',      // Gris très clair pour les bordures légères
  BORDER_MEDIUM: '#C0C0C0',     // Gris clair pour les bordures moyennes
  
  // Couleurs de texte
  TEXT_PRIMARY: '#333333',       // Gris très foncé pour le texte principal
  TEXT_SECONDARY: '#666666',     // Gris moyen pour le texte secondaire
  
  // --- Styles spécifiques à l'écran FamilyScreen ---
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
    color: '#333333', // TEXT_PRIMARY, pour un titre moins agressif que le rouge vif
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buttonGroupContainer: {
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
    paddingVertical: 10, // Réduction du padding vertical (était 14)
    paddingHorizontal: 15, // Reste comme il était (mais peut être ajusté)
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
    marginRight: 8, // Réduction de l'espace pour l'icône (était 10)
  },
  buttonText: {
    fontSize: 16, // Réduction de la taille de la police (était 18)
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

export default FamilyScreen;