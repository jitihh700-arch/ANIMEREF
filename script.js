// === VARIABLES GLOBALES ===
let videos = [];
let users = [];
let currentUser = null;
let watchHistory = [];

// === INITIALISATION ===
document.addEventListener('DOMContentLoaded', function() {
    // Charger les données
    loadData();
    
    // Afficher interface vide
    loadVideos();
    
    // Attacher tous les événements
    attachEvents();
    
    // Afficher notification de démarrage
    showNotification("Animeref prêt !");
});

// === CHARGEMENT DES DONNÉES ===
function loadData() {
    // Charger depuis localStorage
    const savedVideos = localStorage.getItem('animeref_videos');
    const savedUsers = localStorage.getItem('animeref_users');
    const savedHistory = localStorage.getItem('animeref_history');
    const savedUser = localStorage.getItem('animeref_currentUser');
    
    if (savedVideos) videos = JSON.parse(savedVideos);
    if (savedUsers) users = JSON.parse(savedUsers);
    if (savedHistory) watchHistory = JSON.parse(savedHistory);
    if (savedUser) currentUser = JSON.parse(savedUser);
    
    // Aucune vidéo par défaut - interface vide
    if (videos.length === 0) {
        // Interface vide comme demandé
    }
    
    // Utilisateur admin par défaut
    if (users.length === 0) {
        users = [
            {
                id: 1,
                name: "Admin",
                email: "admin@animeref.com",
                password: "admin123"
            }
        ];
        localStorage.setItem('animeref_users', JSON.stringify(users));
    }
    
    // Mettre à jour l'interface utilisateur
    updateAuthUI();
}

// === ATTACHER ÉVÉNEMENTS ===
function attachEvents() {
    // Navigation
    document.getElementById('uploadBtn').onclick = openUploadModal;
    document.getElementById('signInBtn').onclick = openAuthModal;
    document.getElementById('donateBtn').onclick = openDonateModal;
    document.getElementById('searchBtn').onclick = searchVideos;
    
    // Fermeture modals
    document.getElementById('closeVideoModal').onclick = closeVideoModal;
    document.getElementById('closeUploadModal').onclick = closeUploadModal;
    document.getElementById('closeAuthModal').onclick = closeAuthModal;
    document.getElementById('closeDonateModal').onclick = closeDonateModal;
    
    // Auth
    document.getElementById('loginBtn').onclick = login;
    document.getElementById('signupBtn').onclick = signup;
    document.getElementById('showSignup').onclick = showSignupForm;
    document.getElementById('showLogin').onclick = showLoginForm;
    
    // Upload
    document.getElementById('submitVideoBtn').onclick = uploadVideo;
    
    // Dons
    document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.onclick = function() {
            const amount = this.getAttribute('data-amount');
            selectDonationAmount(amount);
        };
    });
    document.getElementById('customDonateBtn').onclick = processDonation;
    
    // Actions vidéo
    document.getElementById('likeBtn').onclick = likeVideo;
    document.getElementById('deleteBtn').onclick = deleteVideo;
    
    // Sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.onclick = function() {
            const section = this.getAttribute('data-section');
            showSection(section);
        };
    });
    
    // Recherche par Enter
    document.getElementById('searchInput').onkeypress = function(e) {
        if (e.key === 'Enter') searchVideos();
    };
    
    // Fermer modals en cliquant à l'extérieur
    window.onclick = function(event) {
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
    };
}

// === GESTION DES VIDÉOS ===
function loadVideos() {
    const sections = ['homeVideos', 'trendingVideos'];
    
    sections.forEach(sectionId => {
        const container = document.getElementById(sectionId);
        if (!container) return;
        
        container.innerHTML = '';
        
        // Afficher seulement les vidéos publiques
        const publicVideos = videos.filter(v => v.visibility === 'public');
        
        if (publicVideos.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucune vidéo disponible</p>';
            return;
        }
        
        publicVideos.forEach(video => {
            const card = createVideoCard(video);
            container.appendChild(card);
        });
    });
    
    // Charger mes vidéos
    loadMyVideos();
}

function createVideoCard(video) {
    const div = document.createElement('div');
    div.className = 'video-card';
    
    div.innerHTML = `
        <div class="video-thumbnail">
            ${video.thumbnail ? `<img src="${video.thumbnail}" alt="${video.title}">` : ''}
        </div>
        <div class="video-info">
            <h3>${video.title}</h3>
            <p>${video.channel} • ${video.views || '0'} vues</p>
        </div>
    `;
    
    div.onclick = function() {
        playVideo(video);
    };
    
    return div;
}

function playVideo(video) {
    const modal = document.getElementById('videoModal');
    
    // Mettre à jour les infos
    document.getElementById('videoTitle').textContent = video.title;
    document.getElementById('videoDescription').textContent = video.description || '';
    
    // Configurer la vidéo
    const player = document.getElementById('videoPlayer');
    if (video.videoData) {
        player.src = video.videoData;
    } else if (video.videoUrl) {
        player.src = video.videoUrl;
    }
    
    // Bouton supprimer
    const deleteBtn = document.getElementById('deleteBtn');
    if (currentUser && video.userId === currentUser.id) {
        deleteBtn.style.display = 'block';
    } else {
        deleteBtn.style.display = 'none';
    }
    
    // Ajouter à l'historique
    addToHistory(video);
    
    // Afficher le modal
    modal.style.display = 'flex';
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    
    if (player) {
        player.pause();
        player.src = '';
    }
    
    modal.style.display = 'none';
}

// === UPLOAD DE VIDÉO ===
function openUploadModal() {
    if (!currentUser) {
        showNotification("Connectez-vous pour publier");
        openAuthModal();
        return;
    }
    
    document.getElementById('uploadModal').style.display = 'flex';
}

function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
}

function uploadVideo() {
    const title = document.getElementById('videoTitleInput').value;
    const description = document.getElementById('videoDescriptionInput').value;
    const fileInput = document.getElementById('videoFileInput');
    
    if (!title) {
        showNotification("Le titre est requis");
        return;
    }
    
    if (!fileInput.files[0]) {
        showNotification("Sélectionnez un fichier vidéo");
        return;
    }
    
    const file = fileInput.files[0];
    
    // Lire le fichier
    const reader = new FileReader();
    reader.onload = function(e) {
        // Créer la nouvelle vidéo
        const newVideo = {
            id: Date.now(),
            title: title,
            description: description,
            channel: currentUser.name,
            views: "0",
            date: new Date().toLocaleDateString('fr-FR'),
            thumbnail: null,
            videoData: e.target.result,
            userId: currentUser.id,
            likes: 0,
            visibility: "public"
        };
        
        // Ajouter aux vidéos
        videos.unshift(newVideo);
        
        // Sauvegarder
        localStorage.setItem('animeref_videos', JSON.stringify(videos));
        
        // Mettre à jour l'interface
        loadVideos();
        
        // Fermer et notifier
        closeUploadModal();
        showNotification("Vidéo publiée avec succès !");
        
        // Réinitialiser le formulaire
        document.getElementById('videoTitleInput').value = '';
        document.getElementById('videoDescriptionInput').value = '';
        document.getElementById('videoFileInput').value = '';
    };
    
    reader.readAsDataURL(file);
}

// === AUTHENTIFICATION ===
function openAuthModal() {
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
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification("Email et mot de passe requis");
        return;
    }
    
    // Chercher l'utilisateur
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        showNotification("Email ou mot de passe incorrect");
        return;
    }
    
    // Connecter
    currentUser = {
        id: user.id,
        name: user.name,
        email: user.email
    };
    
    localStorage.setItem('animeref_currentUser', JSON.stringify(currentUser));
    
    // Mettre à jour l'interface
    updateAuthUI();
    
    // Fermer modal
    closeAuthModal();
    
    // Notifier
    showNotification(`Bienvenue ${currentUser.name} !`);
    
    // Recharger les vidéos
    loadVideos();
}

function signup() {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    if (!name || !email || !password) {
        showNotification("Tous les champs sont requis");
        return;
    }
    
    // Vérifier si l'email existe déjà
    if (users.some(u => u.email === email)) {
        showNotification("Cet email est déjà utilisé");
        return;
    }
    
    // Créer nouvel utilisateur
    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: password
    };
    
    users.push(newUser);
    currentUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
    };
    
    // Sauvegarder
    localStorage.setItem('animeref_users', JSON.stringify(users));
    localStorage.setItem('animeref_currentUser', JSON.stringify(currentUser));
    
    // Mettre à jour l'interface
    updateAuthUI();
    
    // Fermer modal
    closeAuthModal();
    
    // Notifier
    showNotification(`Compte créé avec succès ! Bienvenue ${currentUser.name}`);
    
    // Recharger les vidéos
    loadVideos();
}

function updateAuthUI() {
    const signInBtn = document.getElementById('signInBtn');
    const userProfileBtn = document.getElementById('userProfileBtn');
    
    if (currentUser) {
        signInBtn.style.display = 'none';
        userProfileBtn.style.display = 'inline-block';
        document.getElementById('userName').textContent = currentUser.name;
        
        // Menu profil
        userProfileBtn.onclick = function(e) {
            e.stopPropagation();
            
            const menu = document.createElement('div');
            menu.style.cssText = `
                position: absolute;
                top: 60px;
                right: 20px;
                background-color: #1a1a1a;
                border: 1px solid #333;
                padding: 10px 0;
                border-radius: 4px;
                min-width: 150px;
                z-index: 1000;
            `;
            
            menu.innerHTML = `
                <div style="padding: 10px 20px; color: white; cursor: pointer;" onclick="showSection('my-videos')">
                    Mes vidéos
                </div>
                <div style="padding: 10px 20px; color: #ff4757; cursor: pointer; border-top: 1px solid #333;" onclick="logout()">
                    Déconnexion
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
        signInBtn.style.display = 'inline-block';
        userProfileBtn.style.display = 'none';
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('animeref_currentUser');
    updateAuthUI();
    showNotification("Déconnecté");
    loadVideos();
}

// === MES VIDÉOS ===
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
        const div = document.createElement('div');
        div.className = 'video-card';
        
        div.innerHTML = `
            <div class="video-thumbnail">
                ${video.thumbnail ? `<img src="${video.thumbnail}" alt="${video.title}">` : ''}
            </div>
            <div class="video-info">
                <h3>${video.title}</h3>
                <p>${video.views || '0'} vues • ${video.date}</p>
            </div>
        `;
        
        div.onclick = function() {
            playVideo(video);
        };
        
        container.appendChild(div);
    });
}

// === HISTORIQUE ===
function addToHistory(video) {
    if (!currentUser) return;
    
    // Créer l'entrée d'historique
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
    localStorage.setItem('animeref_history', JSON.stringify(watchHistory));
    
    // Mettre à jour l'affichage si on est sur la page historique
    if (document.getElementById('history').classList.contains('active')) {
        showHistory();
    }
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
                <p>${item.channel}</p>
                <small>Visionné le ${item.watchedAt}</small>
            </div>
        `;
        
        div.onclick = function() {
            playVideo(item);
        };
        
        container.appendChild(div);
    });
}

// === DONS ===
function openDonateModal() {
    document.getElementById('donateModal').style.display = 'flex';
}

function closeDonateModal() {
    document.getElementById('donateModal').style.display = 'none';
}

function selectDonationAmount(amount) {
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
        showNotification("Veuillez sélectionner un montant");
        return;
    }
    
    showNotification(`Merci pour votre don de ${amount}€ !`);
    
    // Simuler le traitement
    setTimeout(() => {
        closeDonateModal();
        showNotification("Don traité avec succès");
        
        // Réinitialiser
        document.querySelectorAll('.amount-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.getElementById('customAmount').value = '';
    }, 1000);
}

// === RECHERCHE ===
function searchVideos() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    
    if (!query) {
        loadVideos();
        return;
    }
    
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

// === ACTIONS VIDÉO ===
function likeVideo() {
    if (!currentUser) {
        showNotification("Connectez-vous pour aimer une vidéo");
        return;
    }
    
    // Logique de like (simplifiée)
    showNotification("Merci pour votre like !");
}

function deleteVideo() {
    if (!currentUser) return;
    
    const player = document.getElementById('videoPlayer');
    const videoSrc = player.src;
    
    // Trouver la vidéo par sa source
    const videoIndex = videos.findIndex(v => 
        v.videoData === videoSrc || v.videoUrl === videoSrc
    );
    
    if (videoIndex === -1) return;
    
    const video = videos[videoIndex];
    
    // Vérifier que c'est bien la vidéo de l'utilisateur
    if (video.userId !== currentUser.id) {
        showNotification("Vous ne pouvez pas supprimer cette vidéo");
        return;
    }
    
    if (confirm("Voulez-vous vraiment supprimer cette vidéo ?")) {
        // Supprimer la vidéo
        videos.splice(videoIndex, 1);
        
        // Sauvegarder
        localStorage.setItem('animeref_videos', JSON.stringify(videos));
        
        // Fermer le modal
        closeVideoModal();
        
        // Recharger les vidéos
        loadVideos();
        
        // Notifier
        showNotification("Vidéo supprimée avec succès");
    }
}

// === NAVIGATION ===
function showSection(sectionId) {
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
    
    // Charger les données si nécessaire
    if (sectionId === 'history') {
        showHistory();
    }
    if (sectionId === 'my-videos') {
        loadMyVideos();
    }
}

// === NOTIFICATIONS ===
function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}
