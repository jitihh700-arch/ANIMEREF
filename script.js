// Données de test
let videos = [
    {
        id: 1,
        title: "Tutoriel JavaScript pour débutants",
        channel: "DevMaster",
        views: "124K",
        date: "Il y a 2 jours",
        duration: "15:30",
        thumbnail: "https://picsum.photos/320/180?random=1",
        description: "Apprenez les bases de JavaScript avec ce tutoriel complet pour débutants.",
        userId: 2
    },
    {
        id: 2,
        title: "Les meilleures destinations 2024",
        channel: "TravelWorld",
        views: "892K",
        date: "Il y a 1 semaine",
        duration: "22:45",
        thumbnail: "https://picsum.photos/320/180?random=2",
        description: "Découvrez les destinations les plus populaires pour vos vacances 2024.",
        userId: 3
    },
    {
        id: 3,
        title: "Recette de cuisine facile",
        channel: "ChefHome",
        views: "543K",
        date: "Il y a 3 jours",
        duration: "10:15",
        thumbnail: "https://picsum.photos/320/180?random=3",
        description: "Apprenez à préparer un délicieux plat en moins de 30 minutes.",
        userId: 4
    },
    {
        id: 4,
        title: "Entraînement complet à la maison",
        channel: "FitLife",
        views: "321K",
        date: "Il y a 1 mois",
        duration: "45:20",
        thumbnail: "https://picsum.photos/320/180?random=4",
        description: "Programme d'entraînement sans équipement pour rester en forme.",
        userId: 5
    }
];

let users = [
    { id: 1, name: "Vous", email: "vous@exemple.com" },
    { id: 2, name: "DevMaster", email: "dev@exemple.com" },
    { id: 3, name: "TravelWorld", email: "travel@exemple.com" },
    { id: 4, name: "ChefHome", email: "chef@exemple.com" },
    { id: 5, name: "FitLife", email: "fit@exemple.com" }
];

let currentUser = null;
let watchHistory = [];
let myVideos = [];
let uploadStep = 1;
let selectedFile = null;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    loadVideos();
    loadWatchHistory();
    loadMyVideos();
    checkAuthStatus();
});

// Charger les vidéos
function loadVideos() {
    const homeGrid = document.getElementById('homeVideos');
    const exploreGrid = document.getElementById('exploreVideos');
    const subscriptionsGrid = document.getElementById('subscriptionsVideos');
    
    homeGrid.innerHTML = '';
    exploreGrid.innerHTML = '';
    subscriptionsGrid.innerHTML = '';
    
    videos.forEach(video => {
        const videoElement = createVideoCard(video);
        homeGrid.appendChild(videoElement.cloneNode(true));
        exploreGrid.appendChild(videoElement.cloneNode(true));
        subscriptionsGrid.appendChild(videoElement.cloneNode(true));
    });
}

// Créer une carte vidéo
function createVideoCard(video) {
    const div = document.createElement('div');
    div.className = 'video-card';
    div.onclick = () => openVideoModal(video);
    
    div.innerHTML = `
        <div class="video-thumbnail">
            <img src="${video.thumbnail}" alt="${video.title}">
            <div class="video-duration">${video.duration}</div>
        </div>
        <div class="video-info">
            <h3 class="video-title">${video.title}</h3>
            <p class="video-meta">${video.channel} • ${video.views} vues • ${video.date}</p>
        </div>
    `;
    
    return div;
}

// Charger l'historique
function loadWatchHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    if (watchHistory.length === 0) {
        historyList.innerHTML = '<p class="empty-state">Aucune vidéo visionnée récemment.</p>';
        return;
    }
    
    watchHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div class="history-video">
                <img src="${item.thumbnail}" alt="${item.title}">
                <div class="history-info">
                    <h4>${item.title}</h4>
                    <p>${item.channel} • Visionné le ${item.watchedAt}</p>
                </div>
            </div>
        `;
        div.onclick = () => openVideoModal(item);
        historyList.appendChild(div);
    });
}

// Charger mes vidéos
function loadMyVideos() {
    const myVideosList = document.getElementById('myUploadedVideos');
    myVideosList.innerHTML = '';
    
    if (myVideos.length === 0) {
        myVideosList.innerHTML = '<p class="empty-state">Vous n\'avez pas encore publié de vidéos.</p>';
        return;
    }
    
    myVideos.forEach(video => {
        const videoElement = createVideoCard(video);
        myVideosList.appendChild(videoElement);
    });
}

// Afficher une section
function showSection(sectionId) {
    // Mettre à jour la sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Afficher la section correspondante
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

// Ouvrir modal vidéo
function openVideoModal(video) {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    const videoSource = video.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    
    // Mettre à jour les informations de la vidéo
    document.getElementById('videoModalTitle').textContent = video.title;
    document.getElementById('videoModalViews').textContent = `${video.views} vues`;
    document.getElementById('videoModalDate').textContent = video.date;
    document.getElementById('videoModalDescription').textContent = video.description;
    
    // Charger la vidéo
    player.src = videoSource;
    
    // Ajouter à l'historique
    addToHistory(video);
    
    // Afficher le modal
    modal.style.display = 'flex';
    
    // Lecture automatique
    setTimeout(() => {
        player.play().catch(e => console.log("Lecture automatique bloquée"));
    }, 500);
}

// Fermer modal vidéo
function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    
    player.pause();
    modal.style.display = 'none';
}

// Ajouter à l'historique
function addToHistory(video) {
    // Vérifier si la vidéo est déjà dans l'historique
    const existingIndex = watchHistory.findIndex(item => item.id === video.id);
    
    if (existingIndex !== -1) {
        watchHistory.splice(existingIndex, 1);
    }
    
    // Ajouter en premier avec la date actuelle
    const historyItem = {
        ...video,
        watchedAt: new Date().toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    };
    
    watchHistory.unshift(historyItem);
    
    // Limiter à 50 éléments
    if (watchHistory.length > 50) {
        watchHistory.pop();
    }
    
    // Sauvegarder dans localStorage
    localStorage.setItem('watchHistory', JSON.stringify(watchHistory));
    
    // Recharger l'historique
    loadWatchHistory();
}

// Upload de vidéo - Gestion des étapes
function openUploadModal() {
    // Vérifier si l'utilisateur est connecté
    if (!currentUser) {
        showNotification("Vous devez être connecté pour uploader une vidéo");
        openAuthModal();
        return;
    }
    
    const modal = document.getElementById('uploadModal');
    modal.style.display = 'flex';
    resetUploadForm();
}

function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    modal.style.display = 'none';
}

function resetUploadForm() {
    uploadStep = 1;
    selectedFile = null;
    
    // Réinitialiser les étapes
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById('step1').classList.add('active');
    
    // Réinitialiser les contenus d'étape
    document.querySelectorAll('.upload-step-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById('uploadStep1').classList.add('active');
    
    // Réinitialiser les champs
    document.getElementById('videoFile').value = '';
    document.getElementById('videoTitle').value = '';
    document.getElementById('videoDescription').value = '';
    document.getElementById('videoTags').value = '';
    document.getElementById('fileInfo').innerHTML = '';
    
    // Désactiver les boutons
    document.querySelector('.next-step-btn').disabled = true;
    document.querySelector('.upload-submit-btn').disabled = true;
}

function nextUploadStep() {
    if (uploadStep >= 3) return;
    
    // Valider l'étape actuelle
    if (uploadStep === 1 && !selectedFile) {
        showNotification("Veuillez sélectionner un fichier vidéo");
        return;
    }
    
    if (uploadStep === 2) {
        const title = document.getElementById('videoTitle').value.trim();
        if (!title) {
            showNotification("Veuillez entrer un titre pour la vidéo");
            return;
        }
    }
    
    uploadStep++;
    updateUploadSteps();
}

function prevUploadStep() {
    if (uploadStep <= 1) return;
    uploadStep--;
    updateUploadSteps();
}

function updateUploadSteps() {
    // Mettre à jour les indicateurs d'étape
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(`step${uploadStep}`).classList.add('active');
    
    // Mettre à jour les contenus d'étape
    document.querySelectorAll('.upload-step-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`uploadStep${uploadStep}`).classList.add('active');
    
    // Si on est à l'étape 3, lancer la vérification
    if (uploadStep === 3) {
        startVerification();
    }
}

// Gestion du fichier
document.getElementById('videoFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Vérifier le type de fichier
    const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv'];
    if (!validTypes.includes(file.type)) {
        showNotification("Format de fichier non supporté. Utilisez MP4, AVI, MOV, WMV ou FLV.");
        return;
    }
    
    // Vérifier la taille (max 2GB)
    if (file.size > 2 * 1024 * 1024 * 1024) {
        showNotification("Le fichier est trop volumineux (max 2GB)");
        return;
    }
    
    selectedFile = file;
    
    // Afficher les infos du fichier
    const fileInfoDiv = document.getElementById('fileInfo');
    fileInfoDiv.innerHTML = `
        <p><strong>Fichier sélectionné:</strong> ${file.name}</p>
        <p><strong>Taille:</strong> ${formatFileSize(file.size)}</p>
        <p><strong>Type:</strong> ${file.type}</p>
    `;
    
    // Activer le bouton suivant
    document.querySelector('.next-step-btn').disabled = false;
    
    // Pré-remplir le titre avec le nom du fichier
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    document.getElementById('videoTitle').value = fileNameWithoutExt;
    
    // Mettre à jour le résumé
    document.getElementById('summaryFile').textContent = file.name;
    document.getElementById('summaryTitle').textContent = fileNameWithoutExt;
});

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Vérification des droits d'auteur
function startVerification() {
    const progressBar = document.getElementById('verificationProgress');
    const progressText = document.getElementById('progressText');
    const statusText = document.getElementById('verificationStatus');
    const submitBtn = document.querySelector('.upload-submit-btn');
    
    // Mettre à jour le résumé
    const title = document.getElementById('videoTitle').value;
    const visibility = document.querySelector('input[name="visibility"]:checked').value;
    const visibilityText = {
        'public': 'Public',
        'private': 'Privé',
        'unlisted': 'Non listé'
    }[visibility];
    
    document.getElementById('summaryTitle').textContent = title;
    document.getElementById('summaryVisibility').textContent = visibilityText;
    
    // Simuler la vérification des droits d'auteur
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${progress}%`;
        
        if (progress <= 30) {
            statusText.textContent = "Vérification des métadonnées...";
        } else if (progress <= 60) {
            statusText.textContent = "Analyse du contenu audio...";
        } else if (progress <= 90) {
            statusText.textContent = "Recherche de contenu protégé...";
        }
        
        if (progress >= 100) {
            clearInterval(interval);
            progressText.textContent = "100%";
            statusText.innerHTML = '<span style="color: #4CAF50;">✓ Vérification terminée. Aucun problème de droits d\'auteur détecté.</span>';
            submitBtn.disabled = false;
        }
    }, 100);
}

// Soumettre la vidéo
function submitVideo() {
    const title = document.getElementById('videoTitle').value;
    const description = document.getElementById('videoDescription').value;
    const visibility = document.querySelector('input[name="visibility"]:checked').value;
    
    // Créer la nouvelle vidéo
    const newVideo = {
        id: videos.length + 1,
        title: title,
        channel: currentUser.name,
        views: "0",
        date: "À l'instant",
        duration: "00:00",
        thumbnail: "https://picsum.photos/320/180?random=" + (videos.length + 5),
        description: description,
        userId: currentUser.id
    };
    
    // Ajouter aux vidéos
    videos.unshift(newVideo);
    myVideos.unshift(newVideo);
    
    // Mettre à jour l'interface
    loadVideos();
    loadMyVideos();
    
    // Fermer le modal
    closeUploadModal();
    
    // Afficher une notification
    showNotification("Vidéo publiée avec succès!");
    
    // Afficher la section "Mes vidéos"
    showSection('my-videos');
}

// Authentification
function openAuthModal() {
    const modal = document.getElementById('authModal');
    modal.style.display = 'flex';
    switchAuthTab('login');
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.style.display = 'none';
}

function switchAuthTab(tab) {
    // Mettre à jour les onglets
    document.querySelectorAll('.auth-tab').forEach(t => {
        t.classList.remove('active');
    });
    
    if (tab === 'login') {
        document.querySelectorAll('.auth-tab')[0].classList.add('active');
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('signupForm').style.display = 'none';
    } else {
        document.querySelectorAll('.auth-tab')[1].classList.add('active');
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'block';
    }
}

function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification("Veuillez remplir tous les champs");
        return;
    }
    
    // Simulation de connexion
    currentUser = {
        id: 1,
        name: "Vous",
        email: email
    };
    
    // Sauvegarder dans localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Mettre à jour l'interface
    updateAuthUI();
    
    // Fermer le modal
    closeAuthModal();
    
    // Afficher une notification
    showNotification("Connexion réussie!");
}

function signup() {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!name || !email || !password || !confirmPassword) {
        showNotification("Veuillez remplir tous les champs");
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification("Les mots de passe ne correspondent pas");
        return;
    }
    
    // Simulation d'inscription
    currentUser = {
        id: users.length + 1,
        name: name,
        email: email
    };
    
    // Ajouter aux utilisateurs
    users.push(currentUser);
    
    // Sauvegarder dans localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('users', JSON.stringify(users));
    
    // Mettre à jour l'interface
    updateAuthUI();
    
    // Fermer le modal
    closeAuthModal();
    
    // Afficher une notification
    showNotification("Inscription réussie! Bienvenue " + name);
}

function loginWithGoogle() {
    // Simulation de connexion Google
    currentUser = {
        id: 1,
        name: "Utilisateur Google",
        email: "googleuser@exemple.com"
    };
    
    // Sauvegarder dans localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Mettre à jour l'interface
    updateAuthUI();
    
    // Fermer le modal
    closeAuthModal();
    
    // Afficher une notification
    showNotification("Connexion avec Google réussie!");
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateAuthUI();
    showNotification("Déconnexion réussie");
}

function checkAuthStatus() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }
    updateAuthUI();
}

function updateAuthUI() {
    const signInBtn = document.getElementById('signInBtn');
    const userProfileBtn = document.getElementById('userProfileBtn');
    const userNameSpan = document.getElementById('userName');
    
    if (currentUser) {
        signInBtn.style.display = 'none';
        userProfileBtn.style.display = 'flex';
        userNameSpan.textContent = currentUser.name;
        
        // Ajouter un menu déroulant pour la déconnexion
        userProfileBtn.onclick = function(e) {
            const menu = document.createElement('div');
            menu.className = 'profile-menu';
            menu.innerHTML = `
                <div class="profile-menu-item" onclick="showSection('my-videos')">
                    <i class="fas fa-video"></i> Mes vidéos
                </div>
                <div class="profile-menu-item" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i> Déconnexion
                </div>
            `;
            menu.style.position = 'absolute';
            menu.style.top = '60px';
            menu.style.right = '20px';
            menu.style.backgroundColor = 'white';
            menu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
            menu.style.borderRadius = '8px';
            menu.style.padding = '10px 0';
            menu.style.zIndex = '1000';
            
            // Supprimer le menu précédent s'il existe
            const existingMenu = document.querySelector('.profile-menu');
            if (existingMenu) existingMenu.remove();
            
            document.body.appendChild(menu);
            
            // Fermer le menu en cliquant ailleurs
            setTimeout(() => {
                document.addEventListener('click', function closeMenu(e) {
                    if (!menu.contains(e.target) && e.target !== userProfileBtn) {
                        menu.remove();
                        document.removeEventListener('click', closeMenu);
                    }
                });
            }, 0);
        };
    } else {
        signInBtn.style.display = 'flex';
        userProfileBtn.style.display = 'none';
    }
}

// Dons
function openDonateModal() {
    const modal = document.getElementById('donateModal');
    modal.style.display = 'flex';
}

function closeDonateModal() {
    const modal = document.getElementById('donateModal');
    modal.style.display = 'none';
}

function selectDonationAmount(amount) {
    // Animation de sélection
    document.querySelectorAll('.donation-amount').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    // Afficher un message
    showNotification(`Merci pour votre don de ${amount}€! Contactez-nous par téléphone ou email pour finaliser.`);
    
    // Fermer après un délai
    setTimeout(() => {
        closeDonateModal();
    }, 2000);
}

function processCustomDonation() {
    const amount = document.getElementById('customAmount').value;
    if (!amount || amount < 1) {
        showNotification("Veuillez entrer un montant valide");
        return;
    }
    
    showNotification(`Merci pour votre don de ${amount}€! Contactez-nous par téléphone ou email pour finaliser.`);
    closeDonateModal();
}

// Notification
function showNotification(message) {
    const notification = document.getElementById('notification');
    const messageSpan = document.getElementById('notificationMessage');
    
    messageSpan.textContent = message;
    notification.style.display = 'block';
    
    // Masquer après 3 secondes
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Charger les données depuis localStorage
function loadFromLocalStorage() {
    const savedVideos = localStorage.getItem('videos');
    const savedHistory = localStorage.getItem('watchHistory');
    const savedMyVideos = localStorage.getItem('myVideos');
    
    if (savedVideos) videos = JSON.parse(savedVideos);
    if (savedHistory) watchHistory = JSON.parse(savedHistory);
    if (savedMyVideos) myVideos = JSON.parse(savedMyVideos);
}

// Sauvegarder dans localStorage
function saveToLocalStorage() {
    localStorage.setItem('videos', JSON.stringify(videos));
    localStorage.setItem('watchHistory', JSON.stringify(watchHistory));
    localStorage.setItem('myVideos', JSON.stringify(myVideos));
}

// Charger les données au démarrage
loadFromLocalStorage();

// Sauvegarder périodiquement
setInterval(saveToLocalStorage, 10000);
