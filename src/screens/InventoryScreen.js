import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Platform,
    FlatList,
    TextInput,
    ActivityIndicator,
    Alert,
    Modal,
    Button,
    ScrollView // Needed for Shopping List view
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { db } from '../config/firebaseConfig';
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    serverTimestamp,
    getDocs,
    getDoc
} from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import { INGREDIENT_CATEGORIES } from '../utils/IngredientCategories';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

// --- Shared Constants & Helpers ---
const userId = 'user_test_id'; // Placeholder
const LOW_STOCK_THRESHOLD = 1;
const normalizeName = (name) => name ? name.trim().toLowerCase() : '';
const groupStockByCategory = (stockData) => {
    return stockData.reduce((acc, item) => {
        const category = item.category || 'Autres';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        acc[category].sort((a, b) => a.name.localeCompare(b.name));
        return acc;
    }, {});
};

// --- Stock Management View Component ---
function StockManagementView() {
    const [stock, setStock] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [itemName, setItemName] = useState('');
    const [itemQuantity, setItemQuantity] = useState('');
    const [itemUnit, setItemUnit] = useState('');
    const [itemCategory, setItemCategory] = useState(INGREDIENT_CATEGORIES[1]);
    const [modalLoading, setModalLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        const stockCollectionRef = collection(db, 'userStock');
        const q = query(stockCollectionRef, where('userId', '==', userId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const stockData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const groupedData = groupStockByCategory(stockData);
            const sortedCategories = Object.keys(groupedData).sort();
            const sortedGroupedData = {};
            sortedCategories.forEach(cat => {
                sortedGroupedData[cat] = groupedData[cat];
            });
            setStock(sortedGroupedData);
            setLoading(false);
            setError(null);
        }, (err) => {
            console.error("Erreur chargement stock:", err);
            setError("Impossible de charger le stock.");
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const openModalToAdd = () => {
        setCurrentItem(null);
        setItemName('');
        setItemQuantity('');
        setItemUnit('');
        setItemCategory(INGREDIENT_CATEGORIES[1]);
        setIsModalVisible(true);
    };

    const openModalToEdit = (item) => {
        setCurrentItem(item);
        setItemName(item.name);
        setItemQuantity(String(item.quantity));
        setItemUnit(item.unit);
        setItemCategory(item.category || INGREDIENT_CATEGORIES[1]);
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setCurrentItem(null);
    };

    const handleSaveItem = async () => {
        if (!itemName.trim() || !itemQuantity.trim() || !itemUnit.trim() || !itemCategory) {
            Alert.alert("Erreur", "Veuillez remplir tous les champs (Nom, Quantité, Unité, Catégorie).");
            return;
        }
        const quantity = parseFloat(itemQuantity);
        if (isNaN(quantity) || quantity < 0) {
            Alert.alert("Erreur", "La quantité doit être un nombre positif.");
            return;
        }

        setModalLoading(true);
        const itemData = {
            userId: userId,
            name: itemName.trim(),
            quantity: quantity,
            unit: itemUnit.trim(),
            category: itemCategory,
            updatedAt: serverTimestamp()
        };

        try {
            if (currentItem) {
                const itemRef = doc(db, 'userStock', currentItem.id);
                await updateDoc(itemRef, itemData);
                Alert.alert("Succès", "Ingrédient mis à jour.");
            } else {
                await addDoc(collection(db, 'userStock'), {
                    ...itemData,
                    createdAt: serverTimestamp()
                });
                Alert.alert("Succès", "Ingrédient ajouté au stock.");
            }
            closeModal();
        } catch (err) {
            console.error("Erreur sauvegarde ingrédient:", err);
            Alert.alert("Erreur", `Impossible de sauvegarder l'ingrédient: ${err.message}`);
        } finally {
            setModalLoading(false);
        }
    };

    const handleDeleteItem = (item) => {
        Alert.alert(
            "Confirmer suppression",
            `Supprimer ${item.name} (${item.quantity} ${item.unit}) du stock ?`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'userStock', item.id));
                        } catch (err) {
                            console.error("Erreur suppression ingrédient:", err);
                            Alert.alert("Erreur", `Impossible de supprimer l'ingrédient: ${err.message}`);
                        }
                    }
                }
            ]
        );
    };

    const filteredStock = () => {
        if (!searchQuery) {
            return stock;
        }
        const lowerCaseQuery = searchQuery.toLowerCase();
        const filtered = {};
        Object.keys(stock).forEach(category => {
            const items = stock[category].filter(item =>
                item.name.toLowerCase().includes(lowerCaseQuery)
            );
            if (items.length > 0) {
                filtered[category] = items;
            }
        });
        return filtered;
    };

    const renderStockItem = ({ item }) => {
        const quantity = item.quantity || 0;
        const isOutOfStock = quantity <= 0;
        const isLowStock = quantity > 0 && quantity <= (item.lowStockThreshold || LOW_STOCK_THRESHOLD);

        let itemStyle = styles.itemContainer;
        let nameStyle = styles.itemName;
        let quantityStyle = styles.itemQuantity;
        let icon = null;

        if (isOutOfStock) {
            itemStyle = [styles.itemContainer, styles.itemOutOfStock];
            nameStyle = [styles.itemName, styles.itemNameOutOfStock];
            quantityStyle = [styles.itemQuantity, styles.itemQuantityOutOfStock];
            icon = <FontAwesome name="times-circle" size={16} color={styles.ACCENT_RED} style={styles.statusIcon} />;
        } else if (isLowStock) {
            itemStyle = [styles.itemContainer, styles.itemLowStock];
            quantityStyle = [styles.itemQuantity, styles.itemQuantityLowStock];
            icon = <FontAwesome name="exclamation-triangle" size={16} color={styles.ACCENT_YELLOW_DARK} style={styles.statusIcon} />;
        }

        return (
            <View style={itemStyle}>
                {icon}
                <View style={styles.itemInfo}>
                    <Text style={nameStyle}>{item.name}</Text>
                    <Text style={quantityStyle}>{quantity} {item.unit}</Text>
                </View>
                <View style={styles.itemActions}>
                    <TouchableOpacity onPress={() => openModalToEdit(item)} style={styles.actionButton}>
                        <FontAwesome name="pencil" size={18} color={styles.ACCENT_GREEN} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteItem(item)} style={styles.actionButton}>
                        <FontAwesome name="trash" size={18} color={styles.ACCENT_RED} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderCategorySection = ({ item: category }) => (
        <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            <FlatList
                data={filteredStock()[category]}
                renderItem={renderStockItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false} // Important: disable scroll for nested FlatList
            />
        </View>
    );

    return (
        <View style={styles.contentView}> {/* Use View instead of SafeAreaView here */}
            <FlatList
                ListHeaderComponent={
                    <View style={styles.searchAddContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Rechercher un ingrédient..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor={styles.TEXT_SECONDARY} // Ensure placeholder is visible
                        />
                        <TouchableOpacity onPress={openModalToAdd} style={styles.addButton}>
                            <FontAwesome name="plus" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                }
                data={Object.keys(filteredStock())}
                renderItem={renderCategorySection}
                keyExtractor={(category) => category}
                contentContainerStyle={styles.listContentContainer}
                ListEmptyComponent={
                    !loading ? (
                        <Text style={styles.infoText}>Votre stock est vide ou aucun résultat trouvé.</Text>
                    ) : null
                }
                ListFooterComponent={loading ? <ActivityIndicator size="large" color={styles.ACCENT_GREEN} style={{ marginVertical: 20 }} /> : null}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Add/Edit Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{currentItem ? 'Modifier' : 'Ajouter'} un Ingrédient</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Nom de l'ingrédient"
                            value={itemName}
                            onChangeText={setItemName}
                            placeholderTextColor={styles.TEXT_SECONDARY}
                        />
                        <View style={styles.modalRow}>
                            <TextInput
                                style={[styles.modalInput, styles.modalInputHalf]}
                                placeholder="Quantité"
                                value={itemQuantity}
                                onChangeText={setItemQuantity}
                                keyboardType="numeric"
                                placeholderTextColor={styles.TEXT_SECONDARY}
                            />
                            <TextInput
                                style={[styles.modalInput, styles.modalInputHalf]}
                                placeholder="Unité (kg, g, L, unité...)"
                                value={itemUnit}
                                onChangeText={setItemUnit}
                                placeholderTextColor={styles.TEXT_SECONDARY}
                            />
                        </View>
                        {/* *** CORRECTION APPLIQUÉE ICI pour les OPTIONS *** */}
                        <View style={styles.pickerContainerModal}>
                            <Picker
                                selectedValue={itemCategory}
                                onValueChange={(itemValue) => setItemCategory(itemValue)}
                                style={styles.pickerStyleModal} // Style principal (couleur valeur sélectionnée + Android options)
                                itemStyle={styles.pickerItemStyleModal} // Style des options (surtout iOS)
                            >
                                {INGREDIENT_CATEGORIES.map((cat, index) => (
                                    cat !== "Sélectionner une catégorie" &&
                                    <Picker.Item
                                        key={index}
                                        label={cat}
                                        value={cat}
                                        // color="#333333" // Optionnel: Forcer couleur sur Item (peut aider sur certains Android)
                                    />
                                ))}
                            </Picker>
                        </View>
                        {/* *** FIN DE LA CORRECTION *** */}
                        <View style={styles.modalButtonGroup}>
                            <Button title="Annuler" onPress={closeModal} color={styles.TEXT_SECONDARY} />
                            <Button
                                title={modalLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                                onPress={handleSaveItem}
                                disabled={modalLoading}
                                color={styles.ACCENT_GREEN}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// --- Shopping List View Component ---
function ShoppingListView() {
    const [startDate, setStartDate] = useState(moment().startOf('week').toDate());
    const [endDate, setEndDate] = useState(moment().endOf('week').toDate());
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [shoppingList, setShoppingList] = useState({});
    const [error, setError] = useState(null);

    const handleStartDateChange = (event, newDate) => {
        const currentDate = newDate || startDate;
        setShowStartDatePicker(Platform.OS === 'ios');
        setStartDate(currentDate);
        if (moment(currentDate).isAfter(endDate)) {
            setEndDate(moment(currentDate).endOf('week').toDate());
        }
    };

    const handleEndDateChange = (event, newDate) => {
        const currentDate = newDate || endDate;
        setShowEndDatePicker(Platform.OS === 'ios');
        if (moment(currentDate).isBefore(startDate)) {
            Alert.alert("Date invalide", "La date de fin ne peut pas être antérieure à la date de début.");
        } else {
            setEndDate(currentDate);
        }
    };

    const generateShoppingList = useCallback(async () => {
        setLoading(true);
        setError(null);
        setShoppingList({});
        const aggregatedIngredients = {}; // { 'ingredientName_unit': { name, quantity, unit, category, sources: [] } }
        const itemsToBuy = {}; // { 'category': [ { name, quantity, unit } ] }

        try {
            // 1. Get current stock
            const stockQuery = query(collection(db, 'userStock'), where('userId', '==', userId));
            const stockSnapshot = await getDocs(stockQuery);
            const currentStock = stockSnapshot.docs.reduce((acc, doc) => {
                const data = doc.data();
                const normalizedName = normalizeName(data.name);
                const unit = data.unit ? data.unit.trim() : '';
                const key = `${normalizedName}_${unit}`;
                acc[key] = (acc[key] || 0) + (data.quantity || 0);
                return acc;
            }, {});

            // 2. Get planned meals for the selected date range
            const plansQuery = query(
                collection(db, 'mealPlans'),
                where('userId', '==', userId),
                where('date', '>=', moment(startDate).format('YYYY-MM-DD')),
                where('date', '<=', moment(endDate).format('YYYY-MM-DD')),
                where('prepared', '==', false) // Only consider unprepared meals
            );
            const plansSnapshot = await getDocs(plansQuery);

            if (plansSnapshot.empty) {
                setLoading(false);
                setError("Aucun repas non préparé planifié pour cette période.");
                return;
            }

            // 3. Aggregate required ingredients from all planned dishes
            for (const planDoc of plansSnapshot.docs) {
                const planData = planDoc.data();
                const dishRef = doc(db, 'dishes', planData.dishId);
                const dishSnap = await getDoc(dishRef);

                if (dishSnap.exists()) {
                    const dishData = dishSnap.data();
                    const servings = planData.servingsPlanned || 1;
                    if (dishData.ingredients && Array.isArray(dishData.ingredients)) {
                        dishData.ingredients.forEach(ing => {
                            const requiredQuantity = (ing.quantity || 0) * servings;
                            if (requiredQuantity > 0) {
                                const normalizedName = normalizeName(ing.name);
                                const unit = ing.unit ? ing.unit.trim() : '';
                                const key = `${normalizedName}_${unit}`;
                                if (!aggregatedIngredients[key]) {
                                    aggregatedIngredients[key] = {
                                        name: ing.name.trim(),
                                        quantity: 0,
                                        unit: unit,
                                        category: ing.category || 'Autres',
                                        sources: []
                                    };
                                }
                                aggregatedIngredients[key].quantity += requiredQuantity;
                                aggregatedIngredients[key].sources.push(`${dishData.name} (x${servings})`);
                            }
                        });
                    }
                }
            }

            // 4. Compare required ingredients with stock
            Object.values(aggregatedIngredients).forEach(ing => {
                const normalizedName = normalizeName(ing.name);
                const unit = ing.unit ? ing.unit.trim() : '';
                const key = `${normalizedName}_${unit}`;
                const stockQuantity = currentStock[key] || 0;
                const neededQuantity = ing.quantity - stockQuantity;

                if (neededQuantity > 0) {
                    const category = ing.category || 'Autres';
                    if (!itemsToBuy[category]) {
                        itemsToBuy[category] = [];
                    }
                    itemsToBuy[category].push({
                        name: ing.name,
                        quantity: Math.round(neededQuantity * 100) / 100, // Round to 2 decimal places
                        unit: ing.unit
                    });
                }
            });

            // Sort categories and items within categories
            const sortedCategories = Object.keys(itemsToBuy).sort();
            const sortedItemsToBuy = {};
            sortedCategories.forEach(cat => {
                sortedItemsToBuy[cat] = itemsToBuy[cat].sort((a, b) => a.name.localeCompare(b.name));
            });

            setShoppingList(sortedItemsToBuy);

        } catch (err) {
            console.error("Erreur génération liste de courses:", err);
            setError(`Impossible de générer la liste: ${err.message}`);
            // Check for missing index error
            if (err.code === 'failed-precondition') {
                 setError("Index Firebase manquant pour la requête des repas planifiés. Veuillez vérifier la console Firebase.");
                 console.log("Index manquant probable pour la collection 'mealPlans' sur les champs 'userId', 'date', 'prepared'.");
            }
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    const renderShoppingListItem = ({ item }) => (
        <View style={styles.shoppingListItem}>
            <Text style={styles.shoppingItemName}>{item.name}</Text>
            <Text style={styles.shoppingItemQuantity}>{item.quantity} {item.unit}</Text>
        </View>
    );

    const renderShoppingListCategory = ({ item: category }) => (
        <View style={styles.shoppingListCategorySection}>
            <Text style={styles.shoppingListCategoryTitle}>{category}</Text>
            <FlatList
                data={shoppingList[category]}
                renderItem={renderShoppingListItem}
                keyExtractor={(item, index) => `${item.name}_${index}`}
                scrollEnabled={false}
            />
        </View>
    );

    return (
        <ScrollView style={styles.contentView}> {/* Use ScrollView for the whole shopping list section */}
            <View style={styles.dateRangeContainer}>
                <View style={styles.datePickerGroup}>
                    <Text style={styles.dateLabel}>Du:</Text>
                    <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.dateButton}>
                        <Text style={styles.dateButtonText}>{moment(startDate).format('DD/MM/YYYY')}</Text>
                    </TouchableOpacity>
                    {showStartDatePicker && (
                        <DateTimePicker value={startDate} mode="date" display="default" onChange={handleStartDateChange} />
                    )}
                </View>
                <View style={styles.datePickerGroup}>
                    <Text style={styles.dateLabel}>Au:</Text>
                    <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={styles.dateButton}>
                        <Text style={styles.dateButtonText}>{moment(endDate).format('DD/MM/YYYY')}</Text>
                    </TouchableOpacity>
                    {showEndDatePicker && (
                        <DateTimePicker value={endDate} mode="date" display="default" onChange={handleEndDateChange} minimumDate={startDate} />
                    )}
                </View>
            </View>

            <TouchableOpacity
                style={[styles.generateButton, loading && styles.generateButtonDisabled]}
                onPress={generateShoppingList}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.generateButtonText}><FontAwesome name="list-alt" /> Générer la Liste</Text>
                )}
            </TouchableOpacity>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {Object.keys(shoppingList).length > 0 && (
                <FlatList
                    data={Object.keys(shoppingList)}
                    renderItem={renderShoppingListCategory}
                    keyExtractor={(category) => category}
                    ListHeaderComponent={<Text style={styles.shoppingListTitle}>Liste de Courses</Text>}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    scrollEnabled={false} // Disable scroll as parent is ScrollView
                />
            )}
            {Object.keys(shoppingList).length === 0 && !loading && !error && (
                 <Text style={styles.infoText}>Aucun ingrédient nécessaire pour la période sélectionnée ou la liste n'a pas encore été générée.</Text>
            )}
        </ScrollView>
    );
}

// --- Main Screen Component (InventoryScreen) ---
function InventoryScreen() {
    const [activeView, setActiveView] = useState('stock'); // 'stock' or 'shoppingList'

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.headerContainer}>
                <FontAwesome name={activeView === 'stock' ? "cubes" : "shopping-cart"} size={32} color={styles.ACCENT_RED} />
                <Text style={styles.title}>{activeView === 'stock' ? 'Gestion du Stock' : 'Liste de Courses'}</Text>
            </View>

            <View style={styles.viewToggleContainer}>
                <TouchableOpacity
                    style={[styles.toggleButton, activeView === 'stock' && styles.activeToggleButton]}
                    onPress={() => setActiveView('stock')}
                >
                    <FontAwesome name="cubes" size={16} color={activeView === 'stock' ? '#fff' : styles.ACCENT_GREEN} style={styles.toggleIcon} />
                    <Text style={[styles.toggleButtonText, activeView === 'stock' && styles.activeToggleButtonText]}>Mon Stock</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleButton, activeView === 'shoppingList' && styles.activeToggleButton]}
                    onPress={() => setActiveView('shoppingList')}
                >
                    <FontAwesome name="list-alt" size={16} color={activeView === 'shoppingList' ? '#fff' : styles.ACCENT_GREEN} style={styles.toggleIcon} />
                    <Text style={[styles.toggleButtonText, activeView === 'shoppingList' && styles.activeToggleButtonText]}>Liste de Courses</Text>
                </TouchableOpacity>
            </View>

            {activeView === 'stock' ? <StockManagementView /> : <ShoppingListView />}
        </SafeAreaView>
    );
}

// --- Styles --- (Consolidated and refined)
const styles = StyleSheet.create({
    // --- Palette ---
    ACCENT_GREEN: '#007A5E',
    ACCENT_RED: '#CE1126',
    ACCENT_YELLOW: '#FCD116',
    ACCENT_YELLOW_DARK: '#b08f0a', // For low stock warning
    BACKGROUND_PRIMARY: '#FFFFFF',
    SCREEN_BACKGROUND: '#EEF7F4',
    BORDER_LIGHT: '#E0E0E0',
    BORDER_MEDIUM: '#C0C0C0',
    TEXT_PRIMARY: '#333333',
    TEXT_SECONDARY: '#666666',
    TEXT_WHITE: '#FFFFFF',
    TEXT_ERROR: '#CE1126',
    TEXT_PLACEHOLDER: '#A0A0A0',
    ITEM_OUT_OF_STOCK_BG: '#F8D7DA',
    ITEM_LOW_STOCK_BG: '#FFF3CD',

    // --- Screen Layout ---
    safeArea: {
        flex: 1,
        backgroundColor: '#EEF7F4', // SCREEN_BACKGROUND
        paddingTop: Platform.OS === 'android' ? 30 : 0,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        marginBottom: 15,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginLeft: 15,
        color: '#333333', // TEXT_PRIMARY
    },
    viewToggleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
        backgroundColor: '#FFFFFF', // BACKGROUND_PRIMARY
        borderRadius: 12,
        padding: 6,
        marginHorizontal: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        marginHorizontal: 3,
        borderWidth: 1,
        borderColor: '#E0E0E0', // BORDER_LIGHT
    },
    activeToggleButton: {
        backgroundColor: '#007A5E', // ACCENT_GREEN
        borderColor: '#007A5E',
    },
    toggleIcon: {
        marginRight: 8,
    },
    toggleButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#666666', // TEXT_SECONDARY
    },
    activeToggleButtonText: {
        color: '#FFFFFF', // TEXT_WHITE
    },
    contentView: {
        flex: 1,
        paddingHorizontal: 15,
    },
    listContentContainer: {
        paddingBottom: 20,
    },
    infoText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#666666', // TEXT_SECONDARY
        fontSize: 14,
        paddingHorizontal: 15,
    },
    errorText: {
        color: '#CE1126', // TEXT_ERROR
        textAlign: 'center',
        marginVertical: 10,
        fontSize: 14,
        padding: 10,
        backgroundColor: '#F8D7DA',
        borderColor: '#f5c6cb',
        borderWidth: 1,
        borderRadius: 5,
        marginHorizontal: 10,
    },

    // --- Stock View Specific ---
    searchAddContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#C0C0C0', // BORDER_MEDIUM
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: '#FFFFFF', // BACKGROUND_PRIMARY
        marginRight: 10,
        color: '#333333', // TEXT_PRIMARY
    },
    addButton: {
        backgroundColor: '#007A5E', // ACCENT_GREEN
        padding: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    categorySection: {
        marginBottom: 15,
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007A5E', // ACCENT_GREEN
        marginBottom: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0', // BORDER_LIGHT
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF', // BACKGROUND_PRIMARY
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 6,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0', // BORDER_LIGHT
    },
    itemOutOfStock: {
        backgroundColor: '#F8D7DA', // ITEM_OUT_OF_STOCK_BG
        borderColor: '#f5c6cb',
    },
    itemLowStock: {
        backgroundColor: '#FFF3CD', // ITEM_LOW_STOCK_BG
        borderColor: '#ffeeba',
    },
    statusIcon: {
        marginRight: 10,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333333', // TEXT_PRIMARY
    },
    itemNameOutOfStock: {
        textDecorationLine: 'line-through',
        color: '#666666', // TEXT_SECONDARY
    },
    itemQuantity: {
        fontSize: 14,
        color: '#666666', // TEXT_SECONDARY
        marginTop: 2,
    },
    itemQuantityOutOfStock: {
        color: '#CE1126', // TEXT_ERROR
        fontWeight: 'bold',
    },
    itemQuantityLowStock: {
        color: '#b08f0a', // ACCENT_YELLOW_DARK
        fontWeight: 'bold',
    },
    itemActions: {
        flexDirection: 'row',
    },
    actionButton: {
        padding: 8,
        marginLeft: 10,
    },

    // --- Modal Styles ---
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '90%',
        backgroundColor: '#FFFFFF', // BACKGROUND_PRIMARY
        borderRadius: 10,
        padding: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333333', // TEXT_PRIMARY
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#C0C0C0', // BORDER_MEDIUM
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 15,
        backgroundColor: '#FFFFFF',
        color: '#333333', // TEXT_PRIMARY
    },
    modalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalInputHalf: {
        width: '48%',
    },
    pickerContainerModal: {
        borderWidth: 1,
        borderColor: '#C0C0C0', // BORDER_MEDIUM
        borderRadius: 8,
        marginBottom: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
    },
    pickerStyleModal: {
        width: '100%',
        height: Platform.OS === 'ios' ? undefined : 50,
        color: '#333333', // **Couleur pour valeur sélectionnée ET options Android**
    },
    // *** Style spécifique pour les options du Picker (surtout iOS) ***
    pickerItemStyleModal: {
        color: '#333333', // **Couleur explicite pour les options sur iOS**
        // height: 120, // Décommenter si texte coupé sur iOS
        // fontSize: 16 // Ajuster si besoin
    },
    modalButtonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },

    // --- Shopping List View Specific ---
    dateRangeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 15,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        paddingHorizontal: 10,
        elevation: 2,
    },
    datePickerGroup: {
        alignItems: 'center',
    },
    dateLabel: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 5,
    },
    dateButton: {
        borderWidth: 1,
        borderColor: '#C0C0C0',
        borderRadius: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f8f9fa',
    },
    dateButtonText: {
        fontSize: 15,
        color: '#333333',
    },
    generateButton: {
        backgroundColor: '#007A5E', // ACCENT_GREEN
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
        elevation: 2,
    },
    generateButtonDisabled: {
        backgroundColor: '#a1a1a1',
    },
    generateButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    shoppingListTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
        textAlign: 'center',
        marginVertical: 15,
    },
    shoppingListCategorySection: {
        marginBottom: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 12,
        elevation: 1,
    },
    shoppingListCategoryTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#007A5E',
        marginBottom: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    shoppingListItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    shoppingItemName: {
        fontSize: 15,
        color: '#333333',
        flex: 1, // Allow text wrapping
        marginRight: 10,
    },
    shoppingItemQuantity: {
        fontSize: 15,
        color: '#666666',
        fontWeight: '500',
    },
});

export default InventoryScreen;

