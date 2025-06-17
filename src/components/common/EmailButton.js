import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

/**
 * Bouton pour accéder à la fonctionnalité d'envoi d'emails
 * Ce composant peut être utilisé dans différents écrans pour naviguer vers l'écran d'envoi d'emails
 */
function EmailButton({ style, type = 'planning' }) {
  const navigation = useNavigation();

  const handlePress = () => {
    // Naviguer vers l'écran d'envoi d'emails
    navigation.navigate('Emails', { initialType: type });
  };

  // Déterminer l'icône et le texte en fonction du type
  let icon = 'envelope';
  let text = 'Envoyer par email';
  
  switch (type) {
    case 'planning':
      icon = 'calendar';
      text = 'Envoyer le planning';
      break;
    case 'stock':
      icon = 'cubes';
      text = 'Envoyer l\'état du stock';
      break;
    case 'shopping':
      icon = 'shopping-basket';
      text = 'Envoyer la liste de courses';
      break;
    default:
      break;
  }

  return (
    <TouchableOpacity 
      style={[styles.button, style]} 
      onPress={handlePress}
    >
      <FontAwesome name={icon} size={16} color="#fff" style={styles.icon} />
      <Text style={styles.text}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007A5E',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginVertical: 10,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default EmailButton;

