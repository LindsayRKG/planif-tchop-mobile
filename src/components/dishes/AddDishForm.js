import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, Platform } from 'react-native'; // ScrollView est retiré ici car géré par l'écran parent
import { db } from '../../config/firebaseConfig'; // Adapter le chemin
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { FontAwesome } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';

// Importer les catégories d'ingrédients
import { INGREDIENT_CATEGORIES } from '../../utils/IngredientCategories'; // Adapter le chemin

function AddDishForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [category, setCategory] = useState('Dîner');
  const [servings, setServings] = useState('');
  const [photoBase64, setPhotoBase64] = useState(null);
  const [ingredients, setIngredients] = useState([{ name: '', quantity: '', unit: '', price: '', category: '' }]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission refusée', 'Désolé, nous avons besoin de la permission d\"accès à la galerie pour choisir une photo.');
        }
      }
    })();
  }, []);

  const pickImage = async () => {
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
            setError("La photo est trop grande (après compression). Veuillez choisir une image plus petite.");
            setPhotoBase64(null);
        } else {
            setPhotoBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
      } else if (!result.canceled) {
          setError("Impossible de récupérer l'image en base64.");
          setPhotoBase64(null);
      }
    } catch (e) {
        setError("Erreur lors de la sélection de l'image: " + e.message);
        setPhotoBase64(null);
    }
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '', unit: '', price: '', category: '' }]);
  };

  const removeIngredient = (index) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    if (!name.trim()) {
      setError("Le nom du plat ne peut pas être vide.");
      setLoading(false);
      return;
    }
    if (!servings || parseInt(servings) <= 0) {
      setError("Veuillez spécifier un nombre de portions valide (supérieur à 0).");
      setLoading(false);
      return;
    }

    const isAnyIngredientIncomplete = ingredients.some(ing =>
      !ing.name.trim() || !ing.quantity || !ing.unit.trim() || !ing.category.trim()
    );

    if (isAnyIngredientIncomplete) {
      setError("Veuillez remplir tous les champs (Nom, Quantité, Unité ET Catégorie) pour chaque ingrédient.");
      setLoading(false);
      return;
    }

    try {
      const newDish = {
        name: name.trim(),
        description: description.trim(),
        prepTime: parseInt(prepTime) || 0,
        cookTime: parseInt(cookTime) || 0,
        category,
        servings: parseInt(servings),
        photo: photoBase64,
        ingredients: ingredients
          .filter(ing => ing.name.trim() !== '')
          .map(ing => ({
            ...ing,
            quantity: ing.quantity === '' ? null : parseFloat(ing.quantity),
            price: ing.price === '' ? null : parseFloat(ing.price) || null,
          })),
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'dishes'), newDish);
      console.log("Plat ajouté avec l'ID:", docRef.id);

      // Réinitialisation
      setName('');
      setDescription('');
      setPrepTime('');
      setCookTime('');
      setCategory('Dîner');
      setServings('');
      setPhotoBase64(null);
      setIngredients([{ name: '', quantity: '', unit: '', price: '', category: '' }]);
      Alert.alert("Succès", "Plat ajouté avec succès !");

    } catch (err) {
      console.error("Erreur lors de l'ajout du plat:", err);
      setError("Erreur lors de l'ajout du plat: " + err.message);
      Alert.alert("Erreur", "Impossible d'ajouter le plat: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Le composant retourne maintenant une View simple, pas un ScrollView
  // Le défilement est géré par le ScrollView dans DishesScreen.js quand ce formulaire est affiché
  return (
    <View style={styles.container}> 
      <Text style={styles.formTitle}><FontAwesome name="cutlery" size={20} /> Ajouter un nouveau plat</Text>

      {error && (
        <Text style={styles.errorMessage}>{error}</Text>
      )}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Nom du plat:</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Poulet Yassa"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Description:</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Décrivez brièvement le plat..."
          multiline
        />
      </View>

      <View style={styles.gridContainer}>
          <View style={styles.gridItem}>
              <Text style={styles.label}><FontAwesome name="clock-o" size={14} /> Préparation (min):</Text>
              <TextInput
                  style={styles.input}
                  value={prepTime}
                  onChangeText={setPrepTime}
                  placeholder="Ex: 20"
                  keyboardType="numeric"
              />
          </View>
          <View style={styles.gridItem}>
              <Text style={styles.label}><FontAwesome name="clock-o" size={14} /> Cuisson (min):</Text>
              <TextInput
                  style={styles.input}
                  value={cookTime}
                  onChangeText={setCookTime}
                  placeholder="Ex: 45"
                  keyboardType="numeric"
              />
          </View>
      </View>

      {/* --- Champ Catégorie du Plat --- */}
      <View style={styles.formGroup}>
        <Text style={styles.label}><FontAwesome name="clipboard" size={14} /> Catégorie du Plat:</Text>
        {/* Le conteneur du Picker s'adapte maintenant en hauteur */}
        <View style={styles.pickerContainer}>
            <Picker
              selectedValue={category}
              onValueChange={(itemValue) => setCategory(itemValue)}
              style={styles.picker} // Le style du Picker lui-même
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
          value={servings}
          onChangeText={setServings}
          placeholder="Ex: 4"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}><FontAwesome name="image" size={14} /> Photo du plat:</Text>
        <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
          <Text style={styles.imagePickerButtonText}>Choisir une image</Text>
        </TouchableOpacity>
        {photoBase64 && (
          <Image source={{ uri: photoBase64 }} style={styles.photoPreview} />
        )}
      </View>

      {/* --- Section Ingrédients --- */}
      <View style={styles.ingredientsSection}>
        <Text style={styles.ingredientsTitle}><FontAwesome name="list-ul" size={16} /> Ingrédients:</Text>
        {ingredients.map((ingredient, index) => (
          <View key={index} style={styles.ingredientItem}>
            {/* Nom ingrédient */}
            <TextInput
              style={[styles.input, styles.ingredientInput]} placeholder="Nom" value={ingredient.name}
              onChangeText={(value) => handleIngredientChange(index, 'name', value)}
            />
            {/* Ligne Quantité + Unité */}
            <View style={styles.ingredientRow}>
                <TextInput
                  style={[styles.input, styles.ingredientInputQty]} placeholder="Qté" value={ingredient.quantity}
                  onChangeText={(value) => handleIngredientChange(index, 'quantity', value)} keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.ingredientInputUnit]} placeholder="Unité (g, ml, c.à.s...)" value={ingredient.unit}
                  onChangeText={(value) => handleIngredientChange(index, 'unit', value)}
                />
            </View>
            {/* Catégorie ingrédient */}
            <View style={[styles.pickerContainer, styles.ingredientPickerMargin]}> 
                <Picker
                  selectedValue={ingredient.category}
                  onValueChange={(value) => handleIngredientChange(index, 'category', value)}
                  style={styles.picker}
                >
                  {INGREDIENT_CATEGORIES.map((cat, catIndex) => (
                    <Picker.Item key={catIndex} label={cat} value={cat === "Sélectionner une catégorie" ? "" : cat} />
                  ))}
                </Picker>
            </View>
            {/* Prix ingrédient */}
            <TextInput
              style={[styles.input, styles.ingredientInput, styles.ingredientPriceMargin]} placeholder="Prix (XAF, optionnel)" value={ingredient.price}
              onChangeText={(value) => handleIngredientChange(index, 'price', value)} keyboardType="numeric"
            />
            {/* Bouton Supprimer */}
            {ingredients.length > 1 && (
              <TouchableOpacity onPress={() => removeIngredient(index)} style={styles.removeButton}>
                <FontAwesome name="trash" size={16} color="#dc3545" />
                <Text style={styles.removeButtonText}> Supprimer</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity onPress={addIngredient} style={styles.addButton}>
          <FontAwesome name="plus" size={16} color="#fff" />
          <Text style={styles.addButtonText}> Ajouter un ingrédient</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleSubmit} disabled={loading} style={[styles.submitButton, loading && styles.submitButtonDisabled]}>
        <FontAwesome name="save" size={18} color="#fff" />
        <Text style={styles.submitButtonText}>{loading ? 'Ajout en cours...' : ' Ajouter le plat'}</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1, // Retiré car le parent (ScrollView) gère le flex
    padding: 15,
    backgroundColor: 'transparent', // Le fond est géré par l'écran parent
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#343a40',
  },
  errorMessage: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 14,
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
    paddingVertical: 10, // Augmenté légèrement pour un meilleur toucher
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  gridContainer: {
    flexDirection: 'row',
    // justifyContent: 'space-between', // Retiré, flex: 1 sur les items suffit
    marginBottom: 15, // Ajouté pour espacer de l'élément suivant
  },
  gridItem: {
      flex: 1, // Chaque item prend la moitié de l'espace disponible
      marginHorizontal: 5, // Ajoute un petit espace entre les deux items
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 5,
    backgroundColor: '#fff',
    // height: 50, // Hauteur fixe retirée pour plus de flexibilité
    justifyContent: 'center',
  },
  // pickerContainerIngredient a été fusionné avec pickerContainer
  picker: {
    // height: 50, // Hauteur fixe retirée
    width: '100%',
    // On peut ajouter un padding interne si nécessaire sur certaines plateformes
    // paddingVertical: Platform.OS === 'ios' ? 10 : 0,
  },
  imagePickerButton: {
    backgroundColor: '#007bff',
    padding: 12, // Légèrement plus grand
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  imagePickerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    alignSelf: 'center', // Centrer l'image si elle est plus petite que la largeur
  },
  ingredientsSection: {
    marginTop: 20,
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  ingredientsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15, // Augmenté l'espace
    color: '#343a40',
  },
  ingredientItem: {
    marginBottom: 15,
    padding: 12, // Légèrement plus de padding
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  ingredientInput: {
    marginBottom: 8, // Espace cohérent entre les champs d'un ingrédient
  },
  ingredientRow: {
      flexDirection: 'row',
      marginBottom: 8, // Espace après la ligne qté/unité
  },
  ingredientInputQty: {
      flex: 1, 
      marginRight: 4, // Réduit l'espace
  },
  ingredientInputUnit: {
      flex: 1,
      marginLeft: 4, // Réduit l'espace
  },
  ingredientPickerMargin: { // Ajoute une marge au conteneur Picker des ingrédients
      marginBottom: 8,
  },
  ingredientPriceMargin: { // Ajoute une marge au champ prix
      marginBottom: 8,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    padding: 8,
    backgroundColor: '#f8d7da',
    borderRadius: 5,
    alignSelf: 'flex-end', // Aligner à droite
  },
  removeButtonText: {
    color: '#721c24',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 5,
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    marginTop: 20, // Augmenté l'espace avant le bouton final
    marginBottom: 30, // Espace en bas pour le défilement
  },
  submitButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default AddDishForm;

