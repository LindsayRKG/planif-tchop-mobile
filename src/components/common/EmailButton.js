import React from 'react';
import { View, Button, Alert } from 'react-native';
import EmailService from '../../services/EmailService';
const ShareScreen = () => {
  const handleSendEmail = async () => {
    try {
      const recipients = ['destinataire@example.com']; // Liste des destinataires
      const result = await EmailService.sendEmail(
        recipients,
        true, // includePlanning
        true, // includeStock
        true  // includeShoppingList
      );
      
      if (result.success) {
        // Notez que cela signifie seulement que l'application mail a été ouverte
        // L'utilisateur peut encore annuler l'envoi
        Alert.alert('Succès', result.message);
      } else {
        Alert.alert('Erreur', result.message);
      }
    } catch (error) {
      Alert.alert('Erreur', `Une erreur est survenue: ${error.message}`);
    }
  };

  return (
    <View>
      <Button title="Partager par email" onPress={handleSendEmail} />
    </View>
  );
};

export default ShareScreen;
