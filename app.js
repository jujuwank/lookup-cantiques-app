let cantiques = [];

fetch("data.json")
  .then(response => response.json())
  .then(data => {
    cantiques = data;
  })
  .catch(error => {
    document.getElementById("resultat").innerHTML =
      '<p class="erreur">Erreur : impossible de charger les données.</p>';
  });

const input = document.getElementById("numeroInput");
const resultat = document.getElementById("resultat");

input.addEventListener("input", () => {
  const numero = input.value.trim();

  if (numero === "") {
    resultat.innerHTML = '<p class="empty">Aucun cantique sélectionné.</p>';
    return;
  }

  const cantique = cantiques.find(item => String(item.numero) === numero);

  if (cantique) {
    resultat.innerHTML = `
      <div class="numero">Cantique N° ${cantique.numero}</div>
      <div class="titre">${cantique.titre}</div>
      <div class="texte">${cantique.texte.replace(/\\n/g, "\n")}</div>
    `;
  } else {
    resultat.innerHTML = '<p class="erreur">Aucun cantique trouvé avec ce numéro.</p>';
  }
});
