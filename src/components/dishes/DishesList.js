import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, TextInput, StyleSheet, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import { db } from '../../config/firebaseConfig'; // Adapter le chemin
import { collection, onSnapshot, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { FontAwesome } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { INGREDIENT_CATEGORIES } from '../../utils/IngredientCategories'; // Adapter le chemin

function DishesList() {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingDishId, setEditingDishId] = useState(null);
  const [editedDishData, setEditedDishData] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false); // Pour le chargement de la mise à jour

  useEffect(() => {
    const dishesCollectionRef = collection(db, 'dishes');
    const unsubscribe = onSnapshot(dishesCollectionRef, (snapshot) => {
      const dishesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDishes(dishesData);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Erreur lors de la récupération des plats:", err);
      setError("Impossible de charger les plats.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDeleteDish = (dishId) => {
    Alert.alert(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir supprimer ce plat ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'dishes', dishId));
              console.log("Plat supprimé avec succès:", dishId);
            } catch (err) {
              console.error("Erreur lors de la suppression du plat:", err);
              setError("Erreur lors de la suppression: " + err.message);
              Alert.alert("Erreur", "Impossible de supprimer le plat.");
            }
          },
        },
      ]
    );
  };

  const handleEditClick = (dish) => {
    setEditingDishId(dish.id);
    const ingredientsForEdit = (dish.ingredients || []).map(ing => ({
      ...ing,
      quantity: ing.quantity === null || ing.quantity === undefined ? '' : String(ing.quantity),
      price: ing.price === null || ing.price === undefined ? '' : String(ing.price)
    }));
    setEditedDishData({ ...dish, ingredients: ingredientsForEdit });
  };

  const handleCancelEdit = () => {
    setEditingDishId(null);
    setEditedDishData({});
    setError(null); // Réinitialiser les erreurs d'édition
  };

  const handleEditedInputChange = (field, value) => {
    setEditedDishData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  const handleEditedIngredientChange = (index, field, value) => {
    const newIngredients = [...(editedDishData.ingredients || [])];
    newIngredients[index][field] = value;
    setEditedDishData(prevData => ({
      ...prevData,
      ingredients: newIngredients
    }));
  };

  const addEditedIngredient = () => {
    setEditedDishData(prevData => ({
      ...prevData,
      ingredients: [...(prevData.ingredients || []), { name: '', quantity: '', unit: '', price: '', category: '' }]
    }));
  };

  const removeEditedIngredient = (index) => {
    setEditedDishData(prevData => ({
      ...prevData,
      ingredients: (prevData.ingredients || []).filter((_, i) => i !== index)
    }));
  };

  const pickEditImage = async () => {
    setError(null);
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        const estimatedSize = result.assets[0].base64.length * (3 / 4);
        const maxSize = 700 * 1024; // 700 KB
        if (estimatedSize > maxSize) {
            setError("La photo est trop grande. Veuillez choisir une image plus petite.");
            handleEditedInputChange('photo', editedDishData.photo); // Garder l'ancienne photo
        } else {
            handleEditedInputChange('photo', `data:image/jpeg;base64,${result.assets[0].base64}`);
        }
      } else if (!result.canceled) {
          setError("Impossible de récupérer l'image en base64.");
      }
    } catch (e) {
        setError("Erreur lors de la sélection de l'image: " + e.message);
    }
  };

  const handleUpdateDish = async () => {
    if (!editingDishId) return;
    setError(null);
    setUpdateLoading(true);

    if (!editedDishData.name || !editedDishData.name.trim()) {
      setError("Le nom du plat ne peut pas être vide.");
      setUpdateLoading(false);
      return;
    }
    if (!editedDishData.servings || parseInt(editedDishData.servings) <= 0) {
        setError("Veuillez spécifier un nombre de portions valide.");
        setUpdateLoading(false);
        return;
    }
    const isAnyIngredientIncomplete = (editedDishData.ingredients || []).some(ing =>
        !ing.name.trim() || !ing.quantity || !ing.unit.trim() || !ing.category.trim()
    );
    if (isAnyIngredientIncomplete) {
        setError("Veuillez remplir tous les champs pour chaque ingrédient.");
        setUpdateLoading(false);
        return;
    }

    try {
      const dishRef = doc(db, 'dishes', editingDishId);
      const dataToUpdate = {
        name: editedDishData.name.trim(),
        description: editedDishData.description ? editedDishData.description.trim() : '',
        prepTime: parseInt(editedDishData.prepTime) || 0,
        cookTime: parseInt(editedDishData.cookTime) || 0,
        category: editedDishData.category,
        servings: parseInt(editedDishData.servings),
        photo: editedDishData.photo, // Peut être null ou base64
        ingredients: (editedDishData.ingredients || [])
          .filter(ing => ing.name.trim() !== '')
          .map(ing => ({
            ...ing,
            quantity: ing.quantity === '' ? null : parseFloat(ing.quantity),
            price: ing.price === '' ? null : parseFloat(ing.price) || null,
          })),
        updatedAt: serverTimestamp()
      };

      await updateDoc(dishRef, dataToUpdate);
      console.log("Plat mis à jour avec succès:", editingDishId);
      handleCancelEdit(); // Sortir du mode édition
      Alert.alert("Succès", "Plat mis à jour.");
    } catch (err) {
      console.error("Erreur lors de la mise à jour du plat:", err);
      setError("Erreur lors de la mise à jour: " + err.message);
      Alert.alert("Erreur", "Impossible de mettre à jour le plat.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const renderEditForm = (dish) => (
    <ScrollView style={styles.editFormCard}>
      <Text style={styles.editFormTitle}><FontAwesome name="edit" size={18} /> Modifier "{dish.name}"</Text>
      {error && <Text style={styles.errorTextItem}>{error}</Text>}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Nom:</Text>
        <TextInput
          style={styles.input}
          value={editedDishData.name || ''}
          onChangeText={(value) => handleEditedInputChange('name', value)}
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Description:</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={editedDishData.description || ''}
          onChangeText={(value) => handleEditedInputChange('description', value)}
          multiline
        />
      </View>
      <View style={styles.gridContainer}>
          <View style={styles.gridItem}>
              <Text style={styles.label}><FontAwesome name="clock-o" size={14} /> Préparation (min):</Text>
              <TextInput
                  style={styles.input}
                  value={String(editedDishData.prepTime || 0)}
                  onChangeText={(value) => handleEditedInputChange('prepTime', value)}
                  keyboardType="numeric"
              />
          </View>
          <View style={styles.gridItem}>
              <Text style={styles.label}><FontAwesome name="clock-o" size={14} /> Cuisson (min):</Text>
              <TextInput
                  style={styles.input}
                  value={String(editedDishData.cookTime || 0)}
                  onChangeText={(value) => handleEditedInputChange('cookTime', value)}
                  keyboardType="numeric"
              />
          </View>
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}><FontAwesome name="clipboard" size={14} /> Catégorie:</Text>
        <View style={styles.pickerContainer}>
            <Picker
              selectedValue={editedDishData.category || ''}
              onValueChange={(value) => handleEditedInputChange('category', value)}
              style={styles.picker}
            >
              <Picker.Item label="Petit-déjeuner" value="Petit-déjeuner" />
              <Picker.Item label="Déjeuner" value="Déjeuner" />
              <Picker.Item label="Dîner" value="Dîner" />
              <Picker.Item label="Dessert" value="Dessert" />
              <Picker.Item label="Collation" value="Collation" />
              <Picker.Item label="Boisson" value="Boisson" />
            </Picker>
        </View>
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Nombre de portions:</Text>
        <TextInput
          style={styles.input}
          value={String(editedDishData.servings || '')}
          onChangeText={(value) => handleEditedInputChange('servings', value)}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}><FontAwesome name="image" size={14} /> Photo:</Text>
        <TouchableOpacity style={styles.imagePickerButton} onPress={pickEditImage}>
          <Text style={styles.imagePickerButtonText}>Modifier l'image</Text>
        </TouchableOpacity>
        {editedDishData.photo && (
          <Image source={{ uri: editedDishData.photo }} style={styles.photoPreview} />
        )}
      </View>

      <View style={styles.ingredientsSection}>
        <Text style={styles.ingredientsTitle}><FontAwesome name="list-ul" size={16} /> Ingrédients:</Text>
        {(editedDishData.ingredients || []).map((ingredient, index) => (
          <View key={index} style={styles.ingredientItemEdit}>
            <TextInput
              style={[styles.input, styles.ingredientInput]} placeholder="Nom" value={ingredient.name}
              onChangeText={(value) => handleEditedIngredientChange(index, 'name', value)}
            />
            <View style={styles.ingredientRow}>
                <TextInput
                  style={[styles.input, styles.ingredientInputQty]} placeholder="Qté" value={ingredient.quantity}
                  onChangeText={(value) => handleEditedIngredientChange(index, 'quantity', value)} keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.ingredientInputUnit]} placeholder="Unité" value={ingredient.unit}
                  onChangeText={(value) => handleEditedIngredientChange(index, 'unit', value)}
                />
            </View>
            <View style={styles.pickerContainerIngredient}>
                <Picker
                  selectedValue={ingredient.category}
                  onValueChange={(value) => handleEditedIngredientChange(index, 'category', value)}
                  style={styles.picker}
                >
                  {INGREDIENT_CATEGORIES.map((cat, catIndex) => (
                    <Picker.Item key={catIndex} label={cat} value={cat === "Sélectionner une catégorie" ? "" : cat} />
                  ))}
                </Picker>
            </View>
            <TextInput
              style={[styles.input, styles.ingredientInput]} placeholder="Prix (XAF, optionnel)" value={ingredient.price}
              onChangeText={(value) => handleEditedIngredientChange(index, 'price', value)} keyboardType="numeric"
            />
            {(editedDishData.ingredients || []).length > 1 && (
              <TouchableOpacity onPress={() => removeEditedIngredient(index)} style={styles.removeButton}>
                <FontAwesome name="trash" size={16} color="#dc3545" />
                <Text style={styles.removeButtonText}> Supprimer</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity onPress={addEditedIngredient} style={styles.addButtonSmall}>
          <FontAwesome name="plus" size={14} color="#fff" />
          <Text style={styles.addButtonTextSmall}> Ajouter ingrédient</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.editButtonGroup}>
        <TouchableOpacity onPress={handleUpdateDish} disabled={updateLoading} style={[styles.actionButton, styles.successButton]}>
          {updateLoading ? <ActivityIndicator size="small" color="#fff" /> : <FontAwesome name="save" size={16} color="#fff" />}
          <Text style={styles.actionButtonText}> Enregistrer</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCancelEdit} style={[styles.actionButton, styles.secondaryButton]}>
          <FontAwesome name="times" size={16} color="#6c757d" />
          <Text style={styles.actionButtonTextSecondary}> Annuler</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderDishItem = ({ item }) => {
    if (editingDishId === item.id) {
      return renderEditForm(item);
    }

    return (
      <View style={styles.dishItem}>
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.dishImage} resizeMode="cover" />
        ) : (
          <View style={styles.noImagePlaceholder}><FontAwesome name="image" size={40} color="#ccc" /></View>
        )}
        <View style={styles.dishInfo}>
          <Text style={styles.dishName}>{item.name}</Text>
          <Text style={styles.dishCategory}><FontAwesome name="clipboard" size={12} /> {item.category}</Text>
          {item.description && <Text style={styles.dishDescription}>{item.description}</Text>}
          <Text style={styles.dishTimes}><FontAwesome name="clock-o" size={12} /> Prép: {item.prepTime} min | Cuisson: {item.cookTime} min</Text>
          <Text style={styles.dishTimes}><FontAwesome name="users" size={12} /> Portions: {item.servings}</Text>

          <View style={styles.ingredientsDisplay}>
            <Text style={styles.ingredientsDisplayTitle}><FontAwesome name="list-ul" size={14} /> Ingrédients:</Text>
            {(item.ingredients && item.ingredients.length > 0) ? (
              item.ingredients.map((ing, idx) => (
                <Text key={idx} style={styles.ingredientText}>
                  - {ing.quantity !== null && ing.quantity !== undefined ? `${ing.quantity} ` : ''}
                  {ing.unit ? `${ing.unit} ` : ''}
                  {ing.name}
                  {ing.price !== null && ing.price !== undefined ? ` (${parseFloat(ing.price).toFixed(0)} XAF)` : ''}
                  {ing.category ? ` [${ing.category}]` : ''}
                </Text>
              ))
            ) : (
              <Text style={styles.ingredientText}>Aucun ingrédient.</Text>
            )}
          </View>

          <View style={styles.buttonGroupItem}>
            <TouchableOpacity onPress={() => handleEditClick(item)} style={[styles.actionButton, styles.primaryButton]}>
              <FontAwesome name="edit" size={16} color="#fff" />
              <Text style={styles.actionButtonText}> Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteDish(item.id)} style={[styles.actionButton, styles.dangerButton]}>
              <FontAwesome name="trash" size={16} color="#fff" />
              <Text style={styles.actionButtonText}> Supprimer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#007bff" style={styles.loading} />;
  }

  if (error && !editingDishId) { // Afficher l'erreur générale seulement si on n'est pas en mode édition
    return <Text style={styles.errorText}>{error}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.listTitle}><FontAwesome name="list-alt" size={20} /> Liste des plats</Text>
      {dishes.length === 0 ? (
        <Text style={styles.noDishesText}>Aucun plat enregistré.</Text>
      ) : (
        <FlatList
          data={dishes}
          renderItem={renderDishItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 10, // Padding géré par FlatList ou ScrollView interne
    backgroundColor: '#f8f9fa',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    margin: 20,
    fontSize: 16,
  },
  errorTextItem: {
      color: 'red',
      textAlign: 'center',
      marginBottom: 10,
      fontSize: 14,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
    color: '#343a40',
  },
  noDishesText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#6c757d',
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  dishItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden', // Pour que le borderRadius s'applique à l'image
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  dishImage: {
    width: '100%',
    height: 180,
  },
  noImagePlaceholder: {
      width: '100%',
      height: 150,
      backgroundColor: '#e9ecef',
      justifyContent: 'center',
      alignItems: 'center',
  },
  dishInfo: {
    padding: 15,
  },
  dishName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#343a40',
  },
  dishCategory: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  dishDescription: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    lineHeight: 20,
  },
  dishTimes: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 5,
  },
  ingredientsDisplay: {
    marginTop: 10,
    marginBottom: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  ingredientsDisplayTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 5,
    color: '#343a40',
  },
  ingredientText: {
    fontSize: 13,
    color: '#495057',
    marginLeft: 5,
    lineHeight: 18,
  },
  buttonGroupItem: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
   actionButtonTextSecondary: {
    color: '#6c757d',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  primaryButton: {
    backgroundColor: '#007bff',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  successButton: {
      backgroundColor: '#28a745',
  },
  secondaryButton: {
      backgroundColor: '#f8f9fa',
      borderWidth: 1,
      borderColor: '#6c757d',
  },
  // Styles pour le formulaire d'édition
  editFormCard: {
    padding: 15,
    backgroundColor: '#e9ecef', // Fond différent pour l'édition
    borderRadius: 8,
    marginBottom: 15,
  },
  editFormTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#343a40',
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    color: '#495057',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  textarea: {
    height: 80,
    textAlignVertical: 'top',
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridItem: {
      flex: 1,
      marginHorizontal: 2,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 5,
    backgroundColor: '#fff',
    height: 50,
    justifyContent: 'center',
  },
  pickerContainerIngredient: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 5,
    backgroundColor: '#fff',
    height: 50,
    justifyContent: 'center',
    marginTop: 5,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  imagePickerButton: {
    backgroundColor: '#6c757d',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  imagePickerButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  photoPreview: {
    width: '100%',
    height: 150,
    resizeMode: 'contain',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  ingredientsSection: {
    marginTop: 15,
    marginBottom: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
  },
  ingredientsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#343a40',
  },
  ingredientItemEdit: {
    marginBottom: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    backgroundColor: '#fdfdfd',
  },
  ingredientInput: {
    marginBottom: 5,
    fontSize: 13,
    paddingVertical: 6,
  },
  ingredientRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
  },
  ingredientInputQty: {
      flex: 1,
      marginRight: 5,
      fontSize: 13,
      paddingVertical: 6,
  },
  ingredientInputUnit: {
      flex: 1,
      marginLeft: 5,
      fontSize: 13,
      paddingVertical: 6,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    padding: 6,
    backgroundColor: '#f8d7da',
    borderRadius: 5,
  },
  removeButtonText: {
    color: '#721c24',
    marginLeft: 5,
    fontWeight: 'bold',
    fontSize: 12,
  },
  addButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  addButtonTextSmall: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  editButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
});

export default DishesList;

