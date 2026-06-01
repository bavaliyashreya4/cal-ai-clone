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
    streak: 4
};

// DOM Elements
const views = {
    'dashboard-view': document.getElementById('dashboard-view'),
    'analyze-view': document.getElementById('analyze-view'),
    'history-view': document.getElementById('history-view'),
    'profile-view': document.getElementById('profile-view')
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
    
    // Nav & Upload
    navItems: document.querySelectorAll('.nav-item'),
    navAddBtn: document.getElementById('nav-add-btn'),
    btnCloseAnalyze: document.getElementById('close-analyze-btn'),
    cameraInput: document.getElementById('camera-input'),
    galleryInput: document.getElementById('gallery-input'),
    
    // Analysis
    uploadPrompt: document.getElementById('upload-prompt'),
    previewContainer: document.getElementById('image-preview-container'),
    imagePreview: document.getElementById('image-preview'),
    scannerOverlay: document.getElementById('scanner-overlay'),
    analysisLoading: document.getElementById('analysis-loading'),
    analysisResult: document.getElementById('analysis-result'),
    logFoodBtn: document.getElementById('log-food-btn'),
    retryBtn: document.getElementById('retry-btn'),
    
    // Profile
    saveGoalsBtn: document.getElementById('save-goals-btn'),
    setCal: document.getElementById('set-cal'),
    setPro: document.getElementById('set-pro'),
    setCar: document.getElementById('set-car'),
    setFat: document.getElementById('set-fat'),
    
    toast: document.getElementById('toast')
};

let pendingFood = null;
let weeklyChartInstance = null;

// Initialize
function init() {
    loadState();
    updateDate();
    updateUI();
    initChart();
    populateSettingsForm();
    setupEventListeners();
}

// State Management
function loadState() {
    const savedState = localStorage.getItem('calai_state');
    const todayStr = new Date().toDateString();
    const lastLogin = localStorage.getItem('calai_last_login');

    if (savedState) {
        const parsed = JSON.parse(savedState);
        state.goals = parsed.goals || state.goals;
        state.streak = parsed.streak || state.streak;
        
        if (lastLogin === todayStr) {
            state.today = parsed.today || state.today;
        }
    }
    localStorage.setItem('calai_last_login', todayStr);
}

function saveState() {
    localStorage.setItem('calai_state', JSON.stringify(state));
}

// UI Updates
function updateDate() {
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    els.date.textContent = new Date().toLocaleDateString('en-US', options);
    els.streak.textContent = `${state.streak} Day Streak`;
}

function updateUI() {
    // Animate Number Counters
    animateValue(els.calEaten, parseInt(els.calEaten.textContent) || 0, state.today.calories, 1000);
    animateValue(els.proEaten, parseInt(els.proEaten.textContent) || 0, state.today.protein, 1000);
    animateValue(els.carEaten, parseInt(els.carEaten.textContent) || 0, state.today.carbs, 1000);
    animateValue(els.fatEaten, parseInt(els.fatEaten.textContent) || 0, state.today.fat, 1000);
    
    els.calGoal.textContent = state.goals.calories;
    els.proGoal.textContent = state.goals.protein;
    els.carGoal.textContent = state.goals.carbs;
    els.fatGoal.textContent = state.goals.fat;
    
    // Update Rings
    setRingProgress(els.calProgress, state.today.calories, state.goals.calories, 377);
    setRingProgress(els.proProgress, state.today.protein, state.goals.protein, 126);
    setRingProgress(els.carProgress, state.today.carbs, state.goals.carbs, 126);
    setRingProgress(els.fatProgress, state.today.fat, state.goals.fat, 126);
    
    renderDiary();
}

function animateValue(obj, start, end, duration) {
    if (start === end) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        // easeOutQuart
        const ease = 1 - Math.pow(1 - progress, 4);
        obj.textContent = Math.floor(ease * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.textContent = end;
        }
    };
    window.requestAnimationFrame(step);
}

function setRingProgress(element, current, goal, circumference) {
    const percent = Math.min(current / goal, 1);
    const offset = circumference - (percent * circumference);
    element.style.strokeDashoffset = offset;
}

function renderDiary() {
    if (state.today.meals.length === 0) {
        els.diaryList.innerHTML = `<div class="empty-state"><p>No meals logged yet. Tap the + to add food!</p></div>`;
        return;
    }
    
    els.diaryList.innerHTML = '';
    const meals = [...state.today.meals].reverse();
    
    meals.forEach(meal => {
        const item = document.createElement('div');
        item.className = 'meal-item slide-up-anim';
        
        let icon = 'fa-utensils';
        if (meal.name.toLowerCase().includes('salad')) icon = 'fa-leaf';
        else if (meal.name.toLowerCase().includes('chicken') || meal.name.toLowerCase().includes('meat')) icon = 'fa-drumstick-bite';
        
        item.innerHTML = `
            <div class="meal-info">
                <div class="meal-icon"><i class="fa-solid ${icon}"></i></div>
                <div class="meal-details">
                    <h4>${meal.name}</h4>
                    <p>${meal.protein}g P • ${meal.carbs}g C • ${meal.fat}g F</p>
                </div>
            </div>
            <div class="meal-calories"><span class="cal">${meal.calories}</span><br><span style="font-size:11px;color:var(--text-muted)">kcal</span></div>
        `;
        els.diaryList.appendChild(item);
    });
}

// Navigation
function showView(viewId) {
    // Hide all
    Object.values(views).forEach(v => {
        v.classList.remove('active');
        v.classList.add('hidden');
    });
    
    // Show target
    const target = views[viewId];
    target.classList.remove('hidden');
    setTimeout(() => target.classList.add('active'), 10);
    
    // Update nav icons
    if (viewId !== 'analyze-view') {
        els.navItems.forEach(btn => {
            if (btn.dataset.target === viewId) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }
}

// Chart.js Setup
function initChart() {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) return;
    
    // Mock 7-day data
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = [1900, 2100, 1850, 2050, 1700, 2200, state.today.calories || 400];
    const goalLine = Array(7).fill(state.goals.calories);

    weeklyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Calories',
                    data: data,
                    backgroundColor: 'rgba(139, 92, 246, 0.8)',
                    borderRadius: 6,
                },
                {
                    label: 'Goal',
                    data: goalLine,
                    type: 'line',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                    tension: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { display: false, beginAtZero: true },
                x: { 
                    grid: { display: false, drawBorder: false },
                    ticks: { color: '#8a8a93', font: { family: 'Outfit', size: 12 } }
                }
            },
            animation: { duration: 1500, easing: 'easeOutQuart' }
        }
    });
}

// Analysis Flow
function resetAnalysisState() {
    els.uploadPrompt.classList.remove('hidden');
    document.querySelector('.action-buttons').classList.remove('hidden');
    els.previewContainer.classList.add('hidden');
    els.scannerOverlay.classList.add('hidden');
    els.analysisLoading.classList.add('hidden');
    els.analysisResult.classList.add('hidden');
    
    els.cameraInput.value = '';
    els.galleryInput.value = '';
    pendingFood = null;
}

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

function startAnalysis(base64Image) {
    els.uploadPrompt.classList.add('hidden');
    document.querySelector('.action-buttons').classList.add('hidden');
    
    els.previewContainer.classList.remove('hidden');
    els.scannerOverlay.classList.remove('hidden'); // Turn on Laser!
    els.analysisLoading.classList.remove('hidden');
    
    setTimeout(() => {
        els.scannerOverlay.classList.add('hidden');
        els.analysisLoading.classList.add('hidden');
        els.analysisResult.classList.remove('hidden');
        
        pendingFood = {
            name: "Grilled Salmon Bowl",
            calories: 520,
            protein: 45,
            carbs: 35,
            fat: 22
        };
        
        document.getElementById('result-food-name').textContent = pendingFood.name;
        document.getElementById('r-cal').textContent = pendingFood.calories;
        document.getElementById('r-pro').textContent = pendingFood.protein + 'g';
        document.getElementById('r-car').textContent = pendingFood.carbs + 'g';
        document.getElementById('r-fat').textContent = pendingFood.fat + 'g';
        
    }, 3000); // 3 seconds scanning
}

function logFood() {
    if (!pendingFood) return;
    
    state.today.calories += pendingFood.calories;
    state.today.protein += pendingFood.protein;
    state.today.carbs += pendingFood.carbs;
    state.today.fat += pendingFood.fat;
    
    state.today.meals.push({ ...pendingFood, time: new Date().toLocaleTimeString() });
    
    saveState();
    updateUI();
    
    // Update chart if exists
    if (weeklyChartInstance) {
        weeklyChartInstance.data.datasets[0].data[6] = state.today.calories;
        weeklyChartInstance.update();
    }
    
    showView('dashboard-view');
    showToast("Meal logged successfully!");
}

// Profile Logic
function populateSettingsForm() {
    els.setCal.value = state.goals.calories;
    els.setPro.value = state.goals.protein;
    els.setCar.value = state.goals.carbs;
    els.setFat.value = state.goals.fat;
}

function saveGoals() {
    state.goals.calories = parseInt(els.setCal.value);
    state.goals.protein = parseInt(els.setPro.value);
    state.goals.carbs = parseInt(els.setCar.value);
    state.goals.fat = parseInt(els.setFat.value);
    
    saveState();
    updateUI();
    
    if (weeklyChartInstance) {
        weeklyChartInstance.data.datasets[1].data = Array(7).fill(state.goals.calories);
        weeklyChartInstance.update();
    }
    
    showToast("Goals updated successfully!");
}

function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.remove('hidden');
    setTimeout(() => els.toast.classList.add('show'), 10);
    setTimeout(() => {
        els.toast.classList.remove('show');
        setTimeout(() => els.toast.classList.add('hidden'), 300);
    }, 3000);
}

// Event Listeners Setup
function setupEventListeners() {
    els.navItems.forEach(item => {
        item.addEventListener('click', () => showView(item.dataset.target));
    });
    
    els.navAddBtn.addEventListener('click', () => {
        resetAnalysisState();
        showView('analyze-view');
    });
    
    els.btnCloseAnalyze.addEventListener('click', () => showView('dashboard-view'));
    els.cameraInput.addEventListener('change', handleImageSelect);
    els.galleryInput.addEventListener('change', handleImageSelect);
    els.logFoodBtn.addEventListener('click', logFood);
    els.retryBtn.addEventListener('click', resetAnalysisState);
    els.saveGoalsBtn.addEventListener('click', saveGoals);
}

document.addEventListener('DOMContentLoaded', init);
