/*==========================================================
    1. CONFIGURATION DE L'APPLICATION
==========================================================*/
const CONFIG = {
  // Lien CSV publié depuis Google Sheets
  SHEET_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT8XpYXfs_ilNG9AX7FqjCQkR-_b4k3DhZaY0n8m_7HO8HZfESSnxvhasnV4-Vk-PF8XscgIcFSXjXQ/pub?gid=927367449&single=true&output=csv",

  // Clé utilisée pour sauvegarder le thème dans le navigateur
  THEME_STORAGE_KEY: "lookup-cantiques-theme",

  // Temps avant l'ouverture automatique d'un chant après arrêt de la saisie
  AUTO_OPEN_DELAY: 1500,

  // Nombre de chants visibles dans la liste avant défilement
  MAX_VISIBLE_SONGS: 8,

  // Durée des animations principales
  ANIMATION_DURATION: 300,

  // Nombre maximal de résultats affichés dans la liste
  MAX_SEARCH_RESULTS: 500,

  // Active/désactive la recherche tolérante aux petites fautes
  FUZZY_SEARCH: true,
};

/* =====================================================
   2. ELEMENTS HTML
===================================================== */
const input = document.getElementById("numeroInput");
const listeCantiques = document.getElementById("listeCantiques");
const resultat = document.getElementById("resultat");
const themeToggle = document.getElementById("themeToggle");
const splashScreen = document.getElementById("splashScreen");

/* =====================================================
   3. ETAT DE L'APPLICATION
===================================================== */
let indexCantiques = {};
let listeCompleteCantiques = [];
let donneesChargees = false;
let minuterieRecherche = null;

/* =====================================================
   4. OUTILS UTILITAIRES
===================================================== */
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normaliserNumero(value) {
  return String(value ?? "").trim();
}

function normaliserTexte(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function calculerDistanceLevenshtein(a, b) {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  const lignePrecedente = Array.from({ length: b.length + 1 }, (_, index) => index);
  const ligneCourante = new Array(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    ligneCourante[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const cout = a[i - 1] === b[j - 1] ? 0 : 1;
      ligneCourante[j] = Math.min(
        ligneCourante[j - 1] + 1,
        lignePrecedente[j] + 1,
        lignePrecedente[j - 1] + cout
      );
    }

    lignePrecedente.splice(0, lignePrecedente.length, ...ligneCourante);
  }

  return lignePrecedente[b.length];
}

function correspondanceApproximative(texte, recherche) {
  const texteNormalise = normaliserTexte(texte);
  const rechercheNormalisee = normaliserTexte(recherche);

  if (!rechercheNormalisee) return true;
  if (texteNormalise.startsWith(rechercheNormalisee)) return true;
  if (texteNormalise.includes(rechercheNormalisee)) return true;

  if (!CONFIG.FUZZY_SEARCH) return false;

  const mots = texteNormalise.split(" ").filter(Boolean);
  const tolerance = Math.max(1, Math.floor(rechercheNormalisee.length * 0.3));

  return mots.some((mot) => {
    if (mot.startsWith(rechercheNormalisee)) return true;

    const morceauComparable = mot.slice(0, rechercheNormalisee.length);
    return calculerDistanceLevenshtein(morceauComparable, rechercheNormalisee) <= tolerance;
  });
}

function comparerNumeros(a, b) {
  const numeroA = Number(a.numero);
  const numeroB = Number(b.numero);

  if (!Number.isNaN(numeroA) && !Number.isNaN(numeroB)) {
    return numeroA - numeroB;
  }

  return a.numero.localeCompare(b.numero, "fr", { numeric: true });
}

function afficherMessage(message, className = "empty") {
  resultat.innerHTML = `<p class="${className}">${escapeHtml(message)}</p>`;
}

function afficherMessageListe(message) {
  listeCantiques.innerHTML = `<p class="liste-message">${escapeHtml(message)}</p>`;
}

function afficherListe() {
  listeCantiques.classList.remove("liste-cachee");
}

function masquerListe() {
  listeCantiques.classList.add("liste-cachee");
}

/* =====================================================
   5. CHARGEMENT DES CANTIQUES DEPUIS GOOGLE SHEETS
===================================================== */
function chargerCantiques() {
  Papa.parse(CONFIG.SHEET_URL, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      listeCompleteCantiques = creerListeCantiques(results.data);
      indexCantiques = creerIndexCantiques(listeCompleteCantiques);
      donneesChargees = true;

      afficherListeCantiques();
      afficherMessage("Aucun cantique sélectionné.");
    },
    error: () => {
      donneesChargees = false;
      afficherMessageListe("Impossible de charger la liste des cantiques.");
      afficherMessage("Impossible de charger les cantiques. Vérifiez la connexion ou le lien Google Sheets.", "error");
    },
  });
}

function creerListeCantiques(cantiques) {
  const cantiquesUniques = new Map();

  cantiques.forEach((cantique) => {
    const numero = normaliserNumero(cantique.Numero || cantique.numero);

    if (!numero || cantiquesUniques.has(numero)) return;

    cantiquesUniques.set(numero, {
      numero,
      titre: cantique.Titre || cantique.titre || "Sans titre",
      paroles: cantique.Paroles || cantique.paroles || cantique.Texte || cantique.texte || "",
    });
  });

  return Array.from(cantiquesUniques.values()).sort(comparerNumeros);
}

function creerIndexCantiques(cantiques) {
  return cantiques.reduce((index, cantique) => {
    index[cantique.numero] = cantique;
    return index;
  }, {});
}

/* =====================================================
   6. LISTE DYNAMIQUE DES CANTIQUES
===================================================== */
function filtrerCantiques(recherche) {
  const rechercheNormalisee = normaliserNumero(recherche);

  if (rechercheNormalisee === "") {
    return listeCompleteCantiques;
  }

  return listeCompleteCantiques.filter((cantique) =>
    cantique.numero.startsWith(rechercheNormalisee) ||
    correspondanceApproximative(cantique.titre, rechercheNormalisee)
  );
}

function afficherListeCantiques() {
  const recherche = normaliserNumero(input.value);

  if (!donneesChargees) {
    afficherMessageListe("Chargement de la liste...");
    return;
  }

  const cantiquesFiltres = filtrerCantiques(recherche).slice(0, CONFIG.MAX_SEARCH_RESULTS);

  if (cantiquesFiltres.length === 0) {
    afficherListe();
    afficherMessageListe(`Aucun cantique ne correspond à « ${recherche} ».`);
    return;
  }

  listeCantiques.innerHTML = `
    <div class="liste-items">
      ${cantiquesFiltres.map((cantique) => `
        <button class="chant-item" type="button" data-numero="${escapeHtml(cantique.numero)}">
          <span class="chant-item-numero">${escapeHtml(cantique.numero)}</span>
          <span class="chant-item-separateur">-</span>
          <span class="chant-item-titre">${escapeHtml(cantique.titre)}</span>
        </button>
      `).join("")}
    </div>
  `;

  afficherListe();
}

function selectionnerCantiqueDepuisListe(numero) {
  input.value = numero;
  afficherCantique(numero);
  masquerListe();
}

/* =====================================================
   7. RECHERCHE ET AFFICHAGE D'UN CANTIQUE
===================================================== */
function afficherCantique(numeroRecherche = normaliserNumero(input.value)) {
  if (!donneesChargees) {
    afficherMessage("Chargement des cantiques...");
    return;
  }

  if (numeroRecherche === "") {
    afficherMessage("Aucun cantique sélectionné.");
    afficherListeCantiques();
    return;
  }

  const cantique = indexCantiques[numeroRecherche] || filtrerCantiques(numeroRecherche)[0];

  if (!cantique) {
    afficherMessage(`Aucun cantique trouvé pour « ${numeroRecherche} ».`, "not-found");
    masquerListe();
    return;
  }

  resultat.innerHTML = `
    <div class="chant-header">
      <div class="chant-number">N° ${escapeHtml(cantique.numero)}</div>
      <h2 class="chant-title">${escapeHtml(cantique.titre)}</h2>
    </div>

    <div class="paroles">${escapeHtml(cantique.paroles)}</div>
  `;

  masquerListe();
}

function gererSaisieRecherche() {
  window.clearTimeout(minuterieRecherche);

  afficherListeCantiques();

  const numeroRecherche = normaliserNumero(input.value);

  if (numeroRecherche === "") {
    afficherMessage("Aucun cantique sélectionné.");
    return;
  }

  minuterieRecherche = window.setTimeout(() => {
    afficherCantique(numeroRecherche);
  }, CONFIG.AUTO_OPEN_DELAY);
}

/* =====================================================
   8. THEME CLAIR / SOMBRE
===================================================== */
function appliquerTheme(theme) {
  const modeClair = theme === "light";

  document.body.classList.toggle("light", modeClair);
  themeToggle.textContent = modeClair ? "Mode sombre" : "Mode clair";
  localStorage.setItem(CONFIG.THEME_STORAGE_KEY, modeClair ? "light" : "dark");
}

function initialiserTheme() {
  const themeSauvegarde = localStorage.getItem(CONFIG.THEME_STORAGE_KEY) || "dark";
  appliquerTheme(themeSauvegarde);
}

function basculerTheme() {
  const themeActuel = document.body.classList.contains("light") ? "light" : "dark";
  appliquerTheme(themeActuel === "light" ? "dark" : "light");
}

/* =====================================================
   9. ECRAN D'OUVERTURE
===================================================== */
function masquerSplashScreen() {
  window.setTimeout(() => {
    splashScreen.classList.add("hide");
  }, 1800);
}

/* =====================================================
   10. EVENEMENTS
===================================================== */
function initialiserEvenements() {
  input.addEventListener("input", gererSaisieRecherche);

  listeCantiques.addEventListener("click", (event) => {
    const boutonCantique = event.target.closest(".chant-item");

    if (!boutonCantique) return;

    selectionnerCantiqueDepuisListe(boutonCantique.dataset.numero);
  });

  themeToggle.addEventListener("click", basculerTheme);
}

/* =====================================================
   11. INITIALISATION
===================================================== */
function appliquerConfiguration() {
  document.documentElement.style.setProperty("--nb-chants-visibles", CONFIG.MAX_VISIBLE_SONGS);
  document.documentElement.style.setProperty("--animation-duration", `${CONFIG.ANIMATION_DURATION}ms`);
}

function initialiserApplication() {
  appliquerConfiguration();
  initialiserTheme();
  initialiserEvenements();
  chargerCantiques();
  masquerSplashScreen();

  input.focus();
}

initialiserApplication();
