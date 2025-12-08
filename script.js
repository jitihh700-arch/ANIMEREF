// ============ BASE DE DONNÉES ============
let videos = [];
let users = [];
let currentUser = null;
let watchHistory = [];

// ============ INITIALISATION ============
document.addEventListener('DOMContentLoaded', function() {
    console.log("Animeref - Démarrage...");
    
    // Charger les données
    loadFromStorage();
    
    // Vérifier l'état de connexion
    checkAuthStatus();
    
    // Charger les vidéos
    loadVideos();
    
    // Attacher TOUS les événements
    setupAllEvents();
    
    // Afficher notification de bienvenue
    showMessage("🎬 Animeref prêt !");
});

// ============ CHARGEMENT DES DONNÉES ============
function loadFromStorage() {
    console.log("Chargement des données...");
    
    // Charger depuis localStorage
    const savedVideos = localStorage.getItem('animeref_videos');
    const savedUsers = localStorage.getItem('animeref_users');
    const savedHistory = localStorage.getItem('animeref_history');
    const savedUser = localStorage.getItem('animeref_currentUser');
    
    if (savedVideos) {
        videos = JSON.parse(savedVideos);
        console.log("Vidéos chargées:", videos.length);
    }
    
    if (savedUsers) {
        users = JSON.parse(savedUsers);
        console.log("Utilisateurs chargés:", users.length);
    }
    
    if (savedHistory) {
        watchHistory = JSON.parse(savedHistory);
    }
    
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        console.log("Utilisateur connecté:", currentUser.name);
    }
    
    // Créer un utilisateur admin si aucun utilisateur
    if (users.length === 0) {
        console.log("Création de l'utilisateur admin...");
        users = [
            {
                id: 1,
                name: "Admin",
                email: "admin@animeref.com",
                password: "admin123"
            }
        ];
        saveToStorage('animeref_users', users);
    }
}

function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// ============ ÉVÉNEMENTS ============
function setupAllEvents() {
    console.log("Configuration des événements...");
    
    // === BOUTONS PRINCIPAUX ===
    document.getElementById('uploadBtn').addEventListener('click', function() {
        console.log("Bouton Publier cliqué");
        openUploadModal();
    });
    
    document.getElementById('signInBtn').addEventListener('click', function() {
        console.log("Bouton Connexion cliqué");
        openAuthModal();
    });
    
    document.getElementById('donateBtn').addEventListener('click', function() {
        console.log("Bouton Soutenir cliqué");
        openDonateModal();
    });
    
    document.getElementById('searchBtn').addEventListener('click', function() {
        console.log("Bouton Recherche cliqué");
        searchVideos();
    });
    
    // === FERMETURE MODALS ===
    document.getElementById('closeVideoModal').addEventListener('click', closeVideoModal);
    document.getElementById('closeUploadModal').addEventListener('click', closeUploadModal);
    document.getElementById('closeAuthModal').addEventListener('click', closeAuthModal);
    document.getElementById('closeDonateModal').addEventListener('click', closeDonateModal);
    
    // === AUTHENTIFICATION ===
    document.getElementById('loginBtn').addEventListener('click', login);
    document.getElementById('signupBtn').addEventListener('click', signup);
    document.getElementById('showSignup').addEventListener('click', showSignupForm);
    document.getElementById('showLogin').addEventListener('click', showLoginForm);
    
    // === UPLOAD VIDÉO ===
    document.getElementById('submitVideoBtn').addEventListener('click', uploadVideo);
    
    // === ACTIONS VIDÉO ===
    document.getElementById('likeBtn').addEventListener('click', likeVideo);
    document.getElementById('deleteBtn').addEventListener('click', deleteVideo);
    
    // === DONS ===
    document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const amount = this.getAttribute('data-amount');
            selectDonationAmount(amount);
        });
    });
    document.getElementById('customDonateBtn').addEventListener('click', processDonation);
    
    // === SIDEBAR ===
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // === RECHERCHE AVEC ENTER ===
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchVideos();
        }
    });
    
    // === FERMER MODALS EN CLIQUANT DEHORS ===
    window.addEventListener('click', function(event) {
        const modals = ['videoModal', 'uploadModal', 'authModal', 'donateModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (event.target === modal) {
                if (modalId === 'videoModal') closeVideoModal();
                if (modalId === 'uploadModal') closeUploadModal();
                if (modalId === 'authModal') closeAuthModal();
                if (modalId === 'donateModal') closeDonateModal();
            }
        });
    });
    
    console.log("✅ Tous les événements sont configurés");
}

// ============ VIDÉOS ============
function loadVideos() {
    console.log("Chargement des vidéos...");
    
    const containers = ['homeVideos', 'trendingVideos'];
    
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        // Afficher toutes les vidéos
        if (videos.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucune vidéo disponible</p>';
            return;
        }
        
        videos.forEach(video => {
            const card = createVideoCard(video);
            container.appendChild(card);
        });
    });
}

function createVideoCard(video) {
    const div = document.createElement('div');
    div.className = 'video-card';
    
    // Créer une miniature si elle n'existe pas
    const thumbnail = video.thumbnail || `https://picsum.photos/300/170?random=${video.id}`;
    
    div.innerHTML = `
        <div class="video-thumbnail">
            <img src="${thumbnail}" alt="${video.title}">
        </div>
        <div class="video-info">
            <h3>${video.title}</h3>
            <p>${video.channel || 'Utilisateur'} • ${video.views || '0'} vues</p>
        </div>
    `;
    
    div.addEventListener('click', function() {
        console.log("Clic sur vidéo:", video.title);
        playVideo(video);
    });
    
    return div;
}

// ============ LECTURE VIDÉO ============
let currentPlayingVideo = null;

function playVideo(video) {
    console.log("Lecture de la vidéo:", video.title);
    currentPlayingVideo = video;
    
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    
    // Mettre à jour les informations
    document.getElementById('videoTitle').textContent = video.title;
    document.getElementById('videoDescription').textContent = video.description || 'Aucune description';
    
    // Charger la vidéo
    if (video.videoData) {
        player.src = video.videoData;
        console.log("Vidéo chargée depuis les données");
    } else if (video.videoUrl) {
        player.src = video.videoUrl;
        console.log("Vidéo chargée depuis l'URL");
    } else {
        console.warn("Aucune source vidéo disponible");
        showMessage("❌ Impossible de lire cette vidéo");
        return;
    }
    
    // Afficher/cacher bouton supprimer
    const deleteBtn = document.getElementById('deleteBtn');
    if (currentUser && video.userId === currentUser.id) {
        deleteBtn.style.display = 'inline-block';
    } else {
        deleteBtn.style.display = 'none';
    }
    
    // Ajouter à l'historique
    addToHistory(video);
    
    // Afficher le modal
    modal.style.display = 'flex';
    
    // Lancer la lecture
    setTimeout(() => {
        player.play().catch(e => {
            console.log("Lecture automatique bloquée, l'utilisateur doit cliquer");
        });
    }, 500);
}

function closeVideoModal() {
    console.log("Fermeture du lecteur vidéo");
    
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    
    if (player) {
        player.pause();
        player.src = '';
    }
    
    modal.style.display = 'none';
    currentPlayingVideo = null;
}

// ============ UPLOAD VIDÉO ============
function openUploadModal() {
    console.log("Ouverture du modal d'upload");
    
    // Vérifier la connexion
    if (!currentUser) {
        showMessage("⚠️ Connectez-vous pour publier une vidéo");
        openAuthModal();
        return;
    }
    
    // Réinitialiser le formulaire
    document.getElementById('videoTitleInput').value = '';
    document.getElementById('videoDescriptionInput').value = '';
    document.getElementById('videoFileInput').value = '';
    
    // Afficher le modal
    document.getElementById('uploadModal').style.display = 'flex';
}

function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
}

function uploadVideo() {
    console.log("Début de l'upload...");
    
    // Récupérer les données du formulaire
    const title = document.getElementById('videoTitleInput').value.trim();
    const description = document.getElementById('videoDescriptionInput').value.trim();
    const fileInput = document.getElementById('videoFileInput');
    const file = fileInput.files[0];
    
    console.log("Titre:", title);
    console.log("Fichier:", file ? file.name : "Aucun");
    
    // VALIDATION
    if (!title) {
        showMessage("❌ Le titre est requis");
        return;
    }
    
    if (!file) {
        showMessage("❌ Sélectionnez un fichier vidéo");
        return;
    }
    
    // Vérifier la taille (max 2GB)
    if (file.size > 2 * 1024 * 1024 * 1024) {
        showMessage("❌ Fichier trop volumineux (max 2GB)");
        return;
    }
    
    // Vérifier le type
    const validTypes = ['video/mp4', 'video/mkv', 'video/avi', 'video/mov', 'video/webm'];
    if (!validTypes.includes(file.type)) {
        showMessage("❌ Format non supporté. Utilisez MP4, MKV, AVI ou MOV.");
        return;
    }
    
    // Afficher message de chargement
    showMessage("📤 Téléchargement en cours...");
    
    // Lire le fichier
    const reader = new FileReader();
    
    reader.onload = function(event) {
        console.log("Fichier lu avec succès, taille:", event.target.result.length);
        
        // Générer une miniature aléatoire
        const thumbnail = `https://picsum.photos/300/170?random=${Date.now()}`;
        
        // Créer l'objet vidéo
        const newVideo = {
            id: Date.now(),
            title: title,
            description: description,
            channel: currentUser.name,
            views: "0",
            date: "À l'instant",
            duration: "00:00",
            thumbnail: thumbnail,
            videoData: event.target.result,
            userId: currentUser.id,
            likes: 0,
            dislikes: 0,
            visibility: "public",
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
        };
        
        console.log("Nouvelle vidéo créée:", newVideo);
        
        // Ajouter à la liste des vidéos
        videos.unshift(newVideo);
        
        // Sauvegarder
        saveToStorage('animeref_videos', videos);
        
        // Réinitialiser le formulaire
        document.getElementById('videoTitleInput').value = '';
        document.getElementById('videoDescriptionInput').value = '';
        document.getElementById('videoFileInput').value = '';
        
        // Fermer le modal
        closeUploadModal();
        
        // Mettre à jour l'interface
        loadVideos();
        
        // Afficher message de succès
        showMessage("✅ Vidéo publiée avec succès !");
        
        // Afficher la section Accueil
        showSection('home');
        
        // Actualiser la liste des vidéos dans 1 seconde
        setTimeout(() => {
            loadVideos();
        }, 1000);
    };
    
    reader.onerror = function(error) {
        console.error("Erreur de lecture:", error);
        showMessage("❌ Erreur lors de la lecture du fichier");
    };
    
    // Lancer la lecture du fichier
    reader.readAsDataURL(file);
}

// ============ AUTHENTIFICATION ============
function openAuthModal() {
    console.log("Ouverture modal d'authentification");
    document.getElementById('authModal').style.display = 'flex';
    showLoginForm();
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

function showLoginForm() {
    document.querySelector('.auth-form').style.display = 'block';
    document.querySelector('.signup-form').style.display = 'none';
}

function showSignupForm() {
    document.querySelector('.auth-form').style.display = 'none';
    document.querySelector('.signup-form').style.display = 'block';
}

function login() {
    console.log("Tentative de connexion...");
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showMessage("❌ Email et mot de passe requis");
        return;
    }
    
    if (!email.includes('@')) {
        showMessage("❌ Format d'email invalide");
        return;
    }
    
    // Rechercher l'utilisateur
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        showMessage("❌ Email ou mot de passe incorrect");
        return;
    }
    
    // Connexion réussie
    currentUser = {
        id: user.id,
        name: user.name,
        email: user.email
    };
    
    // Sauvegarder la session
    saveToStorage('animeref_currentUser', currentUser);
    
    // Mettre à jour l'interface
    updateAuthUI();
    
    // Fermer le modal
    closeAuthModal();
    
    // Afficher message de bienvenue
    showMessage(`👋 Bienvenue ${currentUser.name} !`);
    
    // Recharger les vidéos
    setTimeout(() => {
        loadVideos();
    }, 500);
}

function signup() {
    console.log("Tentative d'inscription...");
    
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    
    if (!name || !email || !password) {
        showMessage("❌ Tous les champs sont requis");
        return;
    }
    
    if (password.length < 6) {
        showMessage("❌ Le mot de passe doit faire au moins 6 caractères");
        return;
    }
    
    if (!email.includes('@')) {
        showMessage("❌ Format d'email invalide");
        return;
    }
    
    // Vérifier si l'email existe déjà
    if (users.some(u => u.email === email)) {
        showMessage("❌ Cet email est déjà utilisé");
        return;
    }
    
    // Créer le nouvel utilisateur
    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: password
    };
    
    // Ajouter à la liste
    users.push(newUser);
    
    // Connecter automatiquement
    currentUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
    };
    
    // Sauvegarder
    saveToStorage('animeref_users', users);
    saveToStorage('animeref_currentUser', currentUser);
    
    // Mettre à jour l'interface
    updateAuthUI();
    
    // Fermer le modal
    closeAuthModal();
    
    // Afficher message
    showMessage(`🎉 Bienvenue sur Animeref, ${currentUser.name} !`);
    
    // Recharger
    setTimeout(() => {
        loadVideos();
    }, 500);
}

function checkAuthStatus() {
    if (currentUser) {
        updateAuthUI();
    }
}

function updateAuthUI() {
    console.log("Mise à jour de l'interface utilisateur");
    
    const signInBtn = document.getElementById('signInBtn');
    const userProfileBtn = document.getElementById('userProfileBtn');
    
    if (currentUser) {
        // Utilisateur connecté
        signInBtn.style.display = 'none';
        userProfileBtn.style.display = 'inline-block';
        document.getElementById('userName').textContent = currentUser.name;
        
        // Menu profil
        userProfileBtn.onclick = function(e) {
            e.stopPropagation();
            
            const menu = document.createElement('div');
            menu.style.cssText = `
                position: absolute;
                top: 70px;
                right: 20px;
                background-color: #1a1a1a;
                border: 1px solid #333;
                border-radius: 4px;
                padding: 10px 0;
                min-width: 180px;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            `;
            
            menu.innerHTML = `
                <div style="padding: 10px 20px; color: white; cursor: pointer; display: flex; align-items: center; gap: 10px;" onclick="showSection('my-videos')">
                    <i class="fas fa-video"></i> Mes vidéos
                </div>
                <div style="padding: 10px 20px; color: #ff4757; cursor: pointer; border-top: 1px solid #333; display: flex; align-items: center; gap: 10px;" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i> Déconnexion
                </div>
            `;
            
            document.body.appendChild(menu);
            
            // Fermer en cliquant ailleurs
            setTimeout(() => {
                const closeMenu = function(e) {
                    if (!menu.contains(e.target) && e.target !== userProfileBtn) {
                        menu.remove();
                        document.removeEventListener('click', closeMenu);
                    }
                };
                document.addEventListener('click', closeMenu);
            }, 0);
        };
    } else {
        // Utilisateur non connecté
        signInBtn.style.display = 'inline-block';
        userProfileBtn.style.display = 'none';
    }
}

function logout() {
    console.log("Déconnexion...");
    
    currentUser = null;
    localStorage.removeItem('animeref_currentUser');
    
    updateAuthUI();
    showMessage("👋 Déconnexion réussie");
    
    // Recharger les vidéos
    setTimeout(() => {
        loadVideos();
    }, 500);
}

// ============ MES VIDÉOS ============
function loadMyVideos() {
    const container = document.getElementById('myVideosList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!currentUser) {
        container.innerHTML = '<p class="empty-state">Connectez-vous pour voir vos vidéos</p>';
        return;
    }
    
    const userVideos = videos.filter(v => v.userId === currentUser.id);
    
    if (userVideos.length === 0) {
        container.innerHTML = '<p class="empty-state">Vous n\'avez pas encore publié de vidéos</p>';
        return;
    }
    
    userVideos.forEach(video => {
        const card = createVideoCard(video);
        container.appendChild(card);
    });
}

// ============ HISTORIQUE ============
function addToHistory(video) {
    if (!currentUser) return;
    
    const historyEntry = {
        ...video,
        watchedAt: new Date().toLocaleString('fr-FR')
    };
    
    // Éviter les doublons
    const existingIndex = watchHistory.findIndex(item => item.id === video.id);
    if (existingIndex !== -1) {
        watchHistory.splice(existingIndex, 1);
    }
    
    // Ajouter au début
    watchHistory.unshift(historyEntry);
    
    // Limiter à 50 entrées
    if (watchHistory.length > 50) {
        watchHistory.pop();
    }
    
    // Sauvegarder
    saveToStorage('animeref_history', watchHistory);
}

function showHistory() {
    const container = document.getElementById('historyList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (watchHistory.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucune vidéo visionnée</p>';
        return;
    }
    
    watchHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        
        div.innerHTML = `
            <div style="flex: 1;">
                <h4>${item.title}</h4>
                <p>${item.channel || 'Utilisateur'}</p>
                <small>Visionné le ${item.watchedAt}</small>
            </div>
        `;
        
        div.onclick = function() {
            playVideo(item);
        };
        
        container.appendChild(div);
    });
}

// ============ DONS ============
function openDonateModal() {
    console.log("Ouverture modal de dons");
    document.getElementById('donateModal').style.display = 'flex';
}

function closeDonateModal() {
    document.getElementById('donateModal').style.display = 'none';
}

function selectDonationAmount(amount) {
    console.log("Montant sélectionné:", amount);
    
    // Désélectionner tous les boutons
    document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Sélectionner le bouton cliqué
    event.target.classList.add('selected');
    
    // Mettre à jour le champ personnalisé
    document.getElementById('customAmount').value = amount;
}

function processDonation() {
    const amount = document.getElementById('customAmount').value;
    
    if (!amount || amount < 1) {
        showMessage("❌ Veuillez sélectionner un montant");
        return;
    }
    
    showMessage(`💳 Traitement du don de ${amount}€...`);
    
    // Simuler le traitement
    setTimeout(() => {
        closeDonateModal();
        showMessage(`✅ Merci pour votre don de ${amount}€ !`);
        
        // Réinitialiser
        document.querySelectorAll('.amount-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.getElementById('customAmount').value = '';
    }, 1500);
}

// ============ RECHERCHE ============
function searchVideos() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!query) {
        loadVideos();
        return;
    }
    
    console.log("Recherche:", query);
    
    const results = videos.filter(video => 
        video.title.toLowerCase().includes(query) ||
        (video.description && video.description.toLowerCase().includes(query))
    );
    
    // Mettre à jour toutes les sections
    ['homeVideos', 'trendingVideos'].forEach(sectionId => {
        const container = document.getElementById(sectionId);
        if (!container) return;
        
        container.innerHTML = '';
        
        if (results.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucun résultat trouvé</p>';
            return;
        }
        
        results.forEach(video => {
            const card = createVideoCard(video);
            container.appendChild(card);
        });
    });
}

// ============ ACTIONS VIDÉO ============
function likeVideo() {
    if (!currentUser) {
        showMessage("⚠️ Connectez-vous pour aimer une vidéo");
        return;
    }
    
    if (!currentPlayingVideo) return;
    
    // Trouver la vidéo
    const videoIndex = videos.findIndex(v => v.id === currentPlayingVideo.id);
    if (videoIndex !== -1) {
        videos[videoIndex].likes = (videos[videoIndex].likes || 0) + 1;
        saveToStorage('animeref_videos', videos);
        showMessage("👍 Merci pour votre like !");
    }
}

function deleteVideo() {
    if (!currentUser || !currentPlayingVideo) return;
    
    // Vérifier que c'est bien la vidéo de l'utilisateur
    if (currentPlayingVideo.userId !== currentUser.id) {
        showMessage("❌ Vous ne pouvez pas supprimer cette vidéo");
        return;
    }
    
    if (!confirm("Voulez-vous vraiment supprimer cette vidéo ?")) {
        return;
    }
    
    // Supprimer la vidéo
    videos = videos.filter(v => v.id !== currentPlayingVideo.id);
    
    // Sauvegarder
    saveToStorage('animeref_videos', videos);
    
    // Fermer le modal
    closeVideoModal();
    
    // Recharger les vidéos
    loadVideos();
    
    // Afficher message
    showMessage("✅ Vidéo supprimée avec succès");
}

// ============ NAVIGATION ============
function showSection(sectionId) {
    console.log("Changement de section:", sectionId);
    
    // Mettre à jour la sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === sectionId) {
            item.classList.add('active');
        }
    });
    
    // Afficher la section
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    // Charger les données spécifiques
    if (sectionId === 'history') {
        showHistory();
    } else if (sectionId === 'my-videos') {
        loadMyVideos();
    }
}

// ============ NOTIFICATIONS ============
function showMessage(message) {
    console.log("Message:", message);
    
    // Créer une notification si elle n'existe pas
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #333;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            z-index: 3000;
            display: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border-left: 4px solid #ff4757;
        `;
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.style.display = 'block';
    
    // Masquer après 3 secondes
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// ============ DÉBOGAGE ============
console.log("✅ Script.js entièrement chargé");
