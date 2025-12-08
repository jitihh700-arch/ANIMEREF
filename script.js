// ANIMEREF V2 - Plateforme Communautaire Légale
// Tous droits réservés - Contenu original uniquement

// État global
const AppState = {
    currentUser: JSON.parse(localStorage.getItem('animeRefUser')) || null,
    users: JSON.parse(localStorage.getItem('animeRefUsers')) || {},
    videos: JSON.parse(localStorage.getItem('animeRefVideos')) || [],
    subscriptions: JSON.parse(localStorage.getItem('animeRefSubs')) || {},
    comments: JSON.parse(localStorage.getItem('animeRefComments')) || {},
    likes: JSON.parse(localStorage.getItem('animeRefLikes')) || {},
    views: JSON.parse(localStorage.getItem('animeRefViews')) || {},
    donations: JSON.parse(localStorage.getItem('animeRefDonations')) || 0,
    currentVideoId: null,
    isAdmin: false
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    checkAuthStatus();
});

function initApp() {
    // Navigation
    initNavigation();
    
    // Authentification
    initAuth();
    
    // Vidéo
    initVideoEvents();
    
    // Commentaires
    initComments();
    
    // Upload
    initUpload();
    
    // Abonnements
    initSubscriptions();
    
    // Dons
    initDonations();
    
    // Initial render
    renderLibrary();
    renderSubscriptions();
    updateUserUI();
}

// ==================== AUTHENTIFICATION ====================

function initAuth() {
    // Boutons login/register
    document.getElementById('login-btn')?.addEventListener('click', showLoginModal);
    document.getElementById('register-btn')?.addEventListener('click', showRegisterModal);
    document.getElementById('logout-btn')?.addEventListener('click', logout);
    
    // Forms
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('register-form')?.addEventListener('submit', handleRegister);
}

function checkAuthStatus() {
    const user = AppState.currentUser;
    if (user) {
        AppState.isAdmin = user.username === 'admin';
        updateUserUI();
        showMessage(`Bienvenue ${user.username} !`, 'success');
    } else {
        showMessage('Connectez-vous pour profiter de toutes les fonctionnalités', 'info');
    }
}

function showLoginModal() {
    document.getElementById('login-modal').style.display = 'block';
}

function showRegisterModal() {
    document.getElementById('register-modal').style.display = 'block';
}

function closeModals() {
    document.getElementById('login-modal').style.display = 'none';
    document.getElementById('register-modal').style.display = 'none';
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    // Vérification simple
    const user = Object.values(AppState.users).find(u => 
        u.username === username && u.password === password
    );
    
    if (user) {
        AppState.currentUser = user;
        localStorage.setItem('animeRefUser', JSON.stringify(user));
        closeModals();
        checkAuthStatus();
        showMessage('Connexion réussie !', 'success');
    } else {
        showMessage('Identifiants incorrects', 'error');
    }
}

function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    
    if (password !== confirm) {
        showMessage('Les mots de passe ne correspondent pas', 'error');
        return;
    }
    
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
        subscribers: 0,
        videos: []
    };
    
    AppState.users[username] = user;
    AppState.currentUser = user;
    localStorage.setItem('animeRefUsers', JSON.stringify(AppState.users));
    localStorage.setItem('animeRefUser', JSON.stringify(user));
    
    closeModals();
    checkAuthStatus();
    showMessage('Compte créé avec succès !', 'success');
}

function logout() {
    AppState.currentUser = null;
    localStorage.removeItem('animeRefUser');
    updateUserUI();
    showMessage('Déconnexion réussie', 'success');
}

// ==================== UPLOAD SÉCURISÉ ====================

function initUpload() {
    const uploadForm = document.getElementById('upload-form');
    if (!uploadForm) return;
    
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!AppState.currentUser) {
            showMessage('Connectez-vous pour uploader une vidéo', 'error');
            showLoginModal();
            return;
        }
        
        const title = document.getElementById('video-title').value;
        const description = document.getElementById('video-description').value;
        const videoFile = document.getElementById('video-file').files[0];
        
        if (!videoFile) {
            showMessage('Sélectionnez une vidéo', 'error');
            return;
        }
        
        // VÉRIFICATION : Seulement contenu original
        const disclaimer = document.getElementById('copyright-check').checked;
        if (!disclaimer) {
            showMessage('Vous devez certifier que c\'est votre contenu original', 'error');
            return;
        }
        
        // ANALYSE SIMPLE DU CONTENU (détection basique)
        const hasCopyrightTerms = checkForCopyright(title + ' ' + description);
        if (hasCopyrightTerms) {
            showMessage('ATTENTION : Votre vidéo semble contenir des références à du contenu protégé. Assurez-vous que c\'est 100% votre création originale.', 'error');
            return;
        }
        
        // Créer la vidéo
        const videoURL = URL.createObjectURL(videoFile);
        const videoId = 'video_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const video = {
            id: videoId,
            title: title,
            description: description,
            url: videoURL,
            authorId: AppState.currentUser.id,
            author: AppState.currentUser.username,
            views: 0,
            likes: 0,
            duration: '0:00',
            uploadDate: new Date().toLocaleDateString('fr-FR'),
            timestamp: Date.now(),
            isOriginal: true,
            reports: 0
        };
        
        // Ajouter aux vidéos de l'utilisateur
        AppState.currentUser.videos.push(videoId);
        AppState.users[AppState.currentUser.username] = AppState.currentUser;
        
        // Ajouter à la bibliothèque générale
        AppState.videos.unshift(video);
        
        // Sauvegarder
        localStorage.setItem('animeRefVideos', JSON.stringify(AppState.videos));
        localStorage.setItem('animeRefUsers', JSON.stringify(AppState.users));
        localStorage.setItem('animeRefUser', JSON.stringify(AppState.currentUser));
        
        // Réinitialiser
        uploadForm.reset();
        
        // Mettre à jour
        renderLibrary();
        updateUserUI();
        
        showMessage('Vidéo uploadée avec succès !', 'success');
    });
}

function checkForCopyright(text) {
    const copyrightTerms = [
        'crunchyroll', 'netflix', 'disney+', 'hulu', 'amazon prime',
        'épisode', 'saison', 'studio ghibli', 'toei animation',
        'attack on titan', 'naruto', 'one piece', 'dragon ball',
        'sous-titré', 'vostfr', 'vf', 'streaming illégal'
    ];
    
    const lowerText = text.toLowerCase();
    return copyrightTerms.some(term => lowerText.includes(term));
}

// ==================== SYSTÈME DE VUES ====================

function initVideoEvents() {
    const videoElement = document.getElementById('video-element');
    if (!videoElement) return;
    
    let viewTimer = null;
    let hasCountedView = false;
    
    videoElement.addEventListener('play', function() {
        if (!AppState.currentVideoId || hasCountedView) return;
        
        // Démarrer le timer pour les 30 secondes
        viewTimer = setTimeout(() => {
            countView(AppState.currentVideoId);
            hasCountedView = true;
        }, 30000); // 30 secondes
    });
    
    videoElement.addEventListener('pause', function() {
        if (viewTimer) {
            clearTimeout(viewTimer);
        }
    });
    
    videoElement.addEventListener('ended', function() {
        if (viewTimer) {
            clearTimeout(viewTimer);
        }
        if (!hasCountedView) {
            countView(AppState.currentVideoId);
        }
    });
}

function countView(videoId) {
    const video = AppState.videos.find(v => v.id === videoId);
    if (!video) return;
    
    // Vérifier si l'utilisateur a déjà compté une vue pour cette vidéo aujourd'hui
    const today = new Date().toDateString();
    const viewKey = `${videoId}_${AppState.currentUser?.id || 'anonymous'}_${today}`;
    
    if (AppState.views[viewKey]) return; // Déjà compté aujourd'hui
    
    // Incrémenter les vues
    video.views = (video.views || 0) + 1;
    AppState.views[viewKey] = true;
    
    // Sauvegarder
    localStorage.setItem('animeRefVideos', JSON.stringify(AppState.videos));
    localStorage.setItem('animeRefViews', JSON.stringify(AppState.views));
    
    // Mettre à jour l'affichage
    document.getElementById('views-count').textContent = video.views;
    renderLibrary();
}

// ==================== ABONNEMENTS ====================

function initSubscriptions() {
    document.getElementById('subscribe-btn')?.addEventListener('click', toggleSubscription);
}

function toggleSubscription() {
    if (!AppState.currentUser) {
        showMessage('Connectez-vous pour vous abonner', 'error');
        showLoginModal();
        return;
    }
    
    const video = AppState.videos.find(v => v.id === AppState.currentVideoId);
    if (!video) return;
    
    const author = video.author;
    const userId = AppState.currentUser.id;
    
    // Initialiser les abonnements si nécessaire
    if (!AppState.subscriptions[userId]) {
        AppState.subscriptions[userId] = [];
    }
    
    // Vérifier si déjà abonné
    const isSubscribed = AppState.subscriptions[userId].includes(author);
    
    if (isSubscribed) {
        // Se désabonner
        AppState.subscriptions[userId] = AppState.subscriptions[userId].filter(a => a !== author);
        showMessage(`Désabonné de ${author}`, 'info');
    } else {
        // S'abonner
        AppState.subscriptions[userId].push(author);
        showMessage(`Abonné à ${author} !`, 'success');
    }
    
    // Sauvegarder
    localStorage.setItem('animeRefSubs', JSON.stringify(AppState.subscriptions));
    
    // Mettre à jour le bouton
    updateSubscribeButton(author);
    renderSubscriptions();
}

function updateSubscribeButton(author) {
    const subscribeBtn = document.getElementById('subscribe-btn');
    if (!subscribeBtn) return;
    
    const userId = AppState.currentUser?.id;
    const isSubscribed = userId && AppState.subscriptions[userId]?.includes(author);
    
    subscribeBtn.innerHTML = isSubscribed ? 
        '<i class="fas fa-user-check"></i> Abonné' : 
        '<i class="fas fa-user-plus"></i> S\'abonner';
    
    subscribeBtn.className = isSubscribed ? 'btn btn-secondary' : 'btn btn-primary';
}

// ==================== DONS ====================

function initDonations() {
    document.getElementById('donate-btn')?.addEventListener('click', showDonateModal);
    document.getElementById('confirm-donate')?.addEventListener('click', processDonation);
}

function showDonateModal() {
    document.getElementById('donate-modal').style.display = 'block';
}

function processDonation() {
    const amount = document.getElementById('donate-amount').value;
    const method = document.getElementById('donate-method').value;
    
    if (!amount || amount < 1) {
        showMessage('Veuillez entrer un montant valide', 'error');
        return;
    }
    
    // Simuler un don (en réel, vous utiliseriez Stripe/PayPal)
    AppState.donations += parseInt(amount);
    localStorage.setItem('animeRefDonations', JSON.stringify(AppState.donations));
    
    // Afficher les informations de paiement
    let message = `Merci pour votre don de ${amount}€ !\n\n`;
    
    if (method === 'mobile') {
        message += `Envoyez ${amount}€ au :\n📱 07 09 65 63 59\n(Mobile Money/Orange Money)`;
    } else if (method === 'paypal') {
        message += `PayPal : jitihh700@gmail.com\nMerci de mentionner "ANIMEREF"`;
    } else {
        message += `Contactez-nous à jitihh700@gmail.com\npour les autres méthodes`;
    }
    
    alert(message);
    document.getElementById('donate-modal').style.display = 'none';
    document.getElementById('donate-amount').value = '';
    
    showMessage('Merci pour votre soutien ! ❤️', 'success');
}

// ==================== GESTION VIDÉOS ====================

function loadVideo(videoId) {
    const video = AppState.videos.find(v => v.id === videoId);
    if (!video) return;
    
    AppState.currentVideoId = videoId;
    
    const videoElement = document.getElementById('video-element');
    const noVideo = document.getElementById('no-video');
    const videoTitle = document.getElementById('video-title-display');
    const authorElement = document.getElementById('video-author');
    const viewsCount = document.getElementById('views-count');
    
    videoElement.src = video.url;
    videoElement.style.display = 'block';
    noVideo.style.display = 'none';
    videoTitle.textContent = video.title;
    authorElement.textContent = video.author;
    viewsCount.textContent = video.views || 0;
    
    // Mettre à jour le bouton d'abonnement
    updateSubscribeButton(video.author);
    
    // Charger les commentaires
    renderComments(videoId);
    
    // Lire automatiquement
    videoElement.play().catch(e => {
        console.log('Lecture automatique bloquée');
    });
}

function deleteVideo(videoId) {
    const video = AppState.videos.find(v => v.id === videoId);
    if (!video) return;
    
    // Vérifier les permissions
    const isOwner = AppState.currentUser && 
                   (video.authorId === AppState.currentUser.id || AppState.currentUser.username === 'admin');
    
    if (!isOwner) {
        showMessage('Vous ne pouvez pas supprimer cette vidéo', 'error');
        return;
    }
    
    // Libérer l'URL
    URL.revokeObjectURL(video.url);
    
    // Supprimer
    AppState.videos = AppState.videos.filter(v => v.id !== videoId);
    
    // Sauvegarder
    localStorage.setItem('animeRefVideos', JSON.stringify(AppState.videos));
    
    // Mettre à jour
    renderLibrary();
    
    // Si c'était la vidéo en cours
    if (AppState.currentVideoId === videoId) {
        const videoElement = document.getElementById('video-element');
        const noVideo = document.getElementById('no-video');
        
        videoElement.src = '';
        videoElement.style.display = 'none';
        noVideo.style.display = 'flex';
        document.getElementById('video-title-display').textContent = 'Aucune vidéo sélectionnée';
        AppState.currentVideoId = null;
    }
    
    showMessage('Vidéo supprimée', 'success');
}

// ==================== RENDER FUNCTIONS ====================

function renderLibrary() {
    const libraryGrid = document.getElementById('library-grid');
    if (!libraryGrid) return;
    
    if (AppState.videos.length === 0) {
        libraryGrid.innerHTML = '<p class="empty-message">Aucune vidéo uploadée. Soyez le premier !</p>';
        return;
    }
    
    libraryGrid.innerHTML = '';
    
    AppState.videos.forEach(video => {
        const isOwner = AppState.currentUser && 
                       (video.authorId === AppState.currentUser.id || AppState.currentUser.username === 'admin');
        
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.dataset.id = video.id;
        
        videoCard.innerHTML = `
            <div class="video-thumbnail" style="background: #000; height: 160px; display: flex; align-items: center; justify-content: center; color: #666;">
                <i class="fas fa-film" style="font-size: 40px;"></i>
            </div>
            <div class="video-card-content">
                <div class="video-card-title">${video.title}</div>
                <div class="video-card-author">Par ${video.author}</div>
                <div class="video-card-details">
                    <span><i class="fas fa-eye"></i> ${video.views || 0}</span>
                    <span>${video.uploadDate}</span>
                </div>
                ${isOwner ? `
                    <div class="video-card-actions">
                        <button onclick="deleteVideo('${video.id}')" class="btn btn-danger btn-sm">
                            <i class="fas fa-trash"></i> Supprimer
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        
        videoCard.addEventListener('click', (e) => {
            if (!e.target.classList.contains('btn-danger')) {
                loadVideo(video.id);
                showSection('home-section');
            }
        });
        
        libraryGrid.appendChild(videoCard);
    });
}

function renderSubscriptions() {
    const subsList = document.getElementById('subscriptions-list');
    if (!subsList || !AppState.currentUser) return;
    
    const userSubs = AppState.subscriptions[AppState.currentUser.id] || [];
    
    if (userSubs.length === 0) {
        subsList.innerHTML = '<p class="empty-message">Pas encore d\'abonnements</p>';
        return;
    }
    
    subsList.innerHTML = '';
    
    userSubs.forEach(username => {
        const user = AppState.users[username];
        if (!user) return;
        
        const subItem = document.createElement('div');
        subItem.className = 'subscription-item';
        
        subItem.innerHTML = `
            <img src="${user.avatar}" alt="${username}" class="avatar">
            <div class="subscription-info">
                <div class="subscription-name">${username}</div>
                <div class="subscription-stats">${user.videos?.length || 0} vidéos</div>
            </div>
        `;
        
        subItem.addEventListener('click', () => {
            // Filtrer les vidéos de cet auteur
            const authorVideos = AppState.videos.filter(v => v.author === username);
            // Afficher dans une section spéciale
            showMessage(`Vidéos de ${username}`, 'info');
        });
        
        subsList.appendChild(subItem);
    });
}

// ==================== UTILITIES ====================

function updateUserUI() {
    const authSection = document.getElementById('auth-section');
    const userSection = document.getElementById('user-section');
    const usernameDisplay = document.getElementById('username-display');
    
    if (AppState.currentUser) {
        authSection.style.display = 'none';
        userSection.style.display = 'flex';
        usernameDisplay.textContent = AppState.currentUser.username;
    } else {
        authSection.style.display = 'flex';
        userSection.style.display = 'none';
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

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
}

// Fonctions globales
window.deleteVideo = deleteVideo;
window.closeModals = closeModals;

// Navigation
function initNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.id.replace('nav-', '') + '-section';
            showSection(sectionId);
            
            // Mettre à jour la navigation
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Commentaires (simplifié)
function initComments() {
    const submitBtn = document.getElementById('submit-comment');
    const commentInput = document.getElementById('comment-input');
    
    if (submitBtn && commentInput) {
        submitBtn.addEventListener('click', addComment);
        commentInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addComment();
        });
    }
}

function addComment() {
    if (!AppState.currentUser) {
        showMessage('Connectez-vous pour commenter', 'error');
        showLoginModal();
        return;
    }
    
    const text = document.getElementById('comment-input')?.value.trim();
    if (!text || !AppState.currentVideoId) return;
    
    const comment = {
        id: 'comment_' + Date.now(),
        author: AppState.currentUser.username,
        text: text,
        date: new Date().toLocaleString('fr-FR')
    };
    
    if (!AppState.comments[AppState.currentVideoId]) {
        AppState.comments[AppState.currentVideoId] = [];
    }
    
    AppState.comments[AppState.currentVideoId].push(comment);
    localStorage.setItem('animeRefComments', JSON.stringify(AppState.comments));
    
    document.getElementById('comment-input').value = '';
    renderComments(AppState.currentVideoId);
}

function renderComments(videoId) {
    const commentsList = document.getElementById('comments-list');
    if (!commentsList) return;
    
    const comments = AppState.comments[videoId] || [];
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<p class="empty-message">Aucun commentaire</p>';
        return;
    }
    
    commentsList.innerHTML = '';
    
    comments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment-item';
        
        commentElement.innerHTML = `
            <div class="comment-author">${comment.author}</div>
            <div class="comment-date">${comment.date}</div>
            <div class="comment-text">${comment.text}</div>
        `;
        
        commentsList.appendChild(commentElement);
    });
}
