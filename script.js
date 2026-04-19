// DOM Elements
const form = document.getElementById('analyzerForm');
const analyzeBtn = document.getElementById('analyzeBtn');
const btnText = analyzeBtn.querySelector('.btn-text');
const btnLoading = analyzeBtn.querySelector('.btn-loading');
const results = document.getElementById('results');
const analysisContent = document.getElementById('analysisContent');
const errorDiv = document.getElementById('error');
const errorText = document.getElementById('errorText');
const usageCount = document.getElementById('usageCount');
const usageTextEl = document.getElementById('usageText');
const shareBtn = document.getElementById('shareBtn');
const whatsappBtn = document.getElementById('whatsappBtn');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const analyzeAnotherBtn = document.getElementById('analyzeAnotherBtn');
const closeResultsBtn = document.getElementById('closeResults');

// Demo elements
const analyzeDemoBtn = document.getElementById('analyzeDemoBtn');
const demoAdCopy = document.getElementById('demoAdCopy');
const demoResults = document.getElementById('demoResults');

// Rate limiting
function checkDailyLimit() {
  const today = new Date().toDateString();
  const stored = JSON.parse(localStorage.getItem('adanalyzer_usage') || '{}');
  
  if (stored.date !== today) {
    return { remaining: 5, used: 0 };
  }
  
  const used = stored.count || 0;
  const remaining = Math.max(0, 5 - used);
  
  return { remaining, used };
}

function incrementUsage() {
  const today = new Date().toDateString();
  const stored = JSON.parse(localStorage.getItem('adanalyzer_usage') || '{}');
  
  const newCount = stored.date === today ? (stored.count || 0) + 1 : 1;
  
  localStorage.setItem('adanalyzer_usage', JSON.stringify({
    date: today,
    count: newCount
  }));
  
  return 5 - newCount;
}

function updateUsageDisplay() {
  const { remaining } = checkDailyLimit();
  usageTextEl.textContent = `${remaining} free ${remaining === 1 ? 'analysis' : 'analyses'} remaining today`;
  
  if (remaining === 0) {
    usageCount.classList.add('usage-depleted');
  } else {
    usageCount.classList.remove('usage-depleted');
  }
}

// Initialize
updateUsageDisplay();

// Demo button
analyzeDemoBtn.addEventListener('click', async () => {
  const demoText = demoAdCopy.value;
  
  // Check rate limit
  const { remaining } = checkDailyLimit();
  if (remaining === 0) {
    showError('Daily limit reached (5 analyses). Try again tomorrow or contact us at 09067285890 for unlimited access.');
    return;
  }
  
  // Set loading
  analyzeDemoBtn.disabled = true;
  analyzeDemoBtn.innerHTML = '<span class="spinner"></span> <span>Analyzing...</span>';
  
  try {
    const response = await fetch('https://adanalyzer-api.bamzonline01.workers.dev/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adCopy: demoText })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Analysis failed');
    }
    
    const data = await response.json();
    
    // Increment usage
    incrementUsage();
    updateUsageDisplay();
    
    // Show demo results
    demoResults.style.display = 'block';
    demoResults.querySelector('.demo-results-content').innerHTML = formatAnalysis(data.analysis);
    
    // Scroll to demo results
    setTimeout(() => {
      demoResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    
  } catch (error) {
    console.error('Demo analysis error:', error);
    showError(error.message || 'Failed to analyze demo ad. Please try again.');
  } finally {
    analyzeDemoBtn.disabled = false;
    analyzeDemoBtn.innerHTML = '<span class="btn-icon">🔍</span> <span>Analyze This Ad</span>';
  }
});

// Main form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Check rate limit
  const { remaining } = checkDailyLimit();
  if (remaining === 0) {
    showError('Daily limit reached (5 analyses). Try again tomorrow or contact us at 09067285890 for unlimited access.');
    return;
  }
  
  const adCopy = document.getElementById('adCopy').value.trim();
  const creative = document.getElementById('creative').value.trim();
  
  if (!adCopy) {
    showError('Please paste your ad copy');
    return;
  }
  
  // Show loading
  setLoading(true);
  hideError();
  results.style.display = 'none';
  
  try {
    const response = await fetch('https://adanalyzer-api.bamzonline01.workers.dev/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adCopy, creative })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Analysis failed');
    }
    
    const data = await response.json();
    
    // Increment usage
    const newRemaining = incrementUsage();
    updateUsageDisplay();
    
    // Display results
    displayResults(data.analysis);
    
    // Scroll to results
    setTimeout(() => {
      results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
  } catch (error) {
    console.error('Analysis error:', error);
    showError(error.message || 'Failed to analyze ad. Please try again.');
  } finally {
    setLoading(false);
  }
});

function setLoading(loading) {
  analyzeBtn.disabled = loading;
  btnText.style.display = loading ? 'none' : 'inline';
  btnLoading.style.display = loading ? 'flex' : 'none';
}

function showError(message) {
  errorText.textContent = message;
  errorDiv.style.display = 'flex';
  setTimeout(() => {
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

function hideError() {
  errorDiv.style.display = 'none';
}

function displayResults(analysis) {
  analysisContent.innerHTML = formatAnalysis(analysis);
  results.style.display = 'block';
}

function formatAnalysis(text) {
  // Format analysis text
  let formatted = text
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  
  formatted = `<div class="analysis-text"><p>${formatted}</p></div>`;
  
  // Highlight scores
  formatted = formatted.replace(/(\d+\/10)/g, '<strong class="score-highlight">$1</strong>');
  
  // Highlight ratings
  formatted = formatted.replace(/\b(HIGH|MEDIUM|LOW)\b/g, '<span class="rating rating-$1">$1</span>');
  
  return formatted;
}

// Share button - native share or Twitter
shareBtn.addEventListener('click', async () => {
  trackEvent('share_clicked');
  
  const shareData = {
    title: 'AdAnalyzer - Nigerian Ad Copy Analyzer',
    text: 'I just used AdAnalyzer to check my ad copy before spending. Free tool for Nigerian advertisers built by @pdigitalhq',
    url: window.location.origin
  };
  
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      trackEvent('share_completed');
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share error:', err);
      }
    }
  } else {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
    trackEvent('share_completed');
  }
});

// WhatsApp share
whatsappBtn.addEventListener('click', () => {
  trackEvent('whatsapp_share_clicked');
  
  const text = `I just used AdAnalyzer to check my Facebook ad before spending.

It caught CPM killers that would have cost me N50,000+.

Free tool built for Nigerian businesses: ${window.location.origin}`;
  
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(whatsappUrl, '_blank');
  
  trackEvent('whatsapp_share_completed');
});

// Copy link
copyLinkBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(window.location.origin);
    
    const originalHTML = copyLinkBtn.innerHTML;
    copyLinkBtn.innerHTML = `
      <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
      </svg>
      <span>Copied!</span>
    `;
    
    setTimeout(() => {
      copyLinkBtn.innerHTML = originalHTML;
    }, 2000);
    
    trackEvent('link_copied');
  } catch (err) {
    console.error('Copy error:', err);
    showError('Failed to copy link');
  }
});

// Analyze another
analyzeAnotherBtn.addEventListener('click', () => {
  results.style.display = 'none';
  document.getElementById('adCopy').value = '';
  document.getElementById('creative').value = '';
  document.getElementById('adCopy').focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Close results
closeResultsBtn.addEventListener('click', () => {
  results.style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Track events
function trackEvent(eventName) {
  fetch('https://adanalyzer-api.bamzonline01.workers.dev/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: eventName })
  }).catch(() => {});
}
