// Application State
const state = {
    goals: {
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 65
    },
    today: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        meals: []
    },
    streak: 3
};

// DOM Elements
const views = {
    dashboard: document.getElementById('dashboard-view'),
    analyze: document.getElementById('analyze-view')
};

const els = {
    date: document.getElementById('current-date'),
    streak: document.getElementById('streak-count'),
    
    calEaten: document.getElementById('calories-eaten'),
    calGoal: document.getElementById('calories-goal'),
    calProgress: document.getElementById('calorie-progress'),
    
    proEaten: document.getElementById('protein-eaten'),
    proGoal: document.getElementById('protein-goal'),
    proProgress: document.getElementById('protein-progress'),
    
    carEaten: document.getElementById('carbs-eaten'),
    carGoal: document.getElementById('carbs-goal'),
    carProgress: document.getElementById('carbs-progress'),
    
    fatEaten: document.getElementById('fat-eaten'),
    fatGoal: document.getElementById('fat-goal'),
    fatProgress: document.getElementById('fat-progress'),
    
    diaryList: document.getElementById('diary-list'),
    fabAdd: document.getElementById('fab-add'),
    btnCloseAnalyze: document.getElementById('close-analyze-btn'),
    
    cameraInput: document.getElementById('camera-input'),
    galleryInput: document.getElementById('gallery-input'),
    
    uploadPrompt: document.getElementById('upload-prompt'),
    previewContainer: document.getElementById('image-preview-container'),
    imagePreview: document.getElementById('image-preview'),
    
    analysisLoading: document.getElementById('analysis-loading'),
    analysisResult: document.getElementById('analysis-result'),
    
    logFoodBtn: document.getElementById('log-food-btn'),
    retryBtn: document.getElementById('retry-btn'),
    toast: document.getElementById('toast')
};

// Current analyzed food
let pendingFood = null;

// Initialize
function init() {
    loadState();
    updateDate();
    updateUI();
    setupEventListeners();
}

// Load State from LocalStorage
function loadState() {
    const savedState = localStorage.getItem('calai_state');
    const todayStr = new Date().toDateString();
    const lastLogin = localStorage.getItem('calai_last_login');

    if (savedState) {
        const parsed = JSON.parse(savedState);
        state.goals = parsed.goals || state.goals;
        state.streak = parsed.streak || state.streak;
        
        // Reset daily totals if it's a new day
        if (lastLogin !== todayStr) {
            // Keep meals empty, totals 0
        } else {
            state.today = parsed.today || state.today;
        }
    }
    
    localStorage.setItem('calai_last_login', todayStr);
}

// Save State
function saveState() {
    localStorage.setItem('calai_state', JSON.stringify(state));
}

// Update Date Display
function updateDate() {
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    els.date.textContent = new Date().toLocaleDateString('en-US', options);
    els.streak.textContent = `${state.streak} Day Streak`;
}

// Update UI
function updateUI() {
    // Update text
    els.calEaten.textContent = state.today.calories;
    els.calGoal.textContent = state.goals.calories;
    
    els.proEaten.textContent = state.today.protein;
    els.proGoal.textContent = state.goals.protein;
    
    els.carEaten.textContent = state.today.carbs;
    els.carGoal.textContent = state.goals.carbs;
    
    els.fatEaten.textContent = state.today.fat;
    els.fatGoal.textContent = state.goals.fat;
    
    // Update Rings
    setRingProgress(els.calProgress, state.today.calories, state.goals.calories, 377);
    setRingProgress(els.proProgress, state.today.protein, state.goals.protein, 126);
    setRingProgress(els.carProgress, state.today.carbs, state.goals.carbs, 126);
    setRingProgress(els.fatProgress, state.today.fat, state.goals.fat, 126);
    
    // Update Diary
    renderDiary();
}

function setRingProgress(element, current, goal, circumference) {
    const percent = Math.min(current / goal, 1);
    const offset = circumference - (percent * circumference);
    element.style.strokeDashoffset = offset;
}

function renderDiary() {
    if (state.today.meals.length === 0) {
        els.diaryList.innerHTML = `
            <div class="empty-state">
                <p>No meals logged yet. Tap the + to add food!</p>
            </div>
        `;
        return;
    }
    
    els.diaryList.innerHTML = '';
    
    // Reverse to show newest first
    const meals = [...state.today.meals].reverse();
    
    meals.forEach(meal => {
        const item = document.createElement('div');
        item.className = 'meal-item';
        
        // Simple icon selection based on name
        let icon = 'fa-utensils';
        if (meal.name.toLowerCase().includes('salad')) icon = 'fa-leaf';
        else if (meal.name.toLowerCase().includes('chicken') || meal.name.toLowerCase().includes('meat')) icon = 'fa-drumstick-bite';
        else if (meal.name.toLowerCase().includes('coffee') || meal.name.toLowerCase().includes('drink')) icon = 'fa-mug-hot';
        else if (meal.name.toLowerCase().includes('burger')) icon = 'fa-burger';
        
        item.innerHTML = `
            <div class="meal-info">
                <div class="meal-icon"><i class="fa-solid ${icon}"></i></div>
                <div class="meal-details">
                    <h4>${meal.name}</h4>
                    <p>${meal.protein}g P • ${meal.carbs}g C • ${meal.fat}g F</p>
                </div>
            </div>
            <div class="meal-calories">
                <span class="cal">${meal.calories}</span><br>
                <span style="font-size:11px;color:var(--text-muted)">kcal</span>
            </div>
        `;
        els.diaryList.appendChild(item);
    });
}

// Navigation
function showView(viewId) {
    Object.values(views).forEach(v => {
        v.classList.remove('active');
        v.classList.add('hidden');
    });
    
    const target = document.getElementById(viewId);
    target.classList.remove('hidden');
    // small delay to allow display:block to apply before animation
    setTimeout(() => {
        target.classList.add('active');
    }, 10);
    
    if (viewId === 'dashboard-view') {
        els.fabAdd.style.display = 'block';
    } else {
        els.fabAdd.style.display = 'none';
    }
}

// Reset Analysis State
function resetAnalysisState() {
    els.uploadPrompt.classList.remove('hidden');
    document.querySelector('.action-buttons').classList.remove('hidden');
    
    els.previewContainer.classList.add('hidden');
    els.analysisLoading.classList.add('hidden');
    els.analysisResult.classList.add('hidden');
    
    els.cameraInput.value = '';
    els.galleryInput.value = '';
    pendingFood = null;
}

// Handle Image Selection
function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        els.imagePreview.src = e.target.result;
        startAnalysis(e.target.result);
    };
    reader.readAsDataURL(file);
}

// Simulate AI Analysis
function startAnalysis(base64Image) {
    // UI Updates
    els.uploadPrompt.classList.add('hidden');
    document.querySelector('.action-buttons').classList.add('hidden');
    
    els.previewContainer.classList.remove('hidden');
    els.analysisLoading.classList.remove('hidden');
    
    // In a real app, this would call our Vercel API. 
    // Since we don't have an API key right now, we simulate a premium AI response!
    setTimeout(() => {
        els.analysisLoading.classList.add('hidden');
        els.analysisResult.classList.remove('hidden');
        
        // Mock Result
        pendingFood = {
            name: "Grilled Chicken Salad",
            calories: 340,
            protein: 42,
            carbs: 12,
            fat: 14
        };
        
        document.getElementById('result-food-name').textContent = pendingFood.name;
        document.getElementById('r-cal').textContent = pendingFood.calories;
        document.getElementById('r-pro').textContent = pendingFood.protein + 'g';
        document.getElementById('r-car').textContent = pendingFood.carbs + 'g';
        document.getElementById('r-fat').textContent = pendingFood.fat + 'g';
        
    }, 2500); // 2.5s delay to simulate thinking
}

// Log Food
function logFood() {
    if (!pendingFood) return;
    
    state.today.calories += pendingFood.calories;
    state.today.protein += pendingFood.protein;
    state.today.carbs += pendingFood.carbs;
    state.today.fat += pendingFood.fat;
    
    state.today.meals.push({
        ...pendingFood,
        time: new Date().toLocaleTimeString()
    });
    
    saveState();
    updateUI();
    showView('dashboard-view');
    showToast();
}

function showToast() {
    els.toast.classList.remove('hidden');
    setTimeout(() => els.toast.classList.add('show'), 10);
    
    setTimeout(() => {
        els.toast.classList.remove('show');
        setTimeout(() => els.toast.classList.add('hidden'), 300);
    }, 3000);
}

// Event Listeners
function setupEventListeners() {
    els.fabAdd.addEventListener('click', () => {
        resetAnalysisState();
        showView('analyze-view');
    });
    
    els.btnCloseAnalyze.addEventListener('click', () => {
        showView('dashboard-view');
    });
    
    els.cameraInput.addEventListener('change', handleImageSelect);
    els.galleryInput.addEventListener('change', handleImageSelect);
    
    els.logFoodBtn.addEventListener('click', logFood);
    els.retryBtn.addEventListener('click', () => {
        resetAnalysisState();
    });
}

// Boot up
document.addEventListener('DOMContentLoaded', init);
