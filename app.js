/*const URL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vT8XpYXfs_ilNG9AX7FqjCQkR-_b4k3DhZaY0n8m_7HO8HZfESSnxvhasnV4-Vk-PF8XscgIcFSXjXQ/pub?gid=643246372&single=true&output=csv";
*/

const URL = 
"https://docs.google.com/spreadsheets/d/e/2PACX-1vT8XpYXfs_ilNG9AX7FqjCQkR-_b4k3DhZaY0n8m_7HO8HZfESSnxvhasnV4-Vk-PF8XscgIcFSXjXQ/pub?gid=643246372&single=true&output=csv";

let cantiques = [];

const input = document.getElementById("numeroInput");
const resultat = document.getElementById("resultat");

Papa.parse(URL, {
  download: true,
  header: true,
  skipEmptyLines: true,

  complete: function(results) {
    cantiques = results.data;
    console.log("Cantiques chargés :", cantiques);
  },

  error: function(error) {
    console.error("Erreur :", error);
    resultat.innerHTML = '<p class="erreur">Impossible de charger les données Google Sheets.</p>';
  }
});

input.addEventListener("input", () => {
  const numero = input.value.trim();

  if (numero === "") {
    resultat.innerHTML = '<p class="empty">Aucun cantique sélectionné.</p>';
    return;
  }

  const cantique = cantiques.find(
    item => String(item.numero).trim() === numero
  );

  if (cantique) {
    resultat.innerHTML = `
      <div class="numero">Cantique N° ${cantique.numero}</div>
      <div class="titre">${cantique.titre}</div>
      <div class="texte">${cantique.paroles}</div>
    `;
  } else {
    resultat.innerHTML = '<p class="erreur">Aucun cantique trouvé avec ce numéro.</p>';
  }
});