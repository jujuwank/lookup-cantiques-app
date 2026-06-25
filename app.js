
const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT8XpYXfs_ilNG9AX7FqjCQkR-_b4k3DhZaY0n8m_7HO8HZfESSnxvhasnV4-Vk-PF8XscgIcFSXjXQ/pub?gid=643246372&single=true&output=csv";

const input = document.getElementById("numeroInput");
input.focus();
const resultat = document.getElementById("resultat");

let cantiques = [];
let indexCantiques = {};

Papa.parse(sheetUrl, {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: function (results) {
    cantiques = results.data;cantiques.forEach(c => {
        indexCantiques[String(c.Numero).trim()] = c;
    });

    console.log(indexCantiques);
  },
});

input.addEventListener("input", () => {
  const numeroRecherche = input.value.trim();

  if (numeroRecherche === "") {
    resultat.innerHTML = `<p class="empty">Aucun cantique sélectionné.</p>`;
    return;
  }

  const cantique = indexCantiques[numeroRecherche];

  if (!cantique) {
    resultat.innerHTML = `<p class="not-found">Aucun cantique trouvé pour le numéro ${numeroRecherche}.</p>`;
    return;
  }

  resultat.innerHTML = `
  <div class="chant-header">
    <div class="chant-number">N° ${cantique.Numero}</div>
    <h2 class="chant-title">${cantique.Titre}</h2>
  </div>

  <div class="paroles">
    ${cantique.Paroles}
  </div>
`;
});


// --------- Pour faire un thème clair --------
const themeToggle = document.getElementById("themeToggle");

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light");

  if (document.body.classList.contains("light")) {
    themeToggle.textContent = "Mode sombre";
  } else {
    themeToggle.textContent = "Mode clair";
  }
});

// ====== animation d'ouverture ======

window.addEventListener("load", () => {
  const splashScreen = document.getElementById("splashScreen");

  setTimeout(() => {
    splashScreen.classList.add("hide");
  }, 2500);
});



