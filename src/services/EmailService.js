// src/services/EmailService.js
import * as MailComposer from 'expo-mail-composer';
import { db } from '../config/firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

// --- Fonctions de récupération de données (inchangées) ---
const fetchPlanningData = async (startDate = null, endDate = null) => {
  try {
    const start = startDate || moment().startOf('week').format('YYYY-MM-DD');
    const end = endDate || moment().endOf('week').format('YYYY-MM-DD');
    const mealPlansRef = collection(db, 'mealPlans');
    const q = query(
      mealPlansRef,
      where('date', '>=', start),
      where('date', '<=', end)
    );
    const snapshot = await getDocs(q);
    const mealPlans = [];
    for (const docSnap of snapshot.docs) {
      const plan = { id: docSnap.id, ...docSnap.data() };
      if (plan.dishId) {
        const dishDoc = await getDoc(doc(db, 'dishes', plan.dishId));
        if (dishDoc.exists()) {
          plan.dish = { id: dishDoc.id, ...dishDoc.data() };
        }
      }
      mealPlans.push(plan);
    }
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

const fetchStockData = async () => {
  try {
    const stockRef = collection(db, 'userStock');
    const snapshot = await getDocs(stockRef);
    const stockItems = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
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

const fetchShoppingListData = async () => {
  try {
    const stockRef = collection(db, 'userStock');
    const snapshot = await getDocs(stockRef);
    const shoppingItems = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(item => item.quantity <= 1) 
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

// --- Fonctions de formatage HTML (inchangées) ---
const formatPlanningToHtml = (planningData) => {
  if (!planningData || planningData.length === 0) {
    return '<p>Aucun repas planifié pour cette période.</p>';
  }
  const plansByDate = {};
  planningData.forEach(plan => {
    const dateStr = plan.date;
    if (!plansByDate[dateStr]) {
      plansByDate[dateStr] = [];
    }
    plansByDate[dateStr].push(plan);
  });
  let html = '<h2>Planning des Repas</h2>';
  Object.keys(plansByDate).sort().forEach(dateStr => {
    const formattedDate = moment(dateStr).format('dddd DD MMMM YYYY');
    html += `<h3>${formattedDate}</h3>`;
    html += '<ul>';
    plansByDate[dateStr].forEach(plan => {
      const dishName = plan.dish ? plan.dish.name : 'Plat non spécifié';
      const preparedStatus = plan.prepared ? ' (Préparé)' : '';
      html += `<li><strong>${plan.mealType}:</strong> ${dishName} - ${plan.servingsPlanned} portions${preparedStatus}</li>`;
    });
    html += '</ul>';
  });
  return html;
};

const formatStockToHtml = (stockData) => {
  if (!stockData || stockData.length === 0) {
    return '<p>Aucun élément en stock.</p>';
  }
  const stockByCategory = {};
  stockData.forEach(item => {
    const category = item.category || 'Autres';
    if (!stockByCategory[category]) {
      stockByCategory[category] = [];
    }
    stockByCategory[category].push(item);
  });
  let html = '<h2>État du Stock</h2>';
  Object.keys(stockByCategory).sort().forEach(category => {
    html += `<h3>${category}</h3>`;
    html += '<ul>';
    stockByCategory[category].forEach(item => {
      const quantity = item.quantity || 0;
      const status = quantity <= 0 ? ' <span class="status-epuise">(Épuisé)</span>' : 
                     quantity <= 1 ? ' <span class="status-stock-bas">(Stock bas)</span>' : '';
      html += `<li><strong>${item.name}:</strong> ${quantity} ${item.unit}${status}</li>`;
    });
    html += '</ul>';
  });
  return html;
};

const formatShoppingListToHtml = (shoppingListData) => {
  if (!shoppingListData || shoppingListData.length === 0) {
    return '<p>Aucun élément dans la liste de courses.</p>';
  }
  const itemsByCategory = {};
  shoppingListData.forEach(item => {
    const category = item.category || 'Autres';
    if (!itemsByCategory[category]) {
      itemsByCategory[category] = [];
    }
    itemsByCategory[category].push(item);
  });
  let html = '<h2>Liste de Courses</h2>';
  Object.keys(itemsByCategory).sort().forEach(category => {
    html += `<h3>${category}</h3>`;
    html += '<ul>';
    itemsByCategory[category].forEach(item => {
      const quantity = item.quantity || 0;
      const status = quantity <= 0 ? ' (À acheter)' : ' (À compléter)';
      html += `<li><strong>${item.name}:</strong> ${item.unit}${status}</li>`;
    });
    html += '</ul>';
  });
  return html;
};

// --- NOUVELLES Fonctions de formatage Texte Brut ---
const formatPlanningToText = (planningData) => {
  if (!planningData || planningData.length === 0) {
    return 'Aucun repas planifié pour cette période.\n\n';
  }
  const plansByDate = {};
  planningData.forEach(plan => {
    const dateStr = plan.date;
    if (!plansByDate[dateStr]) {
      plansByDate[dateStr] = [];
    }
    plansByDate[dateStr].push(plan);
  });
  let text = 'PLANNING DES REPAS\n';
  text += '-------------------\n';
  Object.keys(plansByDate).sort().forEach(dateStr => {
    const formattedDate = moment(dateStr).format('dddd DD MMMM YYYY');
    text += `\n${formattedDate.toUpperCase()}\n`;
    plansByDate[dateStr].forEach(plan => {
      const dishName = plan.dish ? plan.dish.name : 'Plat non spécifié';
      const preparedStatus = plan.prepared ? ' (Préparé)' : '';
      text += `- ${plan.mealType}: ${dishName} - ${plan.servingsPlanned} portions${preparedStatus}\n`;
    });
  });
  text += '\n';
  return text;
};

const formatStockToText = (stockData) => {
  if (!stockData || stockData.length === 0) {
    return 'Aucun élément en stock.\n\n';
  }
  const stockByCategory = {};
  stockData.forEach(item => {
    const category = item.category || 'Autres';
    if (!stockByCategory[category]) {
      stockByCategory[category] = [];
    }
    stockByCategory[category].push(item);
  });
  let text = 'ÉTAT DU STOCK\n';
  text += '-------------\n';
  Object.keys(stockByCategory).sort().forEach(category => {
    text += `\n${category.toUpperCase()}\n`;
    stockByCategory[category].forEach(item => {
      const quantity = item.quantity || 0;
      const status = quantity <= 0 ? ' (Épuisé)' : 
                    quantity <= 1 ? ' (Stock bas)' : '';
      text += `- ${item.name}: ${quantity} ${item.unit}${status}\n`;
    });
  });
  text += '\n';
  return text;
};

const formatShoppingListToText = (shoppingListData) => {
  if (!shoppingListData || shoppingListData.length === 0) {
    return 'Aucun élément dans la liste de courses.\n\n';
  }
  const itemsByCategory = {};
  shoppingListData.forEach(item => {
    const category = item.category || 'Autres';
    if (!itemsByCategory[category]) {
      itemsByCategory[category] = [];
    }
    itemsByCategory[category].push(item);
  });
  let text = 'LISTE DE COURSES\n';
  text += '----------------\n';
  Object.keys(itemsByCategory).sort().forEach(category => {
    text += `\n${category.toUpperCase()}\n`;
    itemsByCategory[category].forEach(item => {
      const quantity = item.quantity || 0;
      const status = quantity <= 0 ? ' (À acheter)' : ' (À compléter)';
      text += `- ${item.name}: ${item.unit}${status}\n`; 
    });
  });
  text += '\n';
  return text;
};

// --- Fonction principale sendEmail MODIFIÉE ---
const sendEmail = async (recipients, includePlanning, includeStock, includeShoppingList) => {
  try {
    let planningHtml = '';
    let stockHtml = '';
    let shoppingListHtml = '';

    let planningText = '';
    let stockText = '';
    let shoppingListText = '';

    if (includePlanning) {
      const planningData = await fetchPlanningData();
      planningHtml = formatPlanningToHtml(planningData);
      planningText = formatPlanningToText(planningData);
    }
    
    if (includeStock) {
      const stockData = await fetchStockData();
      stockHtml = formatStockToHtml(stockData);
      stockText = formatStockToText(stockData);
    }
    
    if (includeShoppingList) {
      const shoppingListData = await fetchShoppingListData();
      shoppingListHtml = formatShoppingListToHtml(shoppingListData);
      shoppingListText = formatShoppingListToText(shoppingListData);
    }
    
  const emailContentHtml = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Planif-Tchop - Mise à jour</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        color: #333333;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 0 15px rgba(0,0,0,0.1);
      }
      .header {
        background-color: #007A5E; /* Vert Planif-Tchop */
        color: #ffffff;
        padding: 25px 20px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: bold;
      }
      .content {
        padding: 25px 30px;
      }
      .content h2 {
        color: #007A5E;
        font-size: 22px;
        margin-top: 0;
        border-bottom: 2px solid #eeeeee;
        padding-bottom: 10px;
        margin-bottom: 20px;
      }
      .content h3 {
        color: #333333;
        font-size: 18px;
        margin-top: 25px;
        margin-bottom: 10px;
      }
      ul {
        list-style-type: none;
        padding-left: 0;
      }
      li {
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
      }
      li:last-child {
        border-bottom: none;
      }
      .status-epuise {
        color: #CE1126; /* Rouge Planif-Tchop */
        font-weight: bold;
      }
      .status-stock-bas {
        color: #FCD116; /* Jaune Planif-Tchop */
        font-weight: bold;
      }
      .footer {
        background-color: #eeeeee;
        color: #777777;
        padding: 20px;
        text-align: center;
        font-size: 12px;
      }
      .footer a {
        color: #007A5E;
        text-decoration: none;
      }
      @media screen and (max-width: 600px) {
        .container {
          width: 100% !important;
          margin: 0 !important;
          border-radius: 0 !important;
        }
        .content {
          padding: 20px 15px !important;
        }
        .header h1 {
          font-size: 24px !important;
        }
        .content h2 {
          font-size: 20px !important;
        }
      }
    </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Planif-Tchop</h1>
        </div>
        <div class="content">
          <p>Bonjour,</p>
          <p>Voici les dernières informations de votre application Planif-Tchop :</p>
          
          ${includePlanning ? planningHtml : ''}
          ${includeStock ? stockHtml : ''}
          ${includeShoppingList ? shoppingListHtml : ''}
          
          <p style="margin-top: 30px;">Cordialement,</p>
          <p>L'équipe Planif-Tchop</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Planif-Tchop. Tous droits réservés.</p>
          <p><a href="#">Se désinscrire</a> | <a href="#">Visitez notre site</a></p>
        </div>
      </div>
    </body>
    </html>
    `;
    
    const emailContentText = `
Planif-Tchop - Mise à jour
=========================

Bonjour,

Voici les dernières informations de votre application Planif-Tchop :

${includePlanning ? planningText : 'Planning des repas non inclus.\n\n'}
${includeStock ? stockText : 'État du stock non inclus.\n\n'}
${includeShoppingList ? shoppingListText : 'Liste de courses non incluse.\n\n'}

Cordialement,
L'équipe Planif-Tchop
    `;

    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      return { 
        success: false, 
        message: "Aucune application de messagerie n'est disponible sur cet appareil." 
      };
    }

    // Envoie le contenu HTML dans body (pour la plupart des apps de messagerie)
    await MailComposer.composeAsync({
      recipients: recipients,
      subject: 'Planif-Tchop - Mise à jour',
      body: emailContentText, // Utilise le HTML ici
      // isHtml: true, // À retirer, non supporté officiellement
      // html: emailContentHtml // À retirer, non supporté
    });
    
    return { 
      success: true, 
      message: "L'application de messagerie a été ouverte avec le message préparé." 
    };

  } catch (error) {
    console.error("Erreur lors de la préparation de l'email:", error);
    return { 
      success: false, 
      message: `Erreur lors de la préparation de l'email: ${error.message}` 
    };
  }
};

export default {
  sendEmail,
  fetchPlanningData,
  fetchStockData,
  fetchShoppingListData,
  formatPlanningToHtml,
  formatStockToHtml,
  formatShoppingListToHtml,
  formatPlanningToText,
  formatStockToText,
  formatShoppingListToText
};