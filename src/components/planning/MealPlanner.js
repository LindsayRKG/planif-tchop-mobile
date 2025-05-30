import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { db } from '../../config/firebaseConfig'; // Assurez-vous que le chemin est correct
import { collection, addDoc, query, where, getDocs, doc, deleteDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { FontAwesome } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

const MEAL_TYPES = [
  'Petit-déjeuner',
  'Déjeuner',
  'Dîner',
  'Collation',
  'Brunch',
];

function MealPlanner() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState(MEAL_TYPES[0]);
  const [selectedDishId, setSelectedDishId] = useState('');
  const [servingsPlanned, setServingsPlanned] = useState('');
  const [dishes, setDishes] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [loadingDishes, setLoadingDishes] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState(null);

  // Charger les plats disponibles
  useEffect(() => {
    setLoadingDishes(true);
    const dishesCol = collection(db, 'dishes');
    const unsubscribe = onSnapshot(dishesCol, (snapshot) => {
      const dishesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDishes(dishesList);
      if (dishesList.length > 0 && !selectedDishId) {
        setSelectedDishId(dishesList[0].id);
      }
      setLoadingDishes(false);
    }, (err) => {
      console.error("Erreur chargement plats:", err);
      setError("Impossible de charger les plats.");
      setLoadingDishes(false);
    });
    return () => unsubscribe();
  }, []);

  // Charger les plans de repas pour la semaine sélectionnée
  useEffect(() => {
    if (dishes.length === 0 && !loadingDishes) return; // Attendre que les plats soient chargés

    setLoadingPlans(true);
    const startOfWeek = moment(selectedDate).startOf('week').toDate();
    const endOfWeek = moment(selectedDate).endOf('week').toDate();

    const q = query(
      collection(db, 'mealPlans'),
      where('date', '>=', moment(startOfWeek).format('YYYY-MM-DD')),
      where('date', '<=', moment(endOfWeek).format('YYYY-MM-DD'))
      // where('userId', '==', 'user_test_id') // Ajouter si nécessaire
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const plans = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const plansWithDishes = plans.map(plan => {
        const dishDetail = dishes.find(dish => dish.id === plan.dishId);
        return { ...plan, dish: dishDetail };
      }).sort((a, b) => moment(a.date).diff(moment(b.date)));
      setMealPlans(plansWithDishes);
      setLoadingPlans(false);
      setError(null);
    }, (err) => {
      console.error("Erreur chargement plans:", err);
      setError("Impossible de charger le planning.");
      setLoadingPlans(false);
    });

    return () => unsubscribe();
  }, [selectedDate, dishes, loadingDishes]);

  const handleDateChange = (event, newDate) => {
    const currentDate = newDate || selectedDate;
    setShowDatePicker(Platform.OS === 'ios'); // Sur iOS, le picker reste affiché
    setSelectedDate(currentDate);
  };

  const handleAddMealPlan = async () => {
    setError(null);
    if (!selectedDishId || !servingsPlanned || parseInt(servingsPlanned) <= 0) {
      setError("Sélectionnez un plat et un nombre de portions valide.");
      return;
    }

    setLoadingSubmit(true);
    try {
      const newMealPlan = {
        userId: 'user_test_id', // À remplacer par l'ID utilisateur réel
        date: moment(selectedDate).format('YYYY-MM-DD'),
        mealType: selectedMealType,
        dishId: selectedDishId,
        servingsPlanned: parseInt(servingsPlanned),
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'mealPlans'), newMealPlan);
      Alert.alert('Succès', 'Repas planifié avec succès !');
      setServingsPlanned(''); // Réinitialiser seulement les portions
      // Le rechargement se fait via onSnapshot
    } catch (err) {
      console.error("Erreur planification repas:", err);
      setError("Erreur lors de la planification.");
      Alert.alert("Erreur", "Impossible de planifier le repas.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDeleteMealPlan = (id) => {
    Alert.alert(
      "Confirmer suppression",
      "Supprimer ce repas planifié ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'mealPlans', id));
              // La mise à jour se fait via onSnapshot
            } catch (err) {
              console.error("Erreur suppression plan:", err);
              Alert.alert("Erreur", "Impossible de supprimer le plan.");
            }
          },
        },
      ]
    );
  };

  const groupedMealPlans = mealPlans.reduce((acc, plan) => {
    const date = moment(plan.date).format('YYYY-MM-DD');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(plan);
    return acc;
  }, {});

  const daysOfWeek = Array.from({ length: 7 }, (_, i) =>
    moment(selectedDate).startOf('week').add(i, 'days')
  );

  // --- Composant pour le formulaire et titre du planning (en-tête de la liste) ---
  const renderListHeader = () => (
    <View style={styles.headerFooterContainer}> 
      <Text style={styles.sectionTitle}><FontAwesome name="calendar-plus-o" size={20} /> Planifier un Repas</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {/* Formulaire d'ajout */}
      <View style={styles.formContainer}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Date:</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
            <Text style={styles.dateButtonText}>{moment(selectedDate).format('dddd DD MMMM YYYY')}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={selectedDate}
              mode={'date'}
              is24Hour={true}
              display="default"
              onChange={handleDateChange}
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Type de Repas:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedMealType}
              onValueChange={(itemValue) => setSelectedMealType(itemValue)}
              style={styles.picker}
            >
              {MEAL_TYPES.map((type) => (
                <Picker.Item key={type} label={type} value={type} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Plat:</Text>
          {loadingDishes ? (
            <ActivityIndicator />
          ) : dishes.length > 0 ? (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedDishId}
                onValueChange={(itemValue) => setSelectedDishId(itemValue)}
                style={styles.picker}
                enabled={dishes.length > 0}
              >
                {dishes.map((dish) => (
                  <Picker.Item key={dish.id} label={dish.name} value={dish.id} />
                ))}
              </Picker>
            </View>
          ) : (
            <Text style={styles.infoText}>Aucun plat disponible.</Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Portions Prévues:</Text>
          <TextInput
            style={styles.input}
            value={servingsPlanned}
            onChangeText={setServingsPlanned}
            placeholder="Ex: 4"
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loadingSubmit && styles.submitButtonDisabled]}
          onPress={handleAddMealPlan}
          disabled={loadingSubmit || dishes.length === 0}
        >
          {loadingSubmit ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}><FontAwesome name="plus" /> Planifier</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Titre pour la section planning */}
      <Text style={styles.sectionTitle}><FontAwesome name="calendar" size={20} /> Planning de la semaine</Text>
      <Text style={styles.weekRangeText}>
        ({moment(selectedDate).startOf('week').format('DD MMM')} - {moment(selectedDate).endOf('week').format('DD MMM')})
      </Text>
      {/* Indicateur de chargement pour les plans, affiché dans l'en-tête */}
      {loadingPlans && <ActivityIndicator size="large" color="#007bff" style={{ marginVertical: 20 }} />}
    </View>
  );

  // --- Composant pour afficher un jour dans la FlatList ---
  const renderDayItem = ({ item: day }) => {
    const dayStr = day.format('YYYY-MM-DD');
    const plansForDay = groupedMealPlans[dayStr] || [];
    return (
      <View style={styles.dayCard}>
        <Text style={styles.dayTitle}>{day.format('dddd DD')}</Text>
        {plansForDay.length > 0 ? (
          plansForDay.map((plan) => (
            <View key={plan.id} style={styles.mealItem}>
              <View style={styles.mealInfo}>
                <Text style={styles.mealType}>{plan.mealType}:</Text>
                <Text style={styles.mealDish}>{plan.dish ? plan.dish.name : 'Plat Supprimé'} ({plan.servingsPlanned}p)</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteMealPlan(plan.id)} style={styles.deleteButton}>
                <FontAwesome name="trash" size={18} color="#dc3545" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.noMealText}>Rien de prévu</Text>
        )}
      </View>
    );
  };

  // --- Rendu principal avec FlatList ---
  return (
    <FlatList
      style={styles.container} // Le style du conteneur principal
      data={daysOfWeek} // Les données sont les jours de la semaine
      keyExtractor={(day) => day.format('YYYY-MM-DD')}
      ListHeaderComponent={renderListHeader} // Le formulaire et les titres sont l'en-tête
      renderItem={renderDayItem} // Fonction pour afficher chaque jour
      ListEmptyComponent={ // S'affiche seulement si daysOfWeek est vide (ne devrait pas arriver ici) ou si on filtre plus tard
        !loadingPlans && mealPlans.length === 0 ? (
          <View style={styles.headerFooterContainer}> 
             <Text style={styles.infoText}>Aucun repas planifié pour cette semaine.</Text>
          </View>
        ) : null
      }
      contentContainerStyle={styles.listContentContainer} // Style pour le contenu interne de la liste
    />
  );
}

// --- Styles --- (Assurez-vous que tous les styles utilisés sont définis ici)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerFooterContainer: { // Conteneur pour l'en-tête (et potentiellement pied de page)
      paddingHorizontal: 15,
      paddingTop: 15,
  },
  listContentContainer: {
      paddingBottom: 20, // Espace en bas de la liste
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 10,
    color: '#343a40',
    textAlign: 'center',
  },
  weekRangeText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
  },
  infoText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#6c757d',
    fontSize: 14,
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#495057',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 5,
    backgroundColor: '#fff',
    // Ajustez la hauteur si nécessaire pour votre design
    // height: 50, 
    justifyContent: 'center',
  },
  picker: {
    // height: 50, // Peut être nécessaire sur certaines plateformes
    width: '100%',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#495057',
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Styles pour la liste des jours
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    marginHorizontal: 15, // Garder un peu d'espace sur les côtés
    elevation: 1,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#007bff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mealInfo: {
    flex: 1,
    marginRight: 10,
  },
  mealType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#343a40',
  },
  mealDish: {
    fontSize: 14,
    color: '#495057',
  },
  deleteButton: {
    padding: 5,
  },
  noMealText: {
    fontSize: 13,
    color: '#6c757d',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
});

export default MealPlanner;

