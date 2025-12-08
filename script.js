// === BASE DE DONNÉES SIMULÉE ===
let videos = [];
let users = [];
let currentUser = null;
let watchHistory = [];
let myVideos = [];
let uploadStep = 1;
let selectedFile = null;
let currentPlayingVideo = null;

// === INITIALISATION ===
document.addEventListener('DOMContentLoaded', function() {
    initData();
    loadVideos();
    loadWatchHistory();
    loadMyVideos();
    checkAuthStatus();
    setupEventListeners();
    showNotification("Animeref chargé avec succès!");
});

// === DONNÉES INITIALES ===
function initData() {
    // Charger depuis localStorage
    const savedVideos = localStorage.getItem('animeref_videos');
    const savedUsers = localStorage.getItem('animeref_users');
    const savedHistory = localStorage.getItem('animeref_history');
    const savedMyVideos = localStorage.getItem('animeref_myvideos');
    const savedUser = localStorage.getItem('animeref_currentUser');
    
    if (savedVideos) videos = JSON.parse(savedVideos);
    if (savedUsers) users = JSON.parse(savedUsers);
    if (savedHistory) watchHistory = JSON.parse(savedHistory);
    if (savedMyVideos) myVideos = JSON.parse(savedMyVideos);
    if (savedUser) currentUser = JSON.parse(savedUser);
    
    // Données d'exemple si vide
    if (videos.length === 0) {
        videos = [
            {
                id: 1,
                title: "Naruto Shippuden",
                episode: 3,
                description: "Naruto commence son entraînement avec Jiraya",
                channel: "AnimeFan",
                views: "150K",
                date: "Il y a 3 jours",
                duration: "23:45",
                thumbnail: "https://picsum.photos/320/180?random=1",
                videoUrl: null,
                userId: 2,
                likes: 1200,
                dislikes: 15,
                visibility: "public"
            },
            {
                id: 2,
                title: "One Piece",
                episode: 1024,
                description: "Luffy vs Kaido - La bataille finale",
                channel: "Équipe OP",
                views: "890K",
                date: "Il y a 1 semaine",
                duration: "24:30",
                thumbnail: "https://picsum.photos/320/180?random=2",
                videoUrl: null,
                userId: 3,
                likes: 8900,
                dislikes: 45,
                visibility: "public"
            }
        ];
        saveToLocalStorage('animeref_videos', videos);
    }
    
    if (users.length === 0) {
        users = [
            { id: 1, name: "Admin", email: "admin@animeref.com", password: "admin123" },
            { id: 2, name: "AnimeFan", email: "fan@exemple.com", password: "fan123" },
            { id: 3, name: "Équipe OP", email: "op@exemple.com", password: "op123" }
        ];
        saveToLocalStorage('animeref_users', users);
    }
}

// === ÉCOUTEURS D'ÉVÉNEMENTS ===
function setupEventListeners() {
    // Sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // Navigation
    document.getElementById('uploadBtn').addEventListener('click', openUploadModal);
    document.getElementById('signInBtn').addEventListener('click', openAuthModal);
    document.getElementById('donateBtn').addEventListener('click', openDonateModal);
    document.getElementById('uploadFromMyVideos').addEventListener('click', openUploadModal);
    document.getElementById('searchBtn').addEventListener('click', searchVideos);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchVideos();
    });
    
    // Modals fermeture
    document.getElementById('closeVideoModal').addEventListener('click', closeVideoModal);
    document.getElementById('closeUploadModal').addEventListener('click', closeUploadModal);
    document.getElementById('closeAuthModal').addEventListener('click', closeAuthModal);
    document.getElementById('closeDonateModal').addEventListener('click', closeDonateModal);
    
    // Upload modal
    document.getElementById('fileUploadArea').addEventListener('click', () => {
        document.getElementById('videoFile').click();
    });
    document.getElementById('videoFile').addEventListener('change', handleFileSelect);
    document.getElementById('nextStep1').addEventListener('click', () => nextUploadStep(2));
    document.getElementById('prevStep2').addEventListener('click', () => prevUploadStep(1));
    document.getElementById('nextStep2').addEventListener('click', () => nextUploadStep(3));
    document.getElementById('prevStep3').addEventListener('click', () => prevUploadStep(2));
    document.getElementById('submitVideoBtn').addEventListener('click', submitVideo);
    
    // Auth modal
    document.getElementById('loginTab').addEventListener('click', () => switchAuthTab('login'));
    document.getElementById('signupTab').addEventListener('click', () => switchAuthTab('signup'));
    document.getElementById('loginBtn').addEventListener('click', login);
    document.getElementById('signupBtn').addEventListener('click', signup);
    
    // Donate modal
    document.querySelectorAll('.donation-amount').forEach(btn => {
        btn.addEventListener('click', function() {
            const amount = this.getAttribute('data-amount');
            selectDonationAmount(amount);
        });
    });
    document.getElementById('processPaymentBtn').addEventListener('click', processPayment);
    
    // Video modal actions
    document.getElementById('likeBtn').addEventListener('click', likeVideo);
    document.getElementById('dislikeBtn').addEventListener('click', dislikeVideo);
    document.getElementById('shareBtn').addEventListener('click', shareVideo);
    document.getElementById('deleteVideoBtn').addEventListener('click', deleteVideo);
    
    // Fermer modals en cliquant à l'extérieur
    window.addEventListener('click', (event) => {
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
}

// === VIDÉOS ===
function loadVideos() {
    const sections = ['homeVideos', 'trendingVideos', 'animeListVideos'];
    
    sections.forEach(sectionId => {
        const grid = document.getElementById(sectionId);
        if (!grid) return;
        
        grid.innerHTML = '';
        
        const publicVideos = videos.filter(v => v.visibility === "public");
        
        if (publicVideos.length === 0) {
            grid.innerHTML = '<p class="empty-state">Aucun anime disponible</p>';
            return;
        }
        
        publicVideos.forEach(video => {
            const card = createVideoCard(video);
            grid.appendChild(card);
        });
    });
}

function createVideoCard(video) {
    const div = document.createElement('div');
    div.className = 'video-card';
    div.innerHTML = `
        <div class="video-thumbnail">
            <img src="${video.thumbnail}" alt="${video.title}">
            <div class="video-duration">${video.duration}</div>
        </div>
        <div class="video-info">
            <h3 class="video-title">${video.title} ${video.episode ? '- Épisode ' + video.episode : ''}</h3>
            <p class="video-meta">${video.channel} • ${video.views} vues • ${video.date}</p>
        </div>
    `;
    
    div.addEventListener('click', () => openVideoModal(video));
    return div;
}

function openVideoModal(video) {
    currentPlayingVideo = video;
    const modal = document.getElementById('videoModal');
    
    // Mettre à jour les infos
    document.getElementById('videoModalTitle').textContent = `${video.title} ${video.episode ? '- Épisode ' + video.episode : ''}`;
    document.getElementById('videoModalViews').textContent = `${video.views} vues`;
    document.getElementById('videoModalDate').textContent = video.date;
    document.getElementById('videoModalEpisode').textContent = video.episode ? `Épisode ${video.episode}` : '';
    document.getElementById('videoModalDescription').textContent = video.description;
    document.getElementById('videoModalChannel').textContent = video.channel;
    document.getElementById('likeCount').textContent = video.likes || 0;
    document.getElementById('dislikeCount').textContent = video.dislikes || 0;
    
    // Afficher bouton supprimer si c'est notre vidéo
    const deleteBtn = document.getElementById('deleteVideoBtn');
    if (currentUser && video.userId === currentUser.id) {
        deleteBtn.style.display = 'flex';
    } else {
        deleteBtn.style.display = 'none';
    }
    
    // Ajouter à l'historique
    addToHistory(video);
    
    // Afficher modal
    modal.style.display = 'flex';
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    if (player) player.pause();
    modal.style.display = 'none';
    currentPlayingVideo = null;
}

// === HISTORIQUE ===
function addToHistory(video) {
    if (!currentUser) return;
    
    const historyItem = {
        ...video,
        watchedAt: new Date().toLocaleString('fr-FR')
    };
    
    // Éviter les doublons
    const existingIndex = watchHistory.findIndex(item => item.id === video.id);
    if (existingIndex !== -1) {
        watchHistory.splice(existingIndex, 1);
    }
    
    watchHistory.unshift(historyItem);
    
    // Limiter à 50
    if (watchHistory.length > 50) watchHistory.pop();
    
    saveToLocalStorage('animeref_history', watchHistory);
    loadWatchHistory();
}

function loadWatchHistory() {
    const list = document.getElementById('historyList');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (watchHistory.length === 0) {
        list.innerHTML = '<p class="empty-state">Aucune vidéo visionnée</p>';
        return;
    }
    
    watchHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <img src="${item.thumbnail}" alt="${item.title}">
            <div>
                <h4>${item.title} ${item.episode ? '- Épisode ' + item.episode : ''}</h4>
                <p>${item.channel}</p>
                <small>Visionné le ${item.watchedAt}</small>
            </div>
        `;
        div.addEventListener('click', () => openVideoModal(item));
        list.appendChild(div);
    });
}

// === UPLOAD ===
function openUploadModal() {
    if (!currentUser) {
        showNotification("Connectez-vous pour publier");
        openAuthModal();
        return;
    }
    
    const modal = document.getElementById('uploadModal');
    resetUploadForm();
    modal.style.display = 'flex';
}

function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
}

function resetUploadForm() {
    uploadStep = 1;
    selectedFile = null;
    
    // Réinitialiser étapes
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
    document.getElementById('step1Indicator').classList.add('active');
    
    document.querySelectorAll('.upload-step-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById('uploadStep1').classList.add('active');
    
    // Réinitialiser champs
    document.getElementById('videoFile').value = '';
    document.getElementById('videoTitle').value = '';
    document.getElementById('videoEpisode').value = '';
    document.getElementById('videoDescription').value = '';
    document.getElementById('fileInfo').innerHTML = '';
    
    // Désactiver boutons
    document.getElementById('nextStep1').disabled = true;
    document.getElementById('submitVideoBtn').disabled = true;
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Vérifier type
    const validTypes = ['video/mp4', 'video/mkv', 'video/avi', 'video/mov'];
    if (!validTypes.includes(file.type)) {
        showNotification("Format non supporté. Utilisez MP4, MKV, AVI ou MOV.");
        return;
    }
    
    selectedFile = file;
    
    // Afficher infos
    document.getElementById('fileInfo').innerHTML = `
        <p><strong>Fichier:</strong> ${file.name}</p>
        <p><strong>Taille:</strong> ${formatFileSize(file.size)}</p>
        <p><strong>Type:</strong> ${file.type}</p>
    `;
    
    document.getElementById('nextStep1').disabled = false;
    document.getElementById('summaryFile').textContent = file.name;
}

function nextUploadStep(step) {
    uploadStep = step;
    updateUploadSteps();
    
    if (step === 3) {
        startVerification();
    }
}

function prevUploadStep(step) {
    uploadStep = step;
    updateUploadSteps();
}

function updateUploadSteps() {
    // Mettre à jour indicateurs
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(`step${uploadStep}Indicator`).classList.add('active');
    
    // Mettre à jour contenus
    document.querySelectorAll('.upload-step-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`uploadStep${uploadStep}`).classList.add('active');
}

function startVerification() {
    const progressBar = document.getElementById('verificationProgress');
    const progressText = document.getElementById('progressText');
    const statusText = document.getElementById('verificationStatus');
    const issuesDiv = document.getElementById('copyrightIssues');
    const submitBtn = document.getElementById('submitVideoBtn');
    
    // Récupérer infos
    const title = document.getElementById('videoTitle').value.toLowerCase();
    const episode = document.getElementById('videoEpisode').value;
    
    document.getElementById('summaryTitle').textContent = title;
    document.getElementById('summaryEpisode').textContent = `Épisode ${episode}`;
    
    // Réinitialiser
    issuesDiv.style.display = 'none';
    submitBtn.disabled = true;
    progressBar.style.width = '0%';
    progressText.textContent = '0%';
    statusText.textContent = "Analyse en cours...";
    statusText.style.color = '';
    
    // Simulation vérification
    let progress = 0;
    let hasIssues = false;
    
    const interval = setInterval(() => {
        progress += 2;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${progress}%`;
        
        // Détection d'anime populaire
        const popularAnime = ['naruto', 'one piece', 'attack on titan', 'dragon ball', 'bleach'];
        if (progress >= 50 && popularAnime.some(anime => title.includes(anime))) {
            hasIssues = true;
            statusText.innerHTML = '<span style="color: #ff4757;">⚠️ Contenu protégé détecté</span>';
        }
        
        if (progress >= 100) {
            clearInterval(interval);
            progressText.textContent = "100%";
            
            if (hasIssues) {
                issuesDiv.style.display = 'block';
                submitBtn.disabled = true;
            } else {
                statusText.innerHTML = '<span style="color: #2ecc71;">✓ Prêt à publier</span>';
                submitBtn.disabled = false;
            }
        }
    }, 50);
}

function submitVideo() {
    const title = document.getElementById('videoTitle').value;
    const episode = document.getElementById('videoEpisode').value;
    const description = document.getElementById('videoDescription').value;
    
    if (!title || !episode) {
        showNotification("Titre et épisode requis");
        return;
    }
    
    // Nouvelle vidéo
    const newVideo = {
        id: Date.now(),
        title: title,
        episode: parseInt(episode),
        description: description,
        channel: currentUser.name,
        views: "0",
        date: "À l'instant",
        duration: "24:00",
        thumbnail: `https://picsum.photos/320/180?random=${Date.now()}`,
        videoUrl: null,
        userId: currentUser.id,
        likes: 0,
        dislikes: 0,
        visibility: "public"
    };
    
    // Stocker la vidéo localement
    if (selectedFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            newVideo.videoData = e.target.result;
            finishVideoUpload(newVideo);
        };
        reader.readAsDataURL(selectedFile);
    } else {
        finishVideoUpload(newVideo);
    }
}

function finishVideoUpload(video) {
    // Ajouter aux listes
    videos.unshift(video);
    myVideos.unshift(video);
    
    // Sauvegarder
    saveToLocalStorage('animeref_videos', videos);
    saveToLocalStorage('animeref_myvideos', myVideos);
    
    // Mettre à jour interface
    loadVideos();
    loadMyVideos();
    
    // Fermer et notifier
    closeUploadModal();
    showNotification("✅ Anime publié avec succès!");
    
    // Afficher section mes vidéos
    showSection('my-videos');
}

// === MES VIDÉOS ===
function loadMyVideos() {
    const container = document.getElementById('myUploadedVideos');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!currentUser) {
        container.innerHTML = '<p class="empty-state">Connectez-vous pour voir vos vidéos</p>';
        return;
    }
    
    const userVideos = myVideos.filter(v => v.userId === currentUser.id);
    
    if (userVideos.length === 0) {
        container.innerHTML = '<p class="empty-state">Vous n\'avez pas encore publié d\'anime</p>';
        return;
    }
    
    userVideos.forEach(video => {
        const card = createVideoCard(video);
        container.appendChild(card);
    });
}

// === AUTHENTIFICATION ===
function openAuthModal() {
    document.getElementById('authModal').style.display = 'flex';
    switchAuthTab('login');
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

function switchAuthTab(tab) {
    // Tabs
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('signupTab').classList.remove('active');
    
    // Forms
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'none';
    
    if (tab === 'login') {
        document.getElementById('loginTab').classList.add('active');
        document.getElementById('loginForm').style.display = 'block';
    } else {
        document.getElementById('signupTab').classList.add('active');
        document.getElementById('signupForm').style.display = 'block';
    }
}

function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification("Email et mot de passe requis");
        return;
    }
    
    if (!email.includes('@')) {
        showNotification("Email invalide");
        return;
    }
    
    // Chercher utilisateur
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        showNotification("Email ou mot de passe incorrect");
        return;
    }
    
    // Connexion réussie
    currentUser = { id: user.id, name: user.name, email: user.email };
    saveToLocalStorage('animeref_currentUser', currentUser);
    
    updateAuthUI();
    closeAuthModal();
    showNotification(`👋 Bienvenue ${currentUser.name}!`);
    
    // Recharger
    loadMyVideos();
    loadWatchHistory();
}

function signup() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!name || !email || !password || !confirmPassword) {
        showNotification("Tous les champs sont requis");
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification("Les mots de passe ne correspondent pas");
        return;
    }
    
    if (!email.includes('@')) {
        showNotification("Email invalide");
        return;
    }
    
    if (users.some(u => u.email === email)) {
        showNotification("Cet email est déjà utilisé");
        return;
    }
    
    // Nouvel utilisateur
    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: password
    };
    
    users.push(newUser);
    currentUser = { id: newUser.id, name: newUser.name, email: newUser.email };
    
    // Sauvegarder
    saveToLocalStorage('animeref_users', users);
    saveToLocalStorage('animeref_currentUser', currentUser);
    
    updateAuthUI();
    closeAuthModal();
    showNotification(`🎉 Bienvenue ${currentUser.name}!`);
    
    // Recharger
    loadMyVideos();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('animeref_currentUser');
    updateAuthUI();
    showNotification("Déconnexion réussie");
    loadMyVideos();
    loadWatchHistory();
}

function checkAuthStatus() {
    if (currentUser) {
        updateAuthUI();
    }
}

function updateAuthUI() {
    const signInBtn = document.getElementById('signInBtn');
    const userProfileBtn = document.getElementById('userProfileBtn');
    
    if (currentUser) {
        signInBtn.style.display = 'none';
        userProfileBtn.style.display = 'flex';
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
                border-radius: 8px;
                padding: 10px 0;
                min-width: 200px;
                z-index: 1000;
            `;
            
            menu.innerHTML = `
                <div style="padding: 10px 20px; color: white; cursor: pointer;" onclick="showSection('my-videos')">
                    <i class="fas fa-video"></i> Mes vidéos
                </div>
                <div style="padding: 10px 20px; color: #ff4757; cursor: pointer; border-top: 1px solid #333;" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i> Déconnexion
                </div>
            `;
            
            document.body.appendChild(menu);
            
            setTimeout(() => {
                const closeMenu = (e) => {
                    if (!menu.contains(e.target) && e.target !== userProfileBtn) {
                        menu.remove();
                        document.removeEventListener('click', closeMenu);
                    }
                };
                document.addEventListener('click', closeMenu);
            }, 0);
        };
    } else {
        signInBtn.style.display = 'flex';
        userProfileBtn.style.display = 'none';
    }
}

// === DONS ===
function openDonateModal() {
    document.getElementById('donateModal').style.display = 'flex';
}

function closeDonateModal() {
    document.getElementById('donateModal').style.display = 'none';
}

function selectDonationAmount(amount) {
    document.getElementById('customAmount').value = amount;
    
    // Highlight selected
    document.querySelectorAll('.donation-amount').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
}

function processPayment() {
    const cardNumber = document.getElementById('cardNumber').value;
    const expiryDate = document.getElementById('expiryDate').value;
    const cvv = document.getElementById('cvv').value;
    const cardName = document.getElementById('cardName').value;
    const amount = document.getElementById('customAmount').value;
    
    if (!cardNumber || !expiryDate || !cvv || !cardName || !amount) {
        showNotification("Veuillez remplir tous les champs");
        return;
    }
    
    showNotification(`💳 Paiement de ${amount}€ en cours...`);
    
    setTimeout(() => {
        closeDonateModal();
        showNotification(`✅ Don de ${amount}€ effectué! Merci.`);
        
        // Réinitialiser formulaire
        document.getElementById('cardNumber').value = '';
        document.getElementById('expiryDate').value = '';
        document.getElementById('cvv').value = '';
        document.getElementById('cardName').value = '';
        document.getElementById('customAmount').value = '';
        document.querySelectorAll('.donation-amount').forEach(btn => {
            btn.classList.remove('selected');
        });
    }, 2000);
}

// === ACTIONS VIDÉO ===
function likeVideo() {
    if (!currentUser) {
        showNotification("Connectez-vous pour aimer");
        return;
    }
    
    if (!currentPlayingVideo) return;
    
    const video = videos.find(v => v.id === currentPlayingVideo.id);
    if (video) {
        video.likes = (video.likes || 0) + 1;
        document.getElementById('likeCount').textContent = video.likes;
        saveToLocalStorage('animeref_videos', videos);
    }
}

function dislikeVideo() {
    if (!currentUser) {
        showNotification("Connectez-vous pour réagir");
        return;
    }
    
    if (!currentPlayingVideo) return;
    
    const video = videos.find(v => v.id === currentPlayingVideo.id);
    if (video) {
        video.dislikes = (video.dislikes || 0) + 1;
        document.getElementById('dislikeCount').textContent = video.dislikes;
        saveToLocalStorage('animeref_videos', videos);
    }
}

function shareVideo() {
    if (!currentPlayingVideo) return;
    
    const url = `animeref.com/watch?v=${currentPlayingVideo.id}`;
    navigator.clipboard.writeText(url).then(() => {
        showNotification("✅ Lien copié!");
    });
}

function deleteVideo() {
    if (!currentPlayingVideo || !currentUser) return;
    
    if (currentPlayingVideo.userId !== currentUser.id) {
        showNotification("Vous ne pouvez pas supprimer cette vidéo");
        return;
    }
    
    if (!confirm("Supprimer cette vidéo ?")) return;
    
    // Supprimer
    videos = videos.filter(v => v.id !== currentPlayingVideo.id);
    myVideos = myVideos.filter(v => v.id !== currentPlayingVideo.id);
    
    saveToLocalStorage('animeref_videos', videos);
    saveToLocalStorage('animeref_myvideos', myVideos);
    
    // Mettre à jour
    loadVideos();
    loadMyVideos();
    closeVideoModal();
    showNotification("✅ Vidéo supprimée");
}

// === RECHERCHE ===
function searchVideos() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    
    if (!term) {
        loadVideos();
        return;
    }
    
    const results = videos.filter(v => 
        v.title.toLowerCase().includes(term) || 
        v.description.toLowerCase().includes(term)
    );
    
    // Mettre à jour toutes les sections
    ['homeVideos', 'trendingVideos', 'animeListVideos'].forEach(sectionId => {
        const grid = document.getElementById(sectionId);
        if (!grid) return;
        
        grid.innerHTML = '';
        
        results.forEach(video => {
            const card = createVideoCard(video);
            grid.appendChild(card);
        });
        
        if (results.length === 0) {
            grid.innerHTML = '<p class="empty-state">Aucun résultat</p>';
        }
    });
}

// === UTILITAIRES ===
function showSection(sectionId) {
    // Mettre à jour sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === sectionId) {
            item.classList.add('active');
        }
    });
    
    // Afficher section
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    // Recharger si nécessaire
    if (sectionId === 'my-videos') loadMyVideos();
    if (sectionId === 'history') loadWatchHistory();
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    const messageSpan = document.getElementById('notificationMessage');
    
    messageSpan.textContent = message;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
    return (bytes / 1073741824).toFixed(2) + ' GB';
}

function saveToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}
