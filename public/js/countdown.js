/**
 * Countdown Timer for Match Kickoff
 * Updates every second
 */

function updateCountdowns() {
  const countdownElements = document.querySelectorAll('.countdown-timer');
  
  countdownElements.forEach(el => {
    const matchDate = new Date(el.dataset.datetime);
    const now = new Date();
    const diff = matchDate - now;
    
    if (diff <= 0) {
      el.innerHTML = '<span class="text-red-400 font-bold">LIVE NOW</span>';
      return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    let html = '';
    
    if (days > 0) {
      html += `<span><span class="countdown-number">${days}</span>d</span> `;
    }
    
    html += `<span><span class="countdown-number">${String(hours).padStart(2, '0')}</span>h</span> `;
    html += `<span><span class="countdown-number">${String(minutes).padStart(2, '0')}</span>m</span> `;
    html += `<span><span class="countdown-number">${String(seconds).padStart(2, '0')}</span>s</span>`;
    
    el.innerHTML = html;
  });
}

// Update immediately and then every second
updateCountdowns();
setInterval(updateCountdowns, 1000);

/**
 * Auto-refresh page every 60 seconds for live matches
 */
if (window.location.pathname === '/') {
  setTimeout(() => {
    location.reload();
  }, 60000);
}

/**
 * Toast notification system
 */
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Get team initials
 */
function getTeamInitials(name) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format relative time
 */
function formatRelativeTime(date) {
  const now = new Date();
  const diff = date - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (hours < 1) {
    return 'Starting soon';
  } else if (hours < 24) {
    return `In ${hours}h`;
  } else {
    return `In ${days}d`;
  }
}
