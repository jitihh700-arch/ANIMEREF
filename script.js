// ANIMEREF - Version Complète avec toutes les fonctionnalités

// État global
const AppState = {
    currentUser: JSON.parse(localStorage.getItem('animeRefUser')) || null,
    users: JSON.parse(localStorage.getItem('animeRefUsers')) || {
        'admin': { id: 'admin_1', username: 'admin', email: 'admin@animeref.com', password: 'admin123', avatar: '👑', isAdmin: true, videos: [] }
    },
    videos: JSON.parse(localStorage.getItem('animeRefVideos')) || [],
    subscriptions: JSON.parse(localStorage.getItem('animeRefSubs')) || {},
    likes: JSON.parse(localStorage.getItem('animeRefLikes')) || {},
    views: JSON.parse(localStorage.getItem('animeRefViews')) || {},
    history: JSON.parse(localStorage.getItem('animeRefHistory')) || [],
    searchResults: [],
    uploadStep: 1,
    currentVideoFile: null
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    checkAuth();
});

function initApp() {
    // Navigation
    initNavigation();
    
    // Authentification
    initAuth();
    
    // Upload
    initUpload();
    
    // Recherche
    initSearch();
    
    // Dons
    initDonations();
    
    // Initial render
    renderHomeVideos();
    renderHistory();
    renderSubscriptions();
    updateUI();
}

// ==================== AUTHENTIFICATION ====================

function initAuth() {
    // Connexion Google simulée
    document.getElementById('google-login')?.addEventListener('click', function() {
        const username = prompt("Entrez votre nom d'utilisateur Google:");
        const email = prompt("Entrez votre email:");
        
        if (username && email) {
            const userId = 'google_' + Date.now();
            const user = {
                id: userId,
                username: username,
                email: email,
                avatar: `https://ui-avatars.com/api/?name=${username}&background=4285F4&color=fff`,
                provider: 'google',
                joinDate: new Date().toLocaleDateString('fr-FR'),
                videos: []
            };
            
            AppState.users[username] = user;
            AppState.currentUser = user;
            saveUserData();
            updateUI();
            showMessage(`Connecté avec Google en tant que ${username}`, 'success');
            closeModal('auth-modal');
        }
    });
    
    // Connexion Email
    document.getElementById('email-login')?.addEventListener('click', function() {
        document.getElementById('auth-modal').style.display = 'none';
        document.getElementById('login-modal').style.display = 'block';
    });
    
    // Formulaires
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('register-form')?.addEventListener('submit', handleRegister);
    document.getElementById('logout-btn')?.addEventListener('click', logout);
}

function checkAuth() {
    if (!AppState.currentUser) {
        document.getElementById('auth-section').style.display = 'flex';
        document.getElementById('user-section').style.display = 'none';
    } else {
        updateUI();
    }
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    const user = AppState.users[username];
    
    if (user && user.password === password) {
        AppState.currentUser = user;
        saveUserData();
        updateUI();
        showMessage(`Bienvenue ${username} !`, 'success');
        closeModal('login-modal');
    } else {
        showMessage('Identifiants incorrects', 'error');
    }
}

function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    if (AppState.users[username]) {
        showMessage('Ce nom d\'utilisateur existe déjà', 'error');
        return;
    }
    
    const userId = 'user_' + Date.now();
    const user = {
        id: userId,
        username: username,
        email: email,
        password: password,
        avatar: `https://ui-avatars.com/api/?name=${username}&background=f47521&color=fff`,
        joinDate: new Date().toLocaleDateString('fr-FR'),
        videos: [],
        subscribers: 0
    };
    
    AppState.users[username] = user;
    AppState.currentUser = user;
    saveUserData();
    
    showMessage(`Compte créé pour ${username} !`, 'success');
    closeModal('register-modal');
    updateUI();
}

function logout() {
    AppState.currentUser = null;
    localStorage.removeItem('animeRefUser');
    updateUI();
    showMessage('Déconnexion réussie', 'success');
}

// ==================== UPLOAD EN ÉTAPES ====================

function initUpload() {
    // Étape 1: Sélection du fichier
    document.getElementById('video-file')?.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            AppState.currentVideoFile = file;
            document.getElementById('file-name').textContent = file.name;
            document.getElementById('file-size').textContent = formatFileSize(file.size);
            document.getElementById('step1-next').disabled = false;
        }
    });
    
    // Navigation des étapes
    document.getElementById('step1-next')?.addEventListener('click', goToStep2);
    document.getElementById('step2-back')?.addEventListener('click', goToStep1);
    document.getElementById('step2-next')?.addEventListener('click', goToStep3);
    document.getElementById('step3-back')?.addEventListener('click', goToStep2);
    document.getElementById('submit-video')?.addEventListener('click', uploadVideo);
}

function goToStep2() {
    if (!AppState.currentVideoFile) {
        showMessage('Sélectionnez d\'abord une vidéo', 'error');
        return;
    }
    
    AppState.uploadStep = 2;
    updateUploadUI();
}

function goToStep1() {
    AppState.uploadStep = 1;
    updateUploadUI();
}

function goToStep3() {
    const title = document.getElementById('upload-title').value;
    const description = document.getElementById('upload-description').value;
    
    if (!title.trim()) {
        showMessage('Donnez un titre à votre vidéo', 'error');
        return;
    }
    
    // Vérification copyright
    const hasCopyright = checkForCopyright(title + ' ' + description);
    
    if (hasCopyright) {
        document.getElementById('copyright-result').innerHTML = `
            <div class="message error">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>CONTENU PROTÉGÉ DÉTECTÉ !</strong>
                <p>Votre vidéo contient des références à du contenu protégé.</p>
                <p>Elle sera supprimée automatiquement.</p>
            </div>
        `;
        document.getElementById('submit-video').disabled = true;
    } else {
        document.getElementById('copyright-result').innerHTML = `
            <div class="message success">
                <i class="fas fa-check-circle"></i>
                <strong>AUCUN CONTENU PROTÉGÉ</strong>
                <p>Votre vidéo peut être publiée.</p>
            </div>
        `;
        document.getElementById('submit-video').disabled = false;
    }
    
    AppState.uploadStep = 3;
    updateUploadUI();
}

function goToStep2() {
    AppState.uploadStep = 2;
    updateUploadUI();
}

function updateUploadUI() {
    // Masquer toutes les étapes
    document.querySelectorAll('.upload-step').forEach(step => {
        step.style.display = 'none';
    });
    
    // Afficher l'étape courante
    document.getElementById(`step${AppState.uploadStep}`).style.display = 'block';
    
    // Mettre à jour la progression
    document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
        if (index + 1 < AppState.uploadStep) {
            indicator.className = 'step-indicator completed';
        } else if (index + 1 === AppState.uploadStep) {
            indicator.className = 'step-indicator active';
        } else {
            indicator.className = 'step-indicator';
        }
    });
}

function uploadVideo() {
    if (!AppState.currentUser) {
        showMessage('Connectez-vous pour uploader', 'error');
        showModal('auth-modal');
        return;
    }
    
    const title = document.getElementById('upload-title').value;
    const description = document.getElementById('upload-description').value;
    const file = AppState.currentVideoFile;
    
    // Créer la vidéo
    const videoURL = URL.createObjectURL(file);
    const videoId = 'video_' + Date.now();
    
    const video = {
        id: videoId,
        title: title,
        description: description,
        url: videoURL,
        author: AppState.currentUser.username,
        authorId: AppState.currentUser.id,
        views: 0,
        likes: 0,
        uploadDate: new Date().toLocaleDateString('fr-FR'),
        timestamp: Date.now(),
        fileName: file.name,
        fileSize: file.size,
        isPublic: true,
        category: 'animation'
    };
    
    // Ajouter
    AppState.videos.unshift(video);
    AppState.currentUser.videos.push(videoId);
    AppState.users[AppState.currentUser.username] = AppState.currentUser;
    
    // Sauvegarder
    localStorage.setItem('animeRefVideos', JSON.stringify(AppState.videos));
    localStorage.setItem('animeRefUsers', JSON.stringify(AppState.users));
    localStorage.setItem('animeRefUser', JSON.stringify(AppState.currentUser));
    
    // Réinitialiser
    resetUploadForm();
    
    // Mettre à jour
    renderHomeVideos();
    showMessage('Vidéo publiée avec succès !', 'success');
    
    // Retour à l'accueil
    showSection('home-section');
}

function checkForCopyright(text) {
    const lowerText = text.toLowerCase();
    const copyrightTerms = [
        'crunchyroll', 'netflix', 'disney', 'hbo', 'hulu',
        'épisode', 'saison', 'oav', 'ova', 'vf', 'vostfr',
        'one piece', 'naruto', 'attack on titan', 'dragon ball',
        'studio ghibli', 'toei', 'madhouse', 'bones',
        'streaming illégal', 'téléchargement', 'torrent'
    ];
    
    return copyrightTerms.some(term => lowerText.includes(term));
}

function resetUploadForm() {
    AppState.uploadStep = 1;
    AppState.currentVideoFile = null;
    document.getElementById('upload-form').reset();
    document.getElementById('file-name').textContent = 'Aucun fichier sélectionné';
    document.getElementById('file-size').textContent = '';
    updateUploadUI();
}

// ==================== RECHERCHE ====================

function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') performSearch();
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
}

function performSearch() {
    const query = document.getElementById('search-input').value.toLowerCase();
    if (!query.trim()) return;
    
    AppState.searchResults = AppState.videos.filter(video => 
        video.title.toLowerCase().includes(query) || 
        video.description.toLowerCase().includes(query) ||
        video.author.toLowerCase().includes(query)
    );
    
    renderSearchResults();
    showSection('search-section');
}

function renderSearchResults() {
    const container = document.getElementById('search-results');
    if (!container) return;
    
    if (AppState.searchResults.length === 0) {
        container.innerHTML = '<p class="empty-message">Aucun résultat trouvé</p>';
        return;
    }
    
    container.innerHTML = '';
    
    AppState.searchResults.forEach(video => {
        const videoElement = createVideoElement(video);
        container.appendChild(videoElement);
    });
}

// ==================== ABONNEMENTS ====================

function toggleSubscription(channel) {
    if (!AppState.currentUser) {
        showMessage('Connectez-vous pour vous abonner', 'error');
        showModal('auth-modal');
        return;
    }
    
    const userId = AppState.currentUser.id;
    
    if (!AppState.subscriptions[userId]) {
        AppState.subscriptions[userId] = [];
    }
    
    const isSubscribed = AppState.subscriptions[userId].includes(channel);
    
    if (isSubscribed) {
        // Se désabonner
        AppState.subscriptions[userId] = AppState.subscriptions[userId].filter(c => c !== channel);
        showMessage(`Désabonné de ${channel}`, 'info');
    } else {
        // S'abonner
        AppState.subscriptions[userId].push(channel);
        showMessage(`Abonné à ${channel} !`, 'success');
    }
    
    localStorage.setItem('animeRefSubs', JSON.stringify(AppState.subscriptions));
    renderSubscriptions();
}

function renderSubscriptions() {
    const container = document.getElementById('subscriptions-list');
    if (!container) return;
    
    if (!AppState.currentUser) {
        container.innerHTML = '<p class="empty-message">Connectez-vous pour voir vos abonnements</p>';
        return;
    }
    
    const userSubs = AppState.subscriptions[AppState.currentUser.id] || [];
    
    if (userSubs.length === 0) {
        container.innerHTML = '<p class="empty-message">Pas encore d\'abonnements</p>';
        return;
    }
    
    container.innerHTML = '';
    
    userSubs.forEach(channel => {
        const user = AppState.users[channel];
        if (!user) return;
        
        const subElement = document.createElement('div');
        subElement.className = 'subscription-item';
        subElement.innerHTML = `
            <img src="${user.avatar}" alt="${channel}" class="avatar">
            <div class="subscription-info">
                <div class="subscription-name">${channel}</div>
                <div class="subscription-stats">${user.videos?.length || 0} vidéos</div>
            </div>
            <button onclick="unsubscribe('${channel}')" class="btn btn-danger btn-sm">
                <i class="fas fa-user-minus"></i>
            </button>
        `;
        
        subElement.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                showChannelVideos(channel);
            }
        });
        
        container.appendChild(subElement);
    });
}

function unsubscribe(channel) {
    if (!AppState.currentUser) return;
    
    const userId = AppState.currentUser.id;
    if (AppState.subscriptions[userId]) {
        AppState.subscriptions[userId] = AppState.subscriptions[userId].filter(c => c !== channel);
        localStorage.setItem('animeRefSubs', JSON.stringify(AppState.subscriptions));
        renderSubscriptions();
        showMessage(`Désabonné de ${channel}`, 'info');
    }
}

function showChannelVideos(channel) {
    const channelVideos = AppState.videos.filter(v => v.author === channel);
    document.getElementById('channel-name').textContent = channel;
    
    const container = document.getElementById('channel-videos');
    container.innerHTML = '';
    
    if (channelVideos.length === 0) {
        container.innerHTML = '<p class="empty-message">Aucune vidéo de cette chaîne</p>';
    } else {
        channelVideos.forEach(video => {
            const videoElement = createVideoElement(video);
            container.appendChild(videoElement);
        });
    }
    
    showSection('channel-section');
}

// ==================== ACCUEIL & HISTORIQUE ====================

function renderHomeVideos() {
    const container = document.getElementById('home-videos');
    if (!container) return;
    
    // Filtrer les vidéos les plus récentes
    const recentVideos = [...AppState.videos]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20);
    
    if (recentVideos.length === 0) {
        container.innerHTML = '<p class="empty-message">Aucune vidéo disponible. Soyez le premier à uploader !</p>';
        return;
    }
    
    container.innerHTML = '';
    
    recentVideos.forEach(video => {
        const videoElement = createVideoElement(video);
        container.appendChild(videoElement);
    });
}

function renderHistory() {
    const container = document.getElementById('history-list');
    if (!container) return;
    
    if (!AppState.currentUser || AppState.history.length === 0) {
        container.innerHTML = '<p class="empty-message">Aucun historique</p>';
        return;
    }
    
    container.innerHTML = '';
    
    // Récupérer l'historique de l'utilisateur
    const userHistory = AppState.history
        .filter(entry => entry.userId === AppState.currentUser.id)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20);
    
    userHistory.forEach(entry => {
        const video = AppState.videos.find(v => v.id === entry.videoId);
        if (!video) return;
        
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="video-thumbnail-small">
                <i class="fas fa-play-circle"></i>
            </div>
            <div class="history-info">
                <div class="history-title">${video.title}</div>
                <div class="history-details">
                    <span>${video.author}</span>
                    <span>•</span>
                    <span>${entry.date}</span>
                </div>
            </div>
        `;
        
        historyItem.addEventListener('click', () => {
            playVideo(video.id);
            showSection('home-section');
        });
        
        container.appendChild(historyItem);
    });
}

// ==================== LECTURE VIDÉO ====================

function playVideo(videoId) {
    const video = AppState.videos.find(v => v.id === videoId);
    if (!video) return;
    
    // Mettre à jour le lecteur
    const videoPlayer = document.getElementById('main-video-player');
    const videoTitle = document.getElementById('playing-title');
    const videoAuthor = document.getElementById('playing-author');
    
    videoPlayer.src = video.url;
    videoTitle.textContent = video.title;
    videoAuthor.textContent = video.author;
    
    // Ajouter à l'historique
    if (AppState.currentUser) {
        const historyEntry = {
            videoId: videoId,
            userId: AppState.currentUser.id,
            date: new Date().toLocaleString('fr-FR'),
            timestamp: Date.now()
        };
        
        AppState.history.push(historyEntry);
        localStorage.setItem('animeRefHistory', JSON.stringify(AppState.history));
        renderHistory();
    }
    
    // Incrémenter les vues
    video.views = (video.views || 0) + 1;
    localStorage.setItem('animeRefVideos', JSON.stringify(AppState.videos));
    
    // Lire la vidéo
    videoPlayer.play();
    showSection('watch-section');
}

// ==================== DONS ====================

function initDonations() {
    document.getElementById('donate-btn')?.addEventListener('click', showDonationOptions);
    document.getElementById('mobile-money-btn')?.addEventListener('click', showMobileMoneyDonation);
    document.getElementById('paypal-btn')?.addEventListener('click', showPayPalDonation);
    document.getElementById('confirm-donation')?.addEventListener('click', processDonation);
}

function showDonationOptions() {
    document.getElementById('donate-modal').style.display = 'block';
}

function showMobileMoneyDonation() {
    document.getElementById('donate-modal').style.display = 'none';
    document.getElementById('mobile-money-modal').style.display = 'block';
}

function showPayPalDonation() {
    document.getElementById('donate-modal').style.display = 'none';
    document.getElementById('paypal-modal').style.display = 'block';
}

function processDonation() {
    const amount = document.getElementById('donate-amount').value;
    const method = document.getElementById('donate-method').value;
    
    if (!amount || amount < 1) {
        showMessage('Montant invalide', 'error');
        return;
    }
    
    // Simulation de don réussi
    showMessage(`Don de ${amount}€ envoyé ! Merci ❤️`, 'success');
    
    // Informations pour l'utilisateur
    let info = `\n\nPour compléter votre don de ${amount}€ :\n\n`;
    
    if (method === 'mobile') {
        info += `📱 Envoyez ${amount}€ au : 07 09 65 63 59\n`;
        info += `📞 Votre don arrivera directement sur mon téléphone\n`;
        info += `✉️ Envoyez un SMS à ce numéro après paiement`;
    } else if (method === 'paypal') {
        info += `💳 Paypal : jitihh700@gmail.com\n`;
        info += `🔗 L'argent arrive sur mon compte Paypal\n`;
        info += `📧 Mentionnez "ANIMEREF" dans le message`;
    }
    
    alert(`Merci pour votre soutien !${info}`);
    
    // Fermer les modales
    closeAllModals();
    
    // Réinitialiser
    document.getElementById('donate-amount').value = '';
}

// ==================== UTILITAIRES ====================

function createVideoElement(video) {
    const element = document.createElement('div');
    element.className = 'video-item';
    element.innerHTML = `
        <div class="video-thumb">
            <i class="fas fa-play-circle"></i>
            <div class="video-duration">${formatDuration(video.duration)}</div>
        </div>
        <div class="video-info">
            <div class="video-title">${video.title}</div>
            <div class="video-author">${video.author}</div>
            <div class="video-stats">
                <span><i class="fas fa-eye"></i> ${video.views || 0}</span>
                <span><i class="fas fa-clock"></i> ${video.uploadDate}</span>
            </div>
        </div>
    `;
    
    element.addEventListener('click', () => {
        playVideo(video.id);
    });
    
    return element;
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(1) + ' GB';
}

function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    
    // Mettre à jour la navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[href="#${sectionId}"]`);
    if (activeLink) activeLink.classList.add('active');
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function updateUI() {
    if (AppState.currentUser) {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('user-section').style.display = 'flex';
        document.getElementById('username-display').textContent = AppState.currentUser.username;
        
        // Activer l'upload
        document.querySelectorAll('.upload-only').forEach(el => {
            el.style.display = 'block';
        });
    } else {
        document.getElementById('auth-section').style.display = 'flex';
        document.getElementById('user-section').style.display = 'none';
        
        // Désactiver l'upload
        document.querySelectorAll('.upload-only').forEach(el => {
            el.style.display = 'none';
        });
    }
}

function showMessage(text, type) {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    message.style.position = 'fixed';
    message.style.top = '20px';
    message.style.right = '20px';
    message.style.zIndex = '1000';
    
    document.body.appendChild(message);
    
    setTimeout(() => message.remove(), 3000);
}

function saveUserData() {
    localStorage.setItem('animeRefUser', JSON.stringify(AppState.currentUser));
    localStorage.setItem('animeRefUsers', JSON.stringify(AppState.users));
}

// Fonctions globales
window.closeModal = closeModal;
window.closeAllModals = closeAllModals;
window.showModal = showModal;
window.toggleSubscription = toggleSubscription;
window.unsubscribe = unsubscribe;
window.playVideo = playVideo;

// Initial navigation
function initNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            showSection(sectionId);
        });
    });
}
