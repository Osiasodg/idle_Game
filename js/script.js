let gameState = {
  rice: 0,
  dishes: 0,
  totalClicks: 0,
  clickPower: 5,
  clickMultiplier: 1,
  ricePerSecond: 0,
  level: 1,

  // Progression vers le plat
  clicksTowardsDish: 0,
  clicksNeededForDish: 200, // 200 clics × 5 = 1000 riz

  // Boosts
  randomBoostActive: false,
  randomBoostAvailable: false,
  randomBoostTimeout: null,

  dailyBoostActive: false,
  dailyBoostTimeLeft: 0,
  dailyBoostNextAvailable: 10, // 10 secondes pour test (change à 600 pour 10min)

  // Améliorations
  upgrades: {
    simpleCook: {
      name: "Cuisinier Simple",
      count: 0,
      cost: 50,
      baseCost: 50,
      production: 5,
      costMultiplier: 1.15,
      type: "rice",
    },
    steamMachine: {
      name: "Machine à Vapeur",
      count: 0,
      cost: 200,
      baseCost: 200,
      production: 20,
      costMultiplier: 1.15,
      type: "rice",
    },
    robotCook: {
      name: "Robot Cuisinier",
      count: 0,
      cost: 1000,
      baseCost: 1000,
      production: 100,
      costMultiplier: 1.15,
      type: "rice",
    },
    autoFactory: {
      name: "Usine Automatique",
      count: 0,
      cost: 5000,
      baseCost: 5000,
      production: 500,
      costMultiplier: 1.15,
      type: "rice",
    },
  },

  // Chefs (achetés avec des plats)
  chefs: {
    chefCook: {
      name: "Chef Cuisinier",
      count: 0,
      cost: 10,
      baseCost: 10,
      production: 750,
      costMultiplier: 1.2,
      type: "dish",
    },
    chefRobot: {
      name: "Chef Robot Cuisinier",
      count: 0,
      cost: 500,
      baseCost: 500,
      production: 1000,
      costMultiplier: 1.3,
      type: "dish",
    },
  },
};

// INITIALISATION
window.onload = function () {
  console.log("🍚 Le Cuisto démarré !");
  loadGame();
  updateDisplay();
  startGameLoop();
  setupUpgradeButtons();
  startRandomBoostTimer();
  startDailyBoostTimer();
  setupDishConversion();
};

// CLIC SUR LA MARMITE
function clickPot() {
  let riceGained = gameState.clickPower * gameState.clickMultiplier;

  gameState.rice += riceGained;
  gameState.totalClicks++;
  gameState.clicksTowardsDish++; // Compte les clics pour le plat

  // Animation de clic
  animatePot();
  showFloatingNumber(riceGained);

  // Vérifier si un plat peut être fait (200 clics = 1000 riz)
  if (gameState.clicksTowardsDish >= gameState.clicksNeededForDish) {
    const dishBtn = document.querySelector(".dish-progress");
    if (dishBtn) {
      dishBtn.classList.add("dish-ready");
    }
  }

  updateDisplay();
}

// CONVERTIR RIZ EN PLAT (MANUEL)
function setupDishConversion() {
  const dishProgress = document.querySelector(".dish-progress");
  if (dishProgress) {
    dishProgress.style.cursor = "pointer";
    dishProgress.addEventListener("click", convertRiceToDish);
  }
}

function convertRiceToDish() {
  if (gameState.rice >= 1000) {
    gameState.rice -= 1000;
    gameState.dishes++;
    gameState.clicksTowardsDish = 0;

    showNotification("🍽️ +1 Plat créé !", "success");
    animateDishComplete();

    const dishBtn = document.querySelector(".dish-progress");
    if (dishBtn) {
      dishBtn.classList.remove("dish-ready");
    }

    updateDisplay();
  } else {
    showNotification(
      `❌ Il faut 1000 riz (vous avez ${gameState.rice})`,
      "error"
    );
  }
}

// CONFIGURATION DES BOUTONS D'ACHAT

function setupUpgradeButtons() {
  // Améliorations (riz)
  Object.keys(gameState.upgrades).forEach((key) => {
    const element = document.querySelector(`[data-upgrade="${key}"]`);
    if (element) {
      element.addEventListener("click", () => buyUpgrade(key));
    }
  });

  // Chefs
  setupChefButtons();

  // Boosts
  const boostElements = document.querySelectorAll(".boost-bloc");
  if (boostElements[0]) {
    boostElements[0].parentElement.addEventListener("click", useRandomBoost);
  }
  if (boostElements[1]) {
    boostElements[1].parentElement.addEventListener("click", useDailyBoost);
  }
}

function setupChefButtons() {
  const chefElements = document.querySelectorAll(
    ".bloc_right .option:not(:has(.boost-bloc))"
  );
  const chefKeys = Object.keys(gameState.chefs);

  chefElements.forEach((element, index) => {
    if (chefKeys[index]) {
      element.addEventListener("click", () => buyChef(chefKeys[index]));
    }
  });
}

// ACHETER AMÉLIORATION

function buyUpgrade(upgradeName) {
  const upgrade = gameState.upgrades[upgradeName];

  if (!upgrade) return;

  if (gameState.rice >= upgrade.cost) {
    gameState.rice -= upgrade.cost;
    upgrade.count++;

    upgrade.cost = Math.floor(
      upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.count)
    );

    calculateProduction();

    showNotification(`✅ ${upgrade.name} acheté !`, "success");
    updateDisplay();
  } else {
    showNotification("❌ Pas assez de riz !", "error");
  }
}

// ACHETER CHEF

function buyChef(chefName) {
  const chef = gameState.chefs[chefName];

  if (!chef) return;

  if (gameState.dishes >= chef.cost) {
    gameState.dishes -= chef.cost;
    chef.count++;

    chef.cost = Math.floor(
      chef.baseCost * Math.pow(chef.costMultiplier, chef.count)
    );

    calculateProduction();

    showNotification(`✅ ${chef.name} recruté !`, "success");
    updateDisplay();
  } else {
    showNotification("❌ Pas assez de plats !", "error");
  }
}

// CALCULER PRODUCTION AUTOMATIQUE

function calculateProduction() {
  let totalRicePerSec = 0;

  // Production des améliorations
  Object.values(gameState.upgrades).forEach((upgrade) => {
    totalRicePerSec += upgrade.count * upgrade.production;
  });

  // Production des chefs
  Object.values(gameState.chefs).forEach((chef) => {
    totalRicePerSec += chef.count * chef.production;
  });

  gameState.ricePerSecond = totalRicePerSec;

  // Ajouter effet visuel si production active
  const pot = document.getElementById("pot");
  if (pot) {
    if (gameState.ricePerSecond > 0) {
      pot.classList.add("producing");
    } else {
      pot.classList.remove("producing");
    }
  }
}

// BOUCLE PRINCIPALE DU JEU
function startGameLoop() {
  setInterval(gameLoop, 1000); // Chaque seconde
}

function gameLoop() {
  // Production automatique de riz
  if (gameState.ricePerSecond > 0) {
    let riceGained = gameState.ricePerSecond;
    gameState.rice += riceGained;
  }

  // Gestion du boost quotidien
  if (gameState.dailyBoostActive) {
    gameState.dailyBoostTimeLeft--;
    if (gameState.dailyBoostTimeLeft <= 0) {
      endDailyBoost();
    }
  }

  // Décrémenter le timer du prochain boost quotidien
  if (!gameState.dailyBoostActive && gameState.dailyBoostNextAvailable > 0) {
    gameState.dailyBoostNextAvailable--;
  }

  updateDisplay();

  // Sauvegarde périodique
  if (gameState.totalClicks % 10 === 0) {
    saveGame();
  }
}

function startRandomBoostTimer() {
  setInterval(() => {
    if (!gameState.randomBoostAvailable && Math.random() < 0.1) {
      // 10% de chance
      activateRandomBoost();
    }
  }, 10000); // Toutes les 10 secondes
}

function activateRandomBoost() {
  gameState.randomBoostAvailable = true;

  const boostCard = document
    .querySelectorAll(".boost-bloc")[0]
    .closest(".option");
  boostCard.classList.add("boost-available");

  showNotification("⚡ BOOST ALÉATOIRE ! Cliquez vite !", "boost");

  // Désactiver après 30 secondes
  gameState.randomBoostTimeout = setTimeout(() => {
    if (gameState.randomBoostAvailable) {
      gameState.randomBoostAvailable = false;
      boostCard.classList.remove("boost-available");
      showNotification("💨 Boost aléatoire expiré", "info");
    }
  }, 30000);
}

function useRandomBoost() {
  if (!gameState.randomBoostAvailable) {
    return;
  }

  // Multiplier le riz actuel par 3
  const bonus = gameState.rice * 2; // x3 = actuel + 2x
  gameState.rice += bonus;

  gameState.randomBoostAvailable = false;
  clearTimeout(gameState.randomBoostTimeout);

  const boostCard = document
    .querySelectorAll(".boost-bloc")[0]
    .closest(".option");
  boostCard.classList.remove("boost-available");

  showNotification(`⚡ +${formatNumberFull(bonus)} riz (×3) !`, "boost");
  updateDisplay();
}

// BOOST QUOTIDIEN

function startDailyBoostTimer() {
  // Vérifier si le boost est disponible
  setInterval(() => {
    if (gameState.dailyBoostNextAvailable <= 0 && !gameState.dailyBoostActive) {
      const boostCard = document
        .querySelectorAll(".boost-bloc")[1]
        .closest(".option");
      boostCard.classList.add("boost-available");
    }
  }, 1000);
}

function useDailyBoost() {
  if (gameState.dailyBoostActive) {
    return;
  }

  if (gameState.dailyBoostNextAvailable > 0) {
    const timeLeft = formatTime(gameState.dailyBoostNextAvailable);
    showNotification(`⏰ Disponible dans ${timeLeft}`, "info");
    return;
  }

  // // Activer le boost AUTOMATIQUEMENT (pas besoin de cliquer à chaque fois)
  // gameState.dailyBoostActive = true;
  // gameState.dailyBoostTimeLeft = 180; // 3 minutes
  // gameState.clickMultiplier = 2; // Doubler les clics
  // gameState.dailyBoostNextAvailable = 10; // Reset timer (change à 600 pour 10min)

  const boostCard = document
    .querySelectorAll(".boost-bloc")[1]
    .closest(".option");
  boostCard.classList.remove("boost-available");
  boostCard.classList.add("boost-active");

  showNotification("⚡ BOOST ×2 ACTIVÉ ! (3 min)", "boost");
}

function endDailyBoost() {
  gameState.dailyBoostActive = false;
  gameState.clickMultiplier = 1; // Retour à la normale

  const boostCard = document
    .querySelectorAll(".boost-bloc")[1]
    .closest(".option");
  boostCard.classList.remove("boost-active");

  showNotification("⏰ Boost quotidien terminé", "info");
}

// MISE À JOUR AFFICHAGE

function updateDisplay() {
  // Statistiq principales (NOMBRES COMPLETS)
  document.getElementById("rice-count").textContent = formatNumberFull(
    gameState.rice
  );
  document.getElementById("dish-count").textContent = formatNumberFull(
    gameState.dishes
  );
  document.getElementById("level").textContent = gameState.level;

  // Progression vers le plat (UNIQUEMENT PAR CLIC)
  const progressPercent =
    (gameState.clicksTowardsDish / gameState.clicksNeededForDish) * 100;

  const riceFill = document.getElementById("rice-fill");
  if (riceFill) {
    riceFill.style.height = Math.min(progressPercent, 100) + "%";
  }

  const progressBar = document.getElementById("progress-bar");
  if (progressBar) {
    progressBar.style.width = Math.min(progressPercent, 100) + "%";
  }

  // Mettre à jour les améliorations
  updateUpgradesDisplay();

  // Mettre à jour les chefs
  updateChefsDisplay();

  // Mettre à jour les boosts
  updateBoostsDisplay();
}

// AFFICHAGE AMÉLIORATIONS

function updateUpgradesDisplay() {
  Object.keys(gameState.upgrades).forEach((key) => {
    const upgrade = gameState.upgrades[key];
    const element = document.querySelector(`[data-upgrade="${key}"]`);

    if (!element) return;

    const costEl = element.querySelector(`#cost-${key}`);
    if (costEl) {
      costEl.textContent = `Coût: ${formatNumberFull(upgrade.cost)} riz`;
    }

    const countEl = element.querySelector(`#count-${key}`);
    if (countEl) {
      countEl.textContent = upgrade.count;
    }

    if (gameState.rice >= upgrade.cost) {
      element.classList.remove("disabled");
      element.classList.add("available");
    } else {
      element.classList.remove("available");
      element.classList.add("disabled");
    }
  });
}

// AFFICHAGE CHEFS

function updateChefsDisplay() {
  const chefElements = document.querySelectorAll(
    ".bloc_right .option:not(:has(.boost-bloc))"
  );
  const chefKeys = Object.keys(gameState.chefs);

  chefElements.forEach((element, index) => {
    const chef = gameState.chefs[chefKeys[index]];
    if (!chef) return;

    const countEl = element.querySelector(".upgrade-count span");
    if (countEl) {
      countEl.textContent = chef.count;
    }

    if (gameState.dishes >= chef.cost) {
      element.classList.remove("disabled");
      element.classList.add("available");
    } else {
      element.classList.remove("available");
      element.classList.add("disabled");
    }
  });
}

// AFFICHAGE BOOSTS

function updateBoostsDisplay() {
  const boostElements = document.querySelectorAll(".boost-bloc");

  // Boost aléatoire
  const randomBoostTimer = boostElements[0].querySelector(".boost-timer");
  if (randomBoostTimer) {
    if (gameState.randomBoostAvailable) {
      randomBoostTimer.textContent = "✅ CLIQUEZ MAINTENANT !";
      randomBoostTimer.style.color = "#00ff00";
    } else {
      randomBoostTimer.textContent = "En attente...";
      randomBoostTimer.style.color = "#888";
    }
  }

  // Boost quotidien
  const dailyBoostTimer = boostElements[1].querySelector(".boost-timer");
  if (dailyBoostTimer) {
    if (gameState.dailyBoostActive) {
      dailyBoostTimer.textContent = `⚡ ${formatTime(
        gameState.dailyBoostTimeLeft
      )}`;
      dailyBoostTimer.style.color = "#00ff00";
    } else if (gameState.dailyBoostNextAvailable > 0) {
      dailyBoostTimer.textContent = `⏰ ${formatTime(
        gameState.dailyBoostNextAvailable
      )}`;
      dailyBoostTimer.style.color = "#ff9800";
    } else {
      dailyBoostTimer.textContent = "✅ Cliquez pour activer !";
      dailyBoostTimer.style.color = "#00ff00";
    }
  }
}

// ANIMATIONS

function animatePot() {
  const pot = document.getElementById("pot");
  if (!pot) return;

  pot.style.transform = "scale(1.1)";
  setTimeout(() => {
    pot.style.transform = "scale(1)";
  }, 100);
}

function animateDishComplete() {
  const pot = document.getElementById("pot");
  if (!pot) return;

  pot.style.animation = "shake 0.5s ease";
  setTimeout(() => {
    pot.style.animation = "";
  }, 500);
}

function showFloatingNumber(amount) {
  const container = document.querySelector(".pot-container");
  const floating = document.createElement("div");
  floating.className = "floating-number";
  floating.textContent = `+${formatNumberFull(amount)}`;
  floating.style.left = Math.random() * 100 + "px";
  floating.style.top = Math.random() * 50 + "px";

  container.appendChild(floating);

  setTimeout(() => {
    floating.remove();
  }, 1000);
}

// NOTIFICATIONS

function showNotification(message, type = "info") {
  const popup = document.querySelector(".popup .message span");
  if (popup) {
    popup.textContent = message;
    popup.parentElement.className = `message ${type}`;
    popup.parentElement.style.display = "block";

    setTimeout(() => {
      popup.parentElement.style.display = "none";
    }, 3000);
  }
}

//SAUVEGARDE / CHARGEMENT

function saveGame() {
  try {
    localStorage.setItem("leCuistoSave", JSON.stringify(gameState));
  } catch (e) {
    console.error("Erreur sauvegarde:", e);
  }
}

function loadGame() {
  try {
    const savedGame = localStorage.getItem("leCuistoSave");
    if (savedGame) {
      const loaded = JSON.parse(savedGame);
      Object.assign(gameState, loaded);
      calculateProduction();
      console.log("💾 Partie chargée !");
    }
  } catch (e) {
    console.error("Erreur chargement:", e);
  }
}

function formatNumberFull(num) {
  // AFFICHER LE NOMBRE COMPLET (pas d'abréviation)
  return Math.floor(num).toLocaleString("fr-FR");
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// FONCTIONS APPELÉES DEPUIS HTML

// function activateBoost() {

// }

//  FONCTIONS FOOTER

function openRecipes() {
  showNotification("📚 Recettes à venir !", "info");
}

function openSettings() {
  const choice = confirm("💾 Sauvegarder la partie ?");
  if (choice) {
    saveGame();
    showNotification("💾 Jeu sauvegardé !", "success");
  }
}

// RACCOURCIS CLAVIER

document.addEventListener("keydown", function (e) {
  if (e.code === "Space") {
    e.preventDefault();
    clickPot();
  }
});
