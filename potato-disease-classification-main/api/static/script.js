/**
 * LeafGuard AI — script.js
 * Full client-side logic: theme, upload, API, results, charts, toasts
 */

'use strict';

// ── API Configuration ──────────────────────────────────────────
const API_URL = window.location.origin;

// ── DOM References ─────────────────────────────────────────────
const themeToggle          = document.getElementById('themeToggle');
const uploadArea           = document.getElementById('uploadArea');
const fileInput            = document.getElementById('fileInput');
const previewArea          = document.getElementById('previewArea');
const imagePreview         = document.getElementById('imagePreview');
const removeImageBtn       = document.getElementById('removeImage');
const fileNameEl           = document.getElementById('fileName');
const fileSizeEl           = document.getElementById('fileSize');
const analyzeBtn           = document.getElementById('analyzeBtn');
const newAnalysisBtn       = document.getElementById('newAnalysis');
const resultsSection       = document.getElementById('resultsSection');
const loadingState         = document.getElementById('loadingState');
const loadingProgressBar   = document.getElementById('loadingProgressBar');
const errorState           = document.getElementById('errorState');
const errorText            = document.getElementById('errorText');
const errorRetryBtn        = document.getElementById('errorRetry');
const diseaseTypeSelect    = document.getElementById('diseaseType');
const mobileMenuBtn        = document.getElementById('mobileMenuBtn');
const navLinksEl           = document.getElementById('navLinks');
const toastContainer       = document.getElementById('toastContainer');
const navbar               = document.getElementById('navbar');

// Result elements
const diseaseName          = document.getElementById('diseaseName');
const diseaseBadge         = document.getElementById('diseaseBadge');
const verdictIcon          = document.getElementById('verdictIcon');
const confidenceValue      = document.getElementById('confidenceValue');
const confidenceFill       = document.getElementById('confidenceFill');
const probabilityBars      = document.getElementById('probabilityBars');

// Disease info elements
const diseaseSeverityBadge = document.getElementById('diseaseSeverityBadge');
const infoDesc             = document.getElementById('infoDesc');
const infoCauses           = document.getElementById('infoCauses');
const infoSymptoms         = document.getElementById('infoSymptoms');
const infoTreatment        = document.getElementById('infoTreatment');
const infoPrevention       = document.getElementById('infoPrevention');
const infoWeather          = document.getElementById('infoWeather');
const infoFungicides       = document.getElementById('infoFungicides');

// State
let accuracyChart  = null;
let currentFile    = null;
let loadingInterval = null;

// ── Disease Intelligence Database ──────────────────────────────
const diseaseProfiles = {
  '1': { // Potato
    'Early Blight': {
      description:  'Early blight is a major potato disease caused by the fungus Alternaria solani. It primarily damages older foliage first, decreasing the plant\'s energy production and limiting crop yield.',
      causes:       'Alternaria solani spores overwinter in infected crop trash and soil. Spores spread via wind, moisture splash, or insect vectors.',
      symptoms:     'Concentric brown-black rings forming target-like patterns on leaves, surrounded by a faint yellow halo. Lower leaves die off prematurely.',
      treatment:    'Apply systemic or protective copper-based sprays immediately. Prune and dispose of highly infected lower leaves to decrease fungal spore density.',
      prevention:   'Enforce a 3-year crop rotation cycle. Prevent overhead watering to decrease leaf dampness. Maintain crop spacing for ventilation.',
      severity:     'medium',
      weather:      'Warm (24°C – 29°C), humid weather interspersed with dew and rainfall.',
      fungicides:   ['Chlorothalonil', 'Mancozeb', 'Copper Hydroxide', 'Azoxystrobin']
    },
    'Late Blight': {
      description:  'Late blight is a highly infectious oomycete disease caused by Phytophthora infestans. It is famous for causing the historic Irish Potato Famine and can devastate whole fields in days.',
      causes:       'Phytophthora infestans oomycete pathogen, spreading via windborne sporangia or infected potato seed tubers.',
      symptoms:     'Large, dark green to purplish-black water-soaked lesions on leaves and stems. White, fuzzy growth appears on leaf undersides during damp weather. Tubers rot rapidly.',
      treatment:    'Destroy and discard infected foliage immediately. Apply strong systemic crop protective fungicides to the remaining field.',
      prevention:   'Plant certified disease-free seeds. Avoid overhead irrigation. Destroy cull piles and volunteer plants. Use blight-resistant cultivars.',
      severity:     'high',
      weather:      'Cool temperatures (15°C – 20°C) with persistent dampness, rain, fog, or high humidity.',
      fungicides:   ['Metalaxyl', 'Cymoxanil', 'Fluazinam', 'Mancozeb']
    },
    'Healthy': {
      description:  'The leaf appears healthy and normal. Chlorophyll distribution is even, and the leaf tissue shows robust growth with no signs of fungal, bacterial, or viral disease.',
      causes:       'Optimal agricultural practices, planting resistant seeds, good ventilation, and balanced nutrition.',
      symptoms:     'Consistent green coloration, clean intact margins, robust leaf structure, and no visible spotting or blight lesions.',
      treatment:    'No active treatment required. Continue standard cultural care and irrigation cycles.',
      prevention:   'Monitor crops weekly. Avoid overwatering. Maintain nutrient balances in the soil.',
      severity:     'none',
      weather:      'Moderate temperatures, low humidity, adequate sunlight, and good wind currents.',
      fungicides:   ['None required', 'Biological preventive agents (Optional)']
    }
  },
  '2': { // Tomato
    'Early Blight': {
      description:  'Tomato early blight caused by Alternaria solani targets leaves, stems, and fruits, resulting in early defoliation and compromised fruit yields.',
      causes:       'Alternaria solani fungus surviving on crop debris, volunteer plants, or solanaceous weeds.',
      symptoms:     'Leathery, dark target-like spots on older leaves. Yellowing of surrounding tissue. Sunken dark spots near fruit stems.',
      treatment:    'Prune lowest leaves to prevent soil-to-leaf spore transfers. Treat crops with copper-based protectant sprays.',
      prevention:   'Mulch soil surfaces to block soil splash. Provide sufficient row spacing. Rotate crops yearly.',
      severity:     'medium',
      weather:      'Warm (24°C – 29°C) and humid weather combined with frequent rains.',
      fungicides:   ['Chlorothalonil', 'Mancozeb', 'Copper Octanoate', 'Difenoconazole']
    },
    'Late Blight': {
      description:  'Late blight in tomatoes is a highly destructive oomycete disease caused by Phytophthora infestans that rapidly damages leaves, stems, and fruits.',
      causes:       'Phytophthora infestans spores carried over long distances by wind during rainy seasons.',
      symptoms:     'Large, irregular water-soaked spots turning brown quickly. Velvety white mold on leaf undersides. Greasy brown spots on green fruit.',
      treatment:    'Uproot and destroy infected plants immediately. Spray remaining healthy crops with systemic fungicides.',
      prevention:   'Ensure plant spacing to dry quickly. Avoid overhead watering. Clean tools regularly.',
      severity:     'high',
      weather:      'Cool, wet, cloudy, or foggy conditions with high relative humidity.',
      fungicides:   ['Metalaxyl', 'Cymoxanil', 'Copper Hydroxide', 'Mancozeb']
    },
    'Leaf Mold': {
      description:  'Tomato leaf mold caused by Passalora fulva primarily attacks tomatoes grown in humid greenhouses or high-tunnels with poor ventilation.',
      causes:       'Passalora fulva fungal spores overwintering on seeds, crop debris, or greenhouse stakes.',
      symptoms:     'Pale green or yellow spots on upper leaf surface. Dense olive-green to purple velvety mold on the underside of spots.',
      treatment:    'Urgently improve air circulation and decrease humidity below 85%. Apply curative copper sprays.',
      prevention:   'Select resistant hybrid varieties. Prune lower foliage. Clean greenhouse structures regularly.',
      severity:     'medium',
      weather:      'Warm (21°C – 24°C) with high greenhouse relative humidity (>85%).',
      fungicides:   ['Copper Hydroxide', 'Chlorothalonil', 'Mancozeb']
    },
    'Healthy': {
      description:  'The tomato leaf is healthy, displaying excellent cell structures. Photosynthesis is performing optimally with no pathogen presence.',
      causes:       'Favorable ventilation, clean seeds, disease prevention, and correct watering routines.',
      symptoms:     'Bright green, clean leaves. Sturdy petioles and leaf veins with no discoloration or mold patches.',
      treatment:    'No active treatment required. Monitor and maintain soil hydration.',
      prevention:   'Continue applying compost teas or beneficial microbes. Prevent crop crowding.',
      severity:     'none',
      weather:      'Sunny days, moderate humidity, and adequate soil drainage.',
      fungicides:   ['None required']
    }
  },
  '3': { // Corn
    'Blight': {
      description:  'Corn leaf blight (Northern or Southern) caused by Exserohilum turcicum or Bipolaris maydis targets leaves, reducing photosynthetic area and cob size.',
      causes:       'Fungal pathogens overwintering on corn residue left on the soil surface.',
      symptoms:     'Long, cigar-shaped grayish-green or tan lesions on leaves. Dark spore clusters inside lesions in damp conditions.',
      treatment:    'Apply recommended foliar fungicides if lesions appear early in the season on high-value crops.',
      prevention:   'Select hybrid corn varieties with blight resistance genes. Incorporate crop residues into soil. Rotate crops.',
      severity:     'high',
      weather:      'Moderate temperatures (18°C – 27°C) accompanied by heavy dews or overcast days.',
      fungicides:   ['Pyraclostrobin', 'Azoxystrobin', 'Propiconazole']
    },
    'Common Rust': {
      description:  'Common rust caused by Puccinia sorghi creates pustules on foliage leading to leaf yellowing and yield losses.',
      causes:       'Puccinia sorghi spores carried northwards by winds from southern growing zones.',
      symptoms:     'Elongated cinnamon-brown pustules on both leaf surfaces. Pustules rupture releasing powdery brown spores.',
      treatment:    'Fungicides can be applied to sweet corn if rust develops early in the season.',
      prevention:   'Plant rust-resistant hybrid strains. Plant crops early to avoid high summer spore loads.',
      severity:     'medium',
      weather:      'Cool, wet, and humid conditions (15°C – 22°C) with long dew periods.',
      fungicides:   ['Pyraclostrobin', 'Propiconazole', 'Azoxystrobin']
    },
    'Healthy': {
      description:  'The corn leaf is healthy and shows robust leaf structures. Vigor is excellent with no signs of rust or blight.',
      causes:       'Optimal soil health, hybrid resistance genes, correct fertilization, and good drainage.',
      symptoms:     'Long, clean green blade with clear margins and no brown spots or spore pustules.',
      treatment:    'No active treatment needed. Continue monitoring nitrogen levels.',
      prevention:   'Avoid high-density planting that traps moisture. Rotate fields.',
      severity:     'none',
      weather:      'Warm, sunny days with dry leaf conditions.',
      fungicides:   ['None required']
    }
  }
};

// ── Initialise ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupEventListeners();
  initAccuracyChart();
  setupSmoothScrolling();
  setupNavbarScroll();
});

// ── Theme ──────────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('leafguard-theme') || 'light';
  if (saved === 'dark') applyDarkMode(true, false);
}

function applyDarkMode(isDark, withToast = true) {
  document.body.classList.toggle('dark-mode', isDark);
  themeToggle.innerHTML = isDark
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
  localStorage.setItem('leafguard-theme', isDark ? 'dark' : 'light');
  updateChartTheme();
  if (withToast) showToast(`${isDark ? 'Dark' : 'Light'} theme activated`, 'info');
}

themeToggle.addEventListener('click', () => {
  const isDark = !document.body.classList.contains('dark-mode');
  applyDarkMode(isDark);
});

function updateChartTheme() {
  if (!accuracyChart) return;
  const isDark  = document.body.classList.contains('dark-mode');
  const textClr = isDark ? '#f0fdf4' : '#0f172a';
  const gridClr = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.05)';

  accuracyChart.options.plugins.legend.labels.color = textClr;
  ['x', 'y'].forEach(axis => {
    accuracyChart.options.scales[axis].ticks.color = textClr;
    accuracyChart.options.scales[axis].grid.color  = gridClr;
  });
  accuracyChart.update();
}

// ── Navbar Scroll Effect ───────────────────────────────────────
function setupNavbarScroll() {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);

    // Active nav link highlight based on section in view
    const sections = ['hero', 'features', 'about', 'footer'];
    let current = '';
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el && window.scrollY >= el.offsetTop - 100) current = id;
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href').replace('#', '');
      link.classList.toggle('active', href === current);
    });
  }, { passive: true });
}

// ── Mobile Nav ─────────────────────────────────────────────────
mobileMenuBtn.addEventListener('click', () => {
  const isOpen = navLinksEl.classList.toggle('active');
  mobileMenuBtn.innerHTML = isOpen
    ? '<i class="fa-solid fa-xmark"></i>'
    : '<i class="fa-solid fa-bars"></i>';
});

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navLinksEl.classList.remove('active');
    mobileMenuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
  });
});

// ── Smooth Scrolling ───────────────────────────────────────────
function setupSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ── Event Listeners ────────────────────────────────────────────
function setupEventListeners() {
  uploadArea.addEventListener('click',     ()  => fileInput.click());
  uploadArea.addEventListener('dragover',  (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
  uploadArea.addEventListener('dragleave', ()  => uploadArea.classList.remove('dragover'));
  uploadArea.addEventListener('drop',      (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) handleFileSelect(e.dataTransfer.files[0]);
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFileSelect(e.target.files[0]);
  });

  removeImageBtn.addEventListener('click', (e) => { e.stopPropagation(); resetUpload(); });
  analyzeBtn.addEventListener('click',      analyzeImage);
  newAnalysisBtn.addEventListener('click',  resetUpload);
  errorRetryBtn.addEventListener('click',   resetUpload);
}

// ── Toast Notifications ────────────────────────────────────────
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = { info: 'fa-info-circle', error: 'fa-triangle-exclamation', warning: 'fa-exclamation-circle' };
  const icon = iconMap[type] || 'fa-info-circle';

  toast.innerHTML = `
    <i class="fa-solid ${icon} toast-icon"></i>
    <span class="toast-message">${message}</span>
    <span class="toast-close"><i class="fa-solid fa-xmark"></i></span>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => dismissToast(toast));
  toastContainer.appendChild(toast);
  setTimeout(() => dismissToast(toast), 4000);
}

function dismissToast(toast) {
  if (!toast.parentElement) return;
  toast.style.animation = 'toastSlideOut .3s ease-in forwards';
  setTimeout(() => toast.remove(), 300);
}

// ── File Handling ──────────────────────────────────────────────
function handleFileSelect(file) {
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    showToast('Invalid format. Please use PNG, JPG, or JPEG.', 'error');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('File exceeds 5 MB limit. Choose a smaller image.', 'error');
    return;
  }

  currentFile = file;
  fileNameEl.textContent = file.name;
  fileSizeEl.textContent = formatBytes(file.size);

  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.src = e.target.result;
    uploadArea.hidden  = true;
    previewArea.hidden = false;
    analyzeBtn.disabled = false;
    errorState.hidden  = true;
    showToast('Image ready for analysis!', 'info');
  };
  reader.readAsDataURL(file);
}

function resetUpload() {
  fileInput.value       = '';
  currentFile           = null;
  imagePreview.src      = '';
  uploadArea.hidden     = false;
  previewArea.hidden    = true;
  analyzeBtn.disabled   = true;
  analyzeBtn.hidden     = false;
  newAnalysisBtn.hidden = true;
  resultsSection.hidden = true;
  errorState.hidden     = true;
  loadingState.hidden   = true;
  loadingProgressBar.style.width = '0%';
  clearInterval(loadingInterval);
}

function formatBytes(bytes, decimals = 2) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

// ── Progress Bar Simulation ────────────────────────────────────
function runLoadingProgressBar() {
  let progress = 0;
  loadingProgressBar.style.width = '0%';
  loadingInterval = setInterval(() => {
    if (progress < 88) {
      progress += Math.floor(Math.random() * 6) + 2;
      if (progress > 88) progress = 88;
      loadingProgressBar.style.width = `${progress}%`;
    }
  }, 120);
}

// ── API Call ───────────────────────────────────────────────────
async function analyzeImage() {
  if (!currentFile) return;

  loadingState.hidden   = false;
  analyzeBtn.disabled   = true;
  errorState.hidden     = true;
  resultsSection.hidden = true;
  runLoadingProgressBar();

  const formData = new FormData();
  formData.append('file', currentFile);
  // Note: model_type is read by the frontend only; the current backend uses the potato model for all
  formData.append('model_type', diseaseTypeSelect.value);

  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      body:   formData
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || `Server error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    clearInterval(loadingInterval);
    loadingProgressBar.style.width = '100%';

    setTimeout(() => {
      loadingState.hidden   = false; // keep briefly at 100% then hide
      loadingState.hidden   = true;
      displayResult(data, diseaseTypeSelect.value);
      analyzeBtn.hidden     = true;
      newAnalysisBtn.hidden = false;
      showToast('Leaf diagnostics complete!', 'info');
    }, 350);

  } catch (err) {
    clearInterval(loadingInterval);
    loadingState.hidden  = true;
    analyzeBtn.disabled  = false;
    showError(err.message || 'Connection to prediction server failed. Please try again.');
    showToast('Analysis failed — check your connection.', 'error');
  }
}

// ── Display Results ────────────────────────────────────────────
function displayResult(data, cropType) {
  if (!data || !data.class) {
    showError('API returned an unexpected response.');
    return;
  }

  const diseaseClass  = data.class;
  const confidenceVal = (data.confidence * 100).toFixed(1);

  // Disease name
  diseaseName.textContent = diseaseClass;

  // Badge styling
  diseaseBadge.className = 'disease-badge';
  let badgeClass = 'healthy-status';
  let iconClass  = 'fa-circle-check';

  const lower = diseaseClass.toLowerCase();
  if (lower.includes('early blight') || lower.includes('rust') || lower.includes('mold')) {
    badgeClass = 'early-blight-status';
    iconClass  = 'fa-triangle-exclamation';
  } else if (lower.includes('late blight') || lower.includes('blight')) {
    badgeClass = 'late-blight-status';
    iconClass  = 'fa-virus';
  }

  diseaseBadge.classList.add(badgeClass);
  verdictIcon.className = `fa-solid ${iconClass}`;

  // Confidence bar
  confidenceValue.textContent = `${confidenceVal}%`;
  confidenceFill.style.width  = `${confidenceVal}%`;

  // Probability distribution bars
  probabilityBars.innerHTML = '';
  if (data.probabilities) {
    Object.entries(data.probabilities).forEach(([label, prob]) => {
      const pct = (prob * 100).toFixed(1);
      const lbl = label.toLowerCase();

      let fillClass = 'fill-fallback';
      if (lbl.includes('healthy'))                              fillClass = 'fill-healthy';
      else if (lbl.includes('early') || lbl.includes('rust') || lbl.includes('mold')) fillClass = 'fill-early-blight';
      else if (lbl.includes('late') || lbl.includes('blight')) fillClass = 'fill-late-blight';

      const row = document.createElement('div');
      row.className = 'class-prob-row';
      row.innerHTML = `
        <div class="class-prob-info">
          <span class="class-prob-label">${label}</span>
          <span class="class-prob-value">${pct}%</span>
        </div>
        <div class="class-prob-bar-bg">
          <div class="class-prob-bar-fill ${fillClass}" style="width:0%"></div>
        </div>
      `;
      probabilityBars.appendChild(row);
      // Animate after layout tick
      requestAnimationFrame(() => {
        setTimeout(() => {
          row.querySelector('.class-prob-bar-fill').style.width = `${pct}%`;
        }, 60);
      });
    });
  }

  // Disease intelligence profile
  const profile = (diseaseProfiles[cropType] || {})[diseaseClass] || {};

  if (profile.description) {
    // Severity badge
    const severityMap = {
      none:   { text: 'No Disease',      cls: 'severity-none' },
      medium: { text: 'Medium Severity', cls: 'severity-medium' },
      high:   { text: 'High Severity',   cls: 'severity-high' }
    };
    const sv = severityMap[profile.severity] || severityMap.none;
    diseaseSeverityBadge.innerHTML = `<span class="severity-badge ${sv.cls}">${sv.text}</span>`;

    // Populate info blocks
    infoDesc.textContent      = profile.description;
    infoCauses.textContent    = profile.causes;
    infoSymptoms.textContent  = profile.symptoms;
    infoTreatment.textContent = profile.treatment;
    infoPrevention.textContent= profile.prevention;
    infoWeather.textContent   = profile.weather;

    // Fungicide tags
    infoFungicides.innerHTML = '';
    (profile.fungicides || []).forEach(f => {
      const tag = document.createElement('span');
      tag.className   = 'fungicide-tag';
      tag.textContent = f;
      infoFungicides.appendChild(tag);
    });
  } else {
    // Fallback if disease not in our database
    infoDesc.textContent = `Detected: ${diseaseClass}. No detailed profile available for this crop/disease combination.`;
    diseaseSeverityBadge.innerHTML = '';
    ['infoCauses','infoSymptoms','infoTreatment','infoPrevention','infoWeather'].forEach(id => {
      document.getElementById(id).textContent = 'Information not available.';
    });
    infoFungicides.innerHTML = '';
  }

  // Show results section with animation
  resultsSection.hidden = false;
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Error Display ──────────────────────────────────────────────
function showError(message) {
  errorText.textContent = message || 'An unknown error occurred.';
  errorState.hidden     = false;
}

// ── Chart.js — Model Accuracy Chart ───────────────────────────
function initAccuracyChart() {
  const canvas = document.getElementById('accuracyChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const isDark  = document.body.classList.contains('dark-mode');
  const textClr = isDark ? '#f0fdf4' : '#0f172a';
  const gridClr = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.05)';

  // Simulated training accuracy / val accuracy across epochs
  const epochs   = Array.from({ length: 10 }, (_, i) => `Epoch ${i + 1}`);
  const trainAcc = [0.61, 0.72, 0.80, 0.85, 0.89, 0.91, 0.93, 0.95, 0.96, 0.97];
  const valAcc   = [0.58, 0.68, 0.76, 0.82, 0.86, 0.89, 0.91, 0.93, 0.94, 0.95];

  accuracyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: epochs,
      datasets: [
        {
          label:            'Training Accuracy',
          data:             trainAcc,
          borderColor:      '#22c55e',
          backgroundColor:  'rgba(34,197,94,.12)',
          borderWidth:      2.5,
          pointRadius:      4,
          pointHoverRadius: 6,
          tension:          0.42,
          fill:             true
        },
        {
          label:            'Validation Accuracy',
          data:             valAcc,
          borderColor:      '#86efac',
          backgroundColor:  'rgba(134,239,172,.08)',
          borderWidth:      2,
          pointRadius:      3,
          pointHoverRadius: 5,
          tension:          0.42,
          fill:             true,
          borderDash:       [6, 4]
        }
      ]
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      animation: {
        duration: 1200,
        easing:   'easeInOutQuart'
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color:     textClr,
            font:      { size: 12, family: "'Inter', sans-serif" },
            padding:   16,
            usePointStyle: true,
            pointStyleWidth: 10
          }
        },
        tooltip: {
          backgroundColor: isDark ? '#111b14' : '#fff',
          borderColor:     '#22c55e',
          borderWidth:     1,
          titleColor:      textClr,
          bodyColor:       textClr,
          cornerRadius:    10,
          padding:         12,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${(ctx.parsed.y * 100).toFixed(1)}%`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: textClr, font: { size: 11 }, maxRotation: 30 },
          grid:  { color: gridClr }
        },
        y: {
          min: 0.5,
          max: 1.0,
          ticks: {
            color: textClr,
            font:  { size: 11 },
            callback: v => `${(v * 100).toFixed(0)}%`
          },
          grid: { color: gridClr }
        }
      }
    }
  });
}
