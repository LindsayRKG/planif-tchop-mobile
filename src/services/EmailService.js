import emailjs from '@emailjs/react-native';
import { db } from '../config/firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

// Constantes pour EmailJS
const SERVICE_ID = 'service_l3bq9cu'; // À remplacer par votre ID de service EmailJS
const TEMPLATE_ID = 'template_9ifyvat'; // À remplacer par votre ID de template EmailJS
const PUBLIC_KEY = 'LZwbSW9JAlr5p9t1Q'; // À remplacer par votre clé publique EmailJS

// Initialisation d'EmailJS
emailjs.init({
  publicKey: PUBLIC_KEY,
});

// Fonction pour récupérer les données du planning
const fetchPlanningData = async (startDate = null, endDate = null) => {
  try {
    // Si aucune date n'est spécifiée, utiliser la semaine en cours
    const start = startDate || moment().startOf('week').format('YYYY-MM-DD');
    const end = endDate || moment().endOf('week').format('YYYY-MM-DD');
    
    // Récupérer les plans de repas
    const mealPlansRef = collection(db, 'mealPlans');
    const q = query(
      mealPlansRef,
      where('date', '>=', start),
      where('date', '<=', end)
    );
    
    const snapshot = await getDocs(q);
    const mealPlans = [];
    
    // Pour chaque plan, récupérer les détails du plat associé
    for (const docSnap of snapshot.docs) {
      const plan = { id: docSnap.id, ...docSnap.data() };
      
      // Récupérer les détails du plat
      if (plan.dishId) {
        const dishDoc = await getDoc(doc(db, 'dishes', plan.dishId));
        if (dishDoc.exists()) {
          plan.dish = { id: dishDoc.id, ...dishDoc.data() };
        }
      }
      
      mealPlans.push(plan);
    }
    
    // Trier les plans par date et type de repas
    mealPlans.sort((a, b) => {
      const dateCompare = moment(a.date).diff(moment(b.date));
      if (dateCompare !== 0) return dateCompare;
      
      const mealTypeOrder = {
        'Petit-déjeuner': 0,
        'Brunch': 1,
        'Déjeuner': 2,
        'Collation': 3,
        'Dîner': 4
      };
      
      return (mealTypeOrder[a.mealType] || 99) - (mealTypeOrder[b.mealType] || 99);
    });
    
    return mealPlans;
  } catch (error) {
    console.error('Erreur lors de la récupération du planning:', error);
    throw error;
  }
};

// Fonction pour récupérer les données du stock
const fetchStockData = async () => {
  try {
    const stockRef = collection(db, 'userStock');
    const snapshot = await getDocs(stockRef);
    
    const stockItems = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Trier par catégorie puis par nom
    stockItems.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });
    
    return stockItems;
  } catch (error) {
    console.error('Erreur lors de la récupération du stock:', error);
    throw error;
  }
};

// Fonction pour récupérer la liste de courses
const fetchShoppingListData = async () => {
  try {
    // Cette fonction est simplifiée car la génération de la liste de courses
    // est complexe et dépend de plusieurs facteurs (stock, planning, etc.)
    // Dans une implémentation réelle, vous devriez utiliser la même logique
    // que celle utilisée dans l'écran ShoppingListView
    
    const stockRef = collection(db, 'userStock');
    const snapshot = await getDocs(stockRef);
    
    // Filtrer pour ne garder que les éléments en quantité faible ou nulle
    const shoppingItems = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(item => item.quantity <= 1) // Seuil de stock bas
      .sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.name.localeCompare(b.name);
      });
    
    return shoppingItems;
  } catch (error) {
    console.error('Erreur lors de la récupération de la liste de courses:', error);
    throw error;
  }
};

// Fonction pour formater les données du planning en HTML
const formatPlanningToHtml = (planningData) => {
  if (!planningData || planningData.length === 0) {
    return '<p>Aucun repas planifié pour cette période.</p>';
  }
  
  // Regrouper par date
  const plansByDate = {};
  planningData.forEach(plan => {
    const dateStr = plan.date;
    if (!plansByDate[dateStr]) {
      plansByDate[dateStr] = [];
    }
    plansByDate[dateStr].push(plan);
  });
  
  let html = '<h2>Planning des Repas</h2>';
  
  // Pour chaque date
  Object.keys(plansByDate).sort().forEach(dateStr => {
    const formattedDate = moment(dateStr).format('dddd DD MMMM YYYY');
    html += `<h3>${formattedDate}</h3>`;
    html += '<ul>';
    
    // Pour chaque repas de cette date
    plansByDate[dateStr].forEach(plan => {
      const dishName = plan.dish ? plan.dish.name : 'Plat non spécifié';
      const preparedStatus = plan.prepared ? ' (Préparé)' : '';
      html += `<li><strong>${plan.mealType}:</strong> ${dishName} - ${plan.servingsPlanned} portions${preparedStatus}</li>`;
    });
    
    html += '</ul>';
  });
  
  return html;
};

// Fonction pour formater les données du stock en HTML
const formatStockToHtml = (stockData) => {
  if (!stockData || stockData.length === 0) {
    return '<p>Aucun élément en stock.</p>';
  }
  
  // Regrouper par catégorie
  const stockByCategory = {};
  stockData.forEach(item => {
    const category = item.category || 'Autres';
    if (!stockByCategory[category]) {
      stockByCategory[category] = [];
    }
    stockByCategory[category].push(item);
  });
  
  let html = '<h2>État du Stock</h2>';
  
  // Pour chaque catégorie
  Object.keys(stockByCategory).sort().forEach(category => {
    html += `<h3>${category}</h3>`;
    html += '<ul>';
    
    // Pour chaque élément de cette catégorie
    stockByCategory[category].forEach(item => {
      const quantity = item.quantity || 0;
      const status = quantity <= 0 ? ' <span style="color: red;">(Épuisé)</span>' : 
                    quantity <= 1 ? ' <span style="color: orange;">(Stock bas)</span>' : '';
      
      html += `<li><strong>${item.name}:</strong> ${quantity} ${item.unit}${status}</li>`;
    });
    
    html += '</ul>';
  });
  
  return html;
};

// Fonction pour formater les données de la liste de courses en HTML
const formatShoppingListToHtml = (shoppingListData) => {
  if (!shoppingListData || shoppingListData.length === 0) {
    return '<p>Aucun élément dans la liste de courses.</p>';
  }
  
  // Regrouper par catégorie
  const itemsByCategory = {};
  shoppingListData.forEach(item => {
    const category = item.category || 'Autres';
    if (!itemsByCategory[category]) {
      itemsByCategory[category] = [];
    }
    itemsByCategory[category].push(item);
  });
  
  let html = '<h2>Liste de Courses</h2>';
  
  // Pour chaque catégorie
  Object.keys(itemsByCategory).sort().forEach(category => {
    html += `<h3>${category}</h3>`;
    html += '<ul>';
    
    // Pour chaque élément de cette catégorie
    itemsByCategory[category].forEach(item => {
      const quantity = item.quantity || 0;
      const status = quantity <= 0 ? ' (À acheter)' : ' (À compléter)';
      
      html += `<li><strong>${item.name}:</strong> ${item.unit}${status}</li>`;
    });
    
    html += '</ul>';
  });
  
  return html;
};

// Fonction principale pour envoyer un email
const sendEmail = async (recipients, includePlanning, includeStock, includeShoppingList) => {
  try {
    // Récupérer les données nécessaires
    let planningHtml = '';
    let stockHtml = '';
    let shoppingListHtml = '';
    
    if (includePlanning) {
      const planningData = await fetchPlanningData();
      planningHtml = formatPlanningToHtml(planningData);
    }
    
    if (includeStock) {
      const stockData = await fetchStockData();
      stockHtml = formatStockToHtml(stockData);
    }
    
    if (includeShoppingList) {
      const shoppingListData = await fetchShoppingListData();
      shoppingListHtml = formatShoppingListToHtml(shoppingListData);
    }
    
    // Construire le contenu de l'email
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h1 style="color: #007A5E;">Planif-Tchop - Mise à jour</h1>
        <p>Bonjour,</p>
        <p>Voici les dernières informations de votre application Planif-Tchop :</p>
        
        ${includePlanning ? planningHtml : ''}
        ${includeStock ? stockHtml : ''}
        ${includeShoppingList ? shoppingListHtml : ''}
        
        <p style="margin-top: 30px;">Cordialement,</p>
        <p>L'équipe Planif-Tchop</p>
      </div>
    `;
    
    // Envoyer l'email à chaque destinataire
    const sendPromises = recipients.map(email => {
      const templateParams = {
        to_email: email,
        subject: 'Planif-Tchop - Mise à jour',
        message: emailContent,
      };
      
      return emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
    });
    
    // Attendre que tous les emails soient envoyés
    await Promise.all(sendPromises);
    
    return { success: true, message: `${recipients.length} email(s) envoyé(s) avec succès.` };
  } catch (error) {
    console.error('Erreur lors de l\'envoi des emails:', error);
    return { success: false, message: `Erreur lors de l'envoi: ${error.message}` };
  }
};

export default {
  sendEmail,
  fetchPlanningData,
  fetchStockData,
  fetchShoppingListData,
};

