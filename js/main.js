/* Carrefour Animaux — maquette interne */

(function () {
  "use strict";

  // Mémorise l'animal choisi d'une page à l'autre (facultatif : fonctionne sans stockage)
  var STORAGE_KEY = "ca-pet";
  function loadPet() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function savePet(pet) {
    try { localStorage.setItem(STORAGE_KEY, pet); } catch (e) { /* stockage indisponible */ }
  }

  function setPressed(chips, pet) {
    chips.forEach(function (c) {
      c.setAttribute("aria-pressed", String(c.dataset.pet === pet));
    });
  }

  // ---------- Menu mobile ----------
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  // ---------- Liens vers les pages pas encore maquettées ----------
  document.querySelectorAll("[data-soon]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      alert("Cette page sera maquettée dans une prochaine étape.");
    });
  });

  // ---------- Accueil : sélecteur d'animal ----------
  var HINTS = {
    chien: "Pour votre chien : alimentation adaptée à sa taille, mutuelle, promenade et éducation.",
    chat: "Pour votre chat : alimentation stérilisé, vaccins, garde à domicile et idées pour l'occuper.",
    nac: "Pour votre nouvel animal de compagnie : foin et granulés, installation, soins et conseils par espèce."
  };
  var LABELS = { chien: "votre chien", chat: "votre chat", nac: "votre nouvel animal de compagnie" };

  var picker = document.querySelector(".pet-picker");
  if (picker) {
    var chips = Array.prototype.slice.call(picker.querySelectorAll(".chip"));
    var hint = document.getElementById("pet-hint");
    var articles = Array.prototype.slice.call(document.querySelectorAll("#articles .article"));
    var title = document.getElementById("conseils-title");

    var applyHome = function (pet) {
      setPressed(chips, pet);
      if (pet && HINTS[pet]) {
        hint.textContent = HINTS[pet];
        title.textContent = "Nos conseils pour " + LABELS[pet];
        articles.forEach(function (a) { a.hidden = a.dataset.pet !== pet; });
      } else {
        // Sans choix : un article de chaque animal
        var seen = {};
        articles.forEach(function (a) {
          a.hidden = !!seen[a.dataset.pet];
          seen[a.dataset.pet] = true;
        });
      }
    };

    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        savePet(c.dataset.pet);
        applyHome(c.dataset.pet);
      });
    });
    applyHome(loadPet());
  }

  // ---------- Page Alimentation : simulateur ----------
  var form = document.getElementById("sim-form");
  if (!form) return;

  var simChips = Array.prototype.slice.call(form.querySelectorAll(".chip"));
  var fields = Array.prototype.slice.call(form.querySelectorAll("[data-for]"));
  var $ = function (id) { return document.getElementById(id); };
  var products = Array.prototype.slice.call(document.querySelectorAll("#products .card"));
  var PRODUCT_TITLES = { chien: "votre chien", chat: "votre chat", nac: "votre nouvel animal de compagnie" };

  // Prix moyen au kilo (indicatif) et taux de cagnotte
  var PRICE_PER_KG = { chien: 3.4, chat: 5.2, lapin: 3.0, cobaye: 4.9, hamster: 4.5, oiseau: 3.9 };
  var LOYALTY_RATE = 0.10;
  var DEFAULT_WEIGHT = { chien: 15, chat: 4, lapin: 2 };

  var currentPet = loadPet() || "chien";

  function fmt(n, d) {
    return n.toLocaleString("fr-FR", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  }

  function subject() {
    return currentPet === "nac" ? $("espece").value : currentPet;
  }

  function updateFields() {
    var s = subject();
    fields.forEach(function (f) {
      var targets = f.dataset.for.split(" ");
      f.hidden = targets.indexOf(currentPet) === -1 && targets.indexOf(s) === -1;
    });
  }

  function compute() {
    var s = subject();
    var w = parseFloat($("poids").value) || 0;
    var grams, kcal = null, tip;

    if (s === "chien" || s === "chat") {
      // Besoin énergétique de repos (70 × poids^0,75), ajusté selon âge, activité, stérilisation
      var rer = 70 * Math.pow(w, 0.75);
      var activity = s === "chien"
        ? { faible: 1.3, normale: 1.6, elevee: 2.0 }
        : { faible: 1.0, normale: 1.2, elevee: 1.4 };
      var age = { jeune: 2.0, adulte: 1, senior: 0.85 };
      kcal = rer * activity[$("activite").value] * age[$("age").value];
      if ($("sterilise").value === "oui") kcal *= s === "chien" ? 0.9 : 0.85;
      grams = kcal / (s === "chien" ? 3.6 : 3.8); // densité moyenne des croquettes (kcal/g)
      tip = s === "chien"
        ? "À répartir en 2 repas par jour" + ($("age").value === "jeune" ? " (3 à 4 repas pour un chiot)." : ".")
        : "Le chat préfère grignoter : laissez la ration journalière à disposition en plusieurs petites portions.";
    } else if (s === "lapin") {
      grams = 25 * w;
      tip = "Foin à volonté (environ 80 % de son alimentation) + légumes frais. Les granulés restent un complément.";
    } else if (s === "cobaye") {
      grams = 30;
      tip = "Foin à volonté, légumes frais riches en vitamine C chaque jour (poivron, persil).";
    } else if (s === "hamster") {
      grams = 10;
      tip = "Environ une cuillère à soupe de mélange par jour, avec un peu de légumes frais.";
    } else {
      grams = 12;
      tip = "Environ une cuillère à soupe de graines par jour, avec de l'os de seiche et des végétaux frais.";
    }

    var monthKg = grams * 30 / 1000;
    var budget = monthKg * PRICE_PER_KG[s];

    $("r-ration").textContent = w > 0 || currentPet === "nac" && s !== "lapin"
      ? fmt(grams) + " g / jour" + (currentPet === "nac" ? (s === "lapin" || s === "cobaye" ? " de granulés" : " de mélange") : "")
      : "–";
    $("r-energy-label").textContent = kcal ? "Besoin énergétique" : "Base de l'alimentation";
    $("r-energy").textContent = kcal ? fmt(kcal) + " kcal / jour" : (s === "lapin" || s === "cobaye" ? "Foin à volonté" : "Graines / mélange");
    $("r-month").textContent = monthKg >= 1 ? fmt(monthKg, 1) + " kg" : fmt(monthKg * 1000) + " g";
    $("r-budget").textContent = "≈ " + fmt(budget, 2) + " €";
    $("r-loyalty").textContent = "+ " + fmt(budget * LOYALTY_RATE, 2) + " € / mois";
    $("r-tip").textContent = tip;
  }

  function filterProducts() {
    products.forEach(function (p) { p.hidden = p.dataset.pet !== currentPet; });
    $("produits-title").textContent = "Nos produits pour " + PRODUCT_TITLES[currentPet];
  }

  function applySim(pet, resetWeight) {
    currentPet = pet;
    setPressed(simChips, pet);
    if (resetWeight) {
      var s = subject();
      if (DEFAULT_WEIGHT[s]) $("poids").value = DEFAULT_WEIGHT[s];
    }
    updateFields();
    filterProducts();
    compute();
  }

  simChips.forEach(function (c) {
    c.addEventListener("click", function () {
      savePet(c.dataset.pet);
      applySim(c.dataset.pet, true);
    });
  });
  $("espece").addEventListener("change", function () { applySim(currentPet, true); });
  form.addEventListener("input", compute);
  form.addEventListener("change", compute);

  applySim(currentPet, true);
})();
