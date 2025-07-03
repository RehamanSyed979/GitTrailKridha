// --- FIELD VISIBILITY CONTROL TABLE ---
// Maps type value to fields to show (1=show, 0=hide). Update this table to control field visibility.
window.FIELD_VISIBILITY = {
  "Flats / Apartments":     {BHK:1, Bathrooms:1, Furnishing:1, ProjectStatus:1, Lister:1, SuperBuiltup:1, CarpetArea:1, Maintenance:1, TotalFloors:1, FloorNo:1, CarParking:1, Facing:1, ProjectName:1},
  "Independent / Builder Floors": {BHK:1, Bathrooms:1, Furnishing:1, ProjectStatus:1, Lister:1, SuperBuiltup:1, CarpetArea:1, Maintenance:1, TotalFloors:1, FloorNo:1, CarParking:1, Facing:1, ProjectName:1},
  "Farm House":             {BHK:1, Bathrooms:1, Furnishing:1, ProjectStatus:1, Lister:1, SuperBuiltup:1, CarpetArea:1, Maintenance:1, TotalFloors:1, FloorNo:1, CarParking:1, Facing:1, ProjectName:1},
  "House & Villa":          {BHK:1, Bathrooms:1, Furnishing:1, ProjectStatus:1, Lister:1, SuperBuiltup:1, CarpetArea:1, Maintenance:1, TotalFloors:1, FloorNo:1, CarParking:1, Facing:1, ProjectName:1},
  "Open Plots":             {BHK:0, Bathrooms:0, Furnishing:0, ProjectStatus:1, Lister:1, SuperBuiltup:1, CarpetArea:0, Maintenance:0, TotalFloors:0, FloorNo:0, CarParking:0, Facing:1, ProjectName:1},
  "Commercial":             {BHK:0, Bathrooms:0, Furnishing:0, ProjectStatus:1, Lister:1, SuperBuiltup:1, CarpetArea:0, Maintenance:0, TotalFloors:0, FloorNo:0, CarParking:1, Facing:1, ProjectName:1},
  "Office Spaces":          {BHK:0, Bathrooms:0, Furnishing:0, ProjectStatus:1, Lister:1, SuperBuiltup:1, CarpetArea:0, Maintenance:0, TotalFloors:0, FloorNo:0, CarParking:1, Facing:1, ProjectName:1}
};

// Utility: Show/hide fields based on selected type
function updateFieldVisibility() {
  const type = document.getElementById('type').value;
  const vis = window.FIELD_VISIBILITY[type] || {};
  // Map: field name => [labelId, inputId, wrapperDivId]
  const fieldMap = {
    BHK: ['BHK-label', 'BHK-group'],
    Bathrooms: ['Bathrooms-label', 'Bathrooms-group'],
    Furnishing: ['Furnishing-label', 'Furnishing-group'],
    ProjectStatus: ['ProjectStatus-label', 'ProjectStatus-group'],
    Lister: ['Lister-label', 'Lister-group'],
    SuperBuiltup: ['superBuiltup-label', 'superBuiltup'],
    CarpetArea: ['carpetArea-label', 'carpetArea'],
    Maintenance: ['maintenance-label', 'maintenance'],
    TotalFloors: ['totalFloors-label', 'totalFloors'],
    FloorNo: ['floorNo-label', 'floorNo'],
    CarParking: ['carParking-label', 'carParking-group'],
    Facing: ['facing-label', 'facing'],
    ProjectName: ['projectName-label', 'projectName']
  };
  Object.entries(fieldMap).forEach(([key, ids]) => {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const show = vis[key];
        el.style.display = show ? '' : 'none';
        // Remove 'required' from hidden fields to prevent validation errors
        if (!show) {
          el.removeAttribute('required');
        } else {
          // Only add required if the field is meant to be required (optional: check a config)
          // el.setAttribute('required', 'required');
        }
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  const typeSelect = document.getElementById('type');
  if (typeSelect) typeSelect.addEventListener('change', updateFieldVisibility);
  updateFieldVisibility();
});
// Fetch and render all ads
async function loadAds() {
  try {
    const res = await fetch(`${API_BASE}/ads`);
    if (!res.ok) throw new Error('Failed to fetch ads');
    const ads = await res.json();
    renderAds(ads);
  } catch (err) {
    showErrorModal('Could not load ads: ' + (err.message || err));
    if (window.console) console.error('[KridhaApp] loadAds error:', err);
  }
}
// ads.js - Handles fetching, rendering, favorites, and posting ads
// Change this to your backend server's URL and port
const API_BASE = 'http://localhost:3000/api'; // <-- Update to match your backend port
let currentUser = null; // Set this after login
// Patch: Always sync currentUser from window/global/localStorage
function syncCurrentUser() {
  // Always sync from localStorage, then window
  try {
    const u = localStorage.getItem('kridha_current_user');
    if (u) {
      currentUser = JSON.parse(u);
      window.currentUser = currentUser;
    } else {
      currentUser = null;
      window.currentUser = null;
    }
  } catch(e) {
    currentUser = null;
    window.currentUser = null;
  }
}


// Custom error modal logic
function showErrorModal(message) {
  let modal = document.getElementById('errorModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'errorModal';
    modal.innerHTML = `
      <div id="errorModalContent" style="background:#fff;max-width:400px;margin:10vh auto;padding:24px 24px 16px 24px;border-radius:12px;box-shadow:0 2px 16px #0002;position:relative;text-align:left;">
        <span id="closeErrorModal" style="position:absolute;top:8px;right:16px;cursor:pointer;font-size:22px;">&times;</span>
        <div id="errorModalMsg" style="margin-bottom:12px;color:#b00;font-size:16px;"></div>
        <button id="errorModalOk" style="background:#1a237e;color:#fff;padding:8px 24px;border:none;border-radius:6px;cursor:pointer;float:right;">OK</button>
      </div>
    `;
    Object.assign(modal.style, {
      position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: '#0007', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
    });
    document.body.appendChild(modal);
    modal.querySelector('#closeErrorModal').onclick = closeErrorModal;
    modal.querySelector('#errorModalOk').onclick = closeErrorModal;
  }
  document.getElementById('errorModalMsg').innerHTML = message;
  modal.style.display = 'flex';
  // Remove any previous auto-close timers (if any)
  if (window._errorModalTimer) {
    clearTimeout(window._errorModalTimer);
    window._errorModalTimer = null;
  }
}

function closeErrorModal() {
  let modal = document.getElementById('errorModal');
  if (modal) modal.style.display = 'none';
}

// Always sync before any action that needs auth


function initKridhaApp() {
  console.log('[KridhaApp] Initializing...');
  // Location autocomplete removed
  loadAds();
  const sellBtn = document.getElementById('sellBtn');
  const closeSellModalBtn = document.getElementById('closeSellModal');
  const sellForm = document.getElementById('sellForm');
  const favoritesBtn = document.getElementById('favoritesBtn');
  if (!sellBtn) console.error('[KridhaApp] Sell button not found!');
  if (!closeSellModalBtn) console.error('[KridhaApp] Close Sell Modal button not found!');
  if (!sellForm) console.error('[KridhaApp] Sell form not found!');
  if (!favoritesBtn) console.error('[KridhaApp] Favorites button not found!');
  if (sellBtn) sellBtn.onclick = openSellModal;
  if (closeSellModalBtn) closeSellModalBtn.onclick = closeSellModal;
  if (sellForm) sellForm.onsubmit = postAd;
  if (favoritesBtn) favoritesBtn.onclick = showFavorites;
  // Profile button navigation
  const profileBtn = document.getElementById('profileBtn');
  if (profileBtn) {
    profileBtn.onclick = function() {
      window.location.href = 'profile.html';
    };
  }
  // Change images input to file input if not already
  const imgInput = document.getElementById('images');
  if (imgInput && imgInput.type !== 'file') {
    const newInput = document.createElement('input');
    newInput.type = 'file';
    newInput.id = 'images';
    newInput.name = 'images';
    newInput.multiple = true;
    newInput.accept = 'image/*';
    imgInput.parentNode.replaceChild(newInput, imgInput);
  }
  // Image preview logic
  if (imgInput) {
    imgInput.addEventListener('change', function() {
      const preview = document.getElementById('imagePreview');
      if (!preview) return;
      preview.innerHTML = '';
      const files = Array.from(imgInput.files || []);
      files.forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = function(e) {
          const img = document.createElement('img');
          img.src = e.target.result;
          img.style.maxWidth = '80px';
          img.style.maxHeight = '80px';
          img.style.borderRadius = '8px';
          img.style.boxShadow = '0 2px 8px #bcb3f7';
          img.style.objectFit = 'cover';
          img.style.marginRight = '4px';
          preview.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
    });
  }

  // Google Places Autocomplete for location input (modal) and nav bar (homepage)
  function setupPlacesAutocomplete(inputId, suggestionsId) {
    const input = document.getElementById(inputId);
    const suggestions = document.getElementById(suggestionsId);
    let autocompleteService, sessionToken;
    if (input && suggestions && window.google && window.google.maps && window.google.maps.places) {
      autocompleteService = new google.maps.places.AutocompleteService();
      sessionToken = new google.maps.places.AutocompleteSessionToken();

      function debounce(fn, delay) {
        let timer = null;
        return function(...args) {
          clearTimeout(timer);
          timer = setTimeout(() => fn.apply(this, args), delay);
        };
      }

      function showError(message) {
        suggestions.innerHTML = `<div class="suggestion-item error" style="color:#b00;padding:8px 12px;">${message}</div>`;
        suggestions.style.display = 'block';
      }

      const handleInput = debounce(function() {
        const query = input.value.trim();
        if (!query) {
          suggestions.style.display = 'none';
          suggestions.innerHTML = '';
          return;
        }
        autocompleteService.getPlacePredictions({
          input: query,
          componentRestrictions: { country: 'in' },
          sessionToken,
          types: []
        }, function(predictions, status) {
          if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
            showError('Too many requests. Please wait a moment and try again.');
            return;
          }
          if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions || !predictions.length) {
            suggestions.style.display = 'none';
            suggestions.innerHTML = '';
            return;
          }
          suggestions.innerHTML = predictions.map(pred =>
            `<div class="suggestion-item" data-place-id="${pred.place_id}" style="padding:8px 12px;cursor:pointer;">${pred.description}</div>`
          ).join('');
          suggestions.style.display = 'block';
        });
      }, 350);

      input.addEventListener('input', handleInput);

      suggestions.addEventListener('mousedown', function(e) {
        const target = e.target.closest('.suggestion-item');
        if (!target) return;
        const placeId = target.getAttribute('data-place-id');
        const description = target.textContent;
        input.value = description;
        input.dataset.placeId = placeId;
        suggestions.style.display = 'none';
      });

      document.addEventListener('mousedown', function(e) {
        if (!suggestions.contains(e.target) && e.target !== input) {
          suggestions.style.display = 'none';
        }
      });
    }
  }

  // Modal location input
  setupPlacesAutocomplete('locationInput', 'locationSuggestions');
  // Nav bar location input
  setupPlacesAutocomplete('navLocationInput', 'navLocationSuggestions');

  // Show/hide apartment fields based on category selection
  const categorySelect = document.getElementById('category');
  const apartmentFields = document.getElementById('apartmentFields');
  if (categorySelect && apartmentFields) {
    categorySelect.addEventListener('change', function() {
      if (categorySelect.value === 'Appartment') {
        apartmentFields.style.display = 'flex';
      } else {
        apartmentFields.style.display = 'none';
        // Optionally clear values when hidden
        apartmentFields.querySelectorAll('input[type="number"]').forEach(i => i.value = '');
        apartmentFields.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
      }
    });
    // On load, ensure correct state
    if (categorySelect.value === 'Appartment') {
      apartmentFields.style.display = 'flex';
    } else {
      apartmentFields.style.display = 'none';
    }
  }
}


document.addEventListener('DOMContentLoaded', () => {
  syncCurrentUser();
  // Keep user in sync on storage change (multi-tab)
  window.addEventListener('storage', function(e) {
    if (e.key === 'kridha_current_user') {
      syncCurrentUser();
      loadAds();
    }
  });
  initKridhaApp();
});


// ...existing code...

function renderAds(ads) {
  // Get user's favorite ad IDs if logged in
  syncCurrentUser();
  let favoriteIds = [];
  if (currentUser && Array.isArray(currentUser.favorites)) {
    favoriteIds = currentUser.favorites.map(String);
  } else if (currentUser && currentUser.favorites) {
    // If favorites is an object (e.g., from MongoDB), convert to array
    favoriteIds = Object.values(currentUser.favorites).map(String);
  }

  // If on favorites page, filter ads to only favorites
  const isFavoritesPage = window.location.pathname.endsWith('favorites.html');
  let adsToRender = ads;
  if (isFavoritesPage) {
    adsToRender = ads.filter(ad => favoriteIds.includes(String(ad._id)));
  }

  const grid = document.getElementById('propertyGrid');
  console.log('Rendering ads:', adsToRender);
  const renderHtml = (adsArr) => adsArr.map(ad => {
    const isFav = favoriteIds.includes(String(ad._id));
    const isOwner = currentUser && ((ad.seller && ad.seller._id === currentUser._id) || ad.sellerId === currentUser._id || currentUser.role === 'admin');
    // Button styles
    const btnSize = '38px';
    const btnGap = '10px';
    // Fix: Always use absolute URL for images if not already absolute
    let imgUrl = (ad.images && ad.images[0]) || 'images/image1.avif';
    if (imgUrl && !/^https?:\/\//i.test(imgUrl) && !imgUrl.startsWith('data:')) {
      // If running on Vercel or any domain, use API_BASE as origin for uploads
      if (imgUrl.startsWith('/')) {
        imgUrl = API_BASE.replace(/\/api$/, '') + imgUrl;
      } else {
        imgUrl = API_BASE.replace(/\/api$/, '') + '/' + imgUrl;
      }
    }
    return `
      <div class="property-card" data-ad-id="${ad._id}" style="position:relative;">
        <img src="${imgUrl}" alt="Property Image">
        <div class="property-action-fab-group" style="position:absolute;top:16px;right:16px;display:flex;flex-direction:column;align-items:end;z-index:2;pointer-events:none;">
          <div class="property-action-fab" style="display:flex;flex-direction:column;align-items:end;gap:${btnGap};pointer-events:auto;background:transparent;">
            <button class="fav-btn${isFav ? ' active' : ''}" data-id="${ad._id}" aria-pressed="${isFav}" title="Favorite" style="width:${btnSize};height:${btnSize};background:#fff;border:none;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 1px 4px #bcb3f7;transition:background 0.2s;margin:0 0 0 0;">${isFav ? '❤️' : '🤍'}</button>
            ${isOwner ? `
              <button class="edit-ad-btn" data-id="${ad._id}" title="Edit" style="background:#ede7f6;color:#3c0087;width:${btnSize};height:${btnSize};border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 1px 4px #bcb3f7;transition:background 0.2s;margin:0 0 0 0;">
                ✏️
              </button>
              <button class="delete-ad-btn" data-id="${ad._id}" title="Delete" style="background:#ede7f6;color:#3c0087;width:${btnSize};height:${btnSize};border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 1px 4px #bcb3f7;transition:background 0.2s;margin:0 0 0 0;">
                🗑️
              </button>
            ` : ''}
          </div>
        </div>
        <div class="property-info">
          <div class="property-title">${ad.title}</div>
          <div class="property-price">₹ ${ad.price && !isNaN(ad.price) ? Number(ad.price).toLocaleString() : ''}</div>
        </div>
      </div>
    `;
  }).join('');

  if (!grid) {
    // Try fallback for favorites page: look for a container for favorites
    const favGrid = document.getElementById('favoritesGrid') || document.querySelector('.favorites-list') || document.querySelector('.favorites-container');
    if (favGrid) {
      if (!adsToRender.length) {
        favGrid.innerHTML = '<p>No favorite properties found.</p>';
      } else {
        favGrid.innerHTML = renderHtml(adsToRender);
        favGrid.querySelectorAll('.fav-btn').forEach(btn => {
          btn.onclick = () => toggleFavorite(btn.dataset.id, btn);
        });
      }
    } else {
      // No grid found, show error in console only
      console.error('No propertyGrid or favoritesGrid found in DOM.');
    }
    return;
  }
  if (!adsToRender.length) {
    grid.innerHTML = isFavoritesPage ? '<p>No favorite properties found.</p>' : '<p>No properties found.</p>';
    return;
  }
  grid.innerHTML = renderHtml(adsToRender);
  grid.querySelectorAll('.fav-btn').forEach(btn => {
    btn.onclick = () => toggleFavorite(btn.dataset.id, btn);
  });
  // Add edit/delete button handlers
  grid.querySelectorAll('.edit-ad-btn').forEach(btn => {
    btn.onclick = () => openEditAdModal(btn.dataset.id);
  });
  grid.querySelectorAll('.delete-ad-btn').forEach(btn => {
    btn.onclick = () => deleteAd(btn.dataset.id);
  });
}

// Open edit modal for ad
function openEditAdModal(adId) {
  const ad = window.allAds ? window.allAds.find(a => String(a._id) === String(adId)) : null;
  if (!ad) return showErrorModal('Ad not found.');
  // Create a modal for editing
  let modal = document.getElementById('editAdModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'editAdModal';
    modal.innerHTML = `
      <div style="background:#fff;max-width:400px;margin:10vh auto;padding:24px 24px 16px 24px;border-radius:12px;box-shadow:0 2px 16px #0002;position:relative;text-align:left;">
        <span id="closeEditAdModal" style="position:absolute;top:8px;right:16px;cursor:pointer;font-size:22px;">&times;</span>
        <h3 style="margin-top:0;color:#3c0087;">Edit Ad</h3>
        <form id="editAdForm">
          <label>Title:<br><input type="text" id="editAdTitle" value="${ad.title}" style="width:100%;margin-bottom:10px;"></label><br>
          <label>Price:<br><input type="number" id="editAdPrice" value="${ad.price}" style="width:100%;margin-bottom:10px;"></label><br>
          <button type="submit" style="background:#512da8;color:#fff;padding:8px 24px;border:none;border-radius:6px;cursor:pointer;">Save</button>
        </form>
      </div>
    `;
    Object.assign(modal.style, {
      position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: '#0007', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
    });
    document.body.appendChild(modal);
    modal.querySelector('#closeEditAdModal').onclick = closeEditAdModal;
    modal.onclick = function(e) { if (e.target === modal) closeEditAdModal(); };
  } else {
    modal.style.display = 'flex';
    document.getElementById('editAdTitle').value = ad.title;
    document.getElementById('editAdPrice').value = ad.price;
  }
  modal.style.display = 'flex';
  document.getElementById('editAdForm').onsubmit = function(e) {
    e.preventDefault();
    const newTitle = document.getElementById('editAdTitle').value;
    const newPrice = document.getElementById('editAdPrice').value;
    updateAd(adId, { title: newTitle, price: newPrice });
    closeEditAdModal();
  };
}

function closeEditAdModal() {
  const modal = document.getElementById('editAdModal');
  if (modal) modal.style.display = 'none';
}

// Update ad (PUT request)
async function updateAd(adId, data) {
  syncCurrentUser();
  if (!currentUser) return showErrorModal('Please login.');
  try {
    const res = await fetch(`${API_BASE}/ads/${adId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': currentUser.token || '' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      showErrorModal('Ad updated.');
      loadAds();
    } else {
      showErrorModal('Failed to update ad.');
    }
  } catch (e) {
    showErrorModal('Error updating ad.');
  }
}

// Delete ad (DELETE request)
async function deleteAd(adId) {
  syncCurrentUser();
  if (!currentUser) return showErrorModal('Please login.');
  // Custom confirm modal
  showConfirmModal('Are you sure you want to delete this ad?', async function(confirmed) {
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_BASE}/ads/${adId}`, {
        method: 'DELETE',
        headers: { 'Authorization': currentUser.token || '' }
      });
      if (res.ok) {
        showErrorModal('Ad deleted.');
        // Wait for user to close the modal before reloading ads
        setTimeout(() => {
          const modal = document.getElementById('errorModal');
          if (modal) {
            const okBtn = modal.querySelector('#errorModalOk');
            const closeBtn = modal.querySelector('#closeErrorModal');
            const reloadOnClose = function() {
              loadAds();
              if (okBtn) okBtn.removeEventListener('click', reloadOnClose);
              if (closeBtn) closeBtn.removeEventListener('click', reloadOnClose);
            };
            if (okBtn) okBtn.addEventListener('click', reloadOnClose);
            if (closeBtn) closeBtn.addEventListener('click', reloadOnClose);
          } else {
            loadAds();
          }
        }, 0);
      } else {
        showErrorModal('Failed to delete ad.');
      }
    } catch (e) {
      showErrorModal('Error deleting ad.');
    }
  });
}

// Custom confirm modal
function showConfirmModal(message, callback) {
  let modal = document.getElementById('confirmModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'confirmModal';
    modal.innerHTML = `
      <div style="background:#fff;max-width:400px;margin:10vh auto;padding:24px 24px 16px 24px;border-radius:12px;box-shadow:0 2px 16px #0002;position:relative;text-align:left;">
        <span id="closeConfirmModal" style="position:absolute;top:8px;right:16px;cursor:pointer;font-size:22px;">&times;</span>
        <div id="confirmModalMsg" style="margin-bottom:18px;color:#23236a;font-size:16px;"></div>
        <button id="confirmModalOk" style="background:#512da8;color:#fff;padding:8px 24px;border:none;border-radius:6px;cursor:pointer;margin-right:12px;">OK</button>
        <button id="confirmModalCancel" style="background:#ede7f6;color:#3c0087;padding:8px 24px;border:none;border-radius:6px;cursor:pointer;">Cancel</button>
      </div>
    `;
    Object.assign(modal.style, {
      position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: '#0007', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
    });
    document.body.appendChild(modal);
  }
  document.getElementById('confirmModalMsg').innerHTML = message;
  modal.style.display = 'flex';
  document.getElementById('confirmModalOk').onclick = function() {
    modal.style.display = 'none';
    callback(true);
  };
  document.getElementById('confirmModalCancel').onclick = function() {
    modal.style.display = 'none';
    callback(false);
  };
  document.getElementById('closeConfirmModal').onclick = function() {
    modal.style.display = 'none';
    callback(false);
  };
  modal.onclick = function(e) { if (e.target === modal) { modal.style.display = 'none'; callback(false); } };
}


async function toggleFavorite(adId, btn) {
  if (!currentUser) return alert('Please login to use favorites.');
  // Optimistically update UI
  let isFav = false;
  if (Array.isArray(currentUser.favorites)) {
    isFav = currentUser.favorites.map(String).includes(String(adId));
  } else if (currentUser.favorites) {
    isFav = Object.values(currentUser.favorites).map(String).includes(String(adId));
  }
  // Toggle favorite in UI
  if (btn) {
    btn.classList.toggle('active');
    btn.innerHTML = btn.classList.contains('active') ? '❤️' : '🤍';
    btn.setAttribute('aria-pressed', btn.classList.contains('active'));
  }
  // Update backend
  try {
    const res = await fetch(`${API_BASE}/favorite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': currentUser.token || ''
      },
      body: JSON.stringify({ userId: currentUser._id, adId })
    });
    if (res.ok) {
      // Update local currentUser.favorites
      if (!isFav) {
        if (Array.isArray(currentUser.favorites)) {
          currentUser.favorites.push(adId);
        } else if (currentUser.favorites) {
          currentUser.favorites = Object.values(currentUser.favorites);
          currentUser.favorites.push(adId);
        } else {
          currentUser.favorites = [adId];
        }
      } else {
        if (Array.isArray(currentUser.favorites)) {
          currentUser.favorites = currentUser.favorites.filter(f => String(f) !== String(adId));
        } else if (currentUser.favorites) {
          currentUser.favorites = Object.values(currentUser.favorites).filter(f => String(f) !== String(adId));
        }
      }
      // Save to localStorage
      localStorage.setItem('kridha_current_user', JSON.stringify(currentUser));
      // If on favorites page, reload to update UI
      if (window.location.pathname.endsWith('favorites.html')) {
        location.reload();
      }
    } else {
      // Revert UI if failed
      if (btn) {
        btn.classList.toggle('active');
        btn.innerHTML = btn.classList.contains('active') ? '❤️' : '🤍';
        btn.setAttribute('aria-pressed', btn.classList.contains('active'));
      }
      alert('Failed to update favorite.');
    }
  } catch (e) {
    // Revert UI if failed
    if (btn) {
      btn.classList.toggle('active');
      btn.innerHTML = btn.classList.contains('active') ? '❤️' : '🤍';
      btn.setAttribute('aria-pressed', btn.classList.contains('active'));
    }
    alert('Failed to update favorite.');
  }
}

async function showFavorites() {
  if (!currentUser) return alert('Please login to view favorites.');
  // Fetch all ads, then filter by user's favorites
  const res = await fetch(`${API_BASE}/ads`);
  const ads = await res.json();
  let favoriteIds = [];
  if (Array.isArray(currentUser.favorites)) {
    favoriteIds = currentUser.favorites.map(String);
  } else if (currentUser.favorites) {
    favoriteIds = Object.values(currentUser.favorites).map(String);
  }
  // Only show ads that are in favorites
  const favAds = ads.filter(ad => favoriteIds.includes(String(ad._id)));
  // Only render if there are favorites
  renderAds(favAds);
}


function openSellModal() {
  document.getElementById('sellModal').style.display = 'block';
}
function closeSellModal() {
  document.getElementById('sellModal').style.display = 'none';
}

// Favorites button navigation
document.addEventListener('DOMContentLoaded', function() {
  const favoritesBtn = document.getElementById('favoritesBtn');
  if (favoritesBtn) {
    favoritesBtn.onclick = function() {
      window.location.href = 'favorites.html';
    };
  }
});



async function postAd(e) {
  e.preventDefault();
  syncCurrentUser();
  if (!currentUser) {
    showErrorModal('You must be logged in to post ads.');
    return;
  }
  if (!currentUser._id) {
    showErrorModal('User session error: Your account info is incomplete. Please log out and log in again.');
    console.error('Current user object missing _id:', currentUser);
    return;
  }
  const form = e.target;
  const title = form.title.value.trim();
  const description = form.description.value.trim();
  const priceRaw = form.price.value.trim();
  const price = Number(priceRaw);
  const location = form.location.value.trim();
  const placeId = form.location.dataset.placeId || '';
  const imgInput = form.images;
  let missing = [];
  let imageFiles = [];
  if (!title) missing.push('<b>Title</b> (required)');
  if (!description) missing.push('<b>Description</b> (required)');
  if (!priceRaw || isNaN(price) || price <= 0) missing.push('<b>Price</b> (required, must be a positive number)');
  if (!location) missing.push('<b>Location</b> (required)');
  if (!imgInput || !imgInput.files || imgInput.files.length === 0) missing.push('<b>Images</b> (at least one image file)');
  else imageFiles = Array.from(imgInput.files);
  if (missing.length) {
    showErrorModal('Please correct the following fields:<br><ul style="margin:8px 0 0 16px;">' + missing.map(f => `<li>${f}</li>`).join('') + '</ul>');
    return;
  }
  // Upload images to backend and get URLs
  let imageUrls = [];
  try {
    const formData = new FormData();
    imageFiles.forEach(f => formData.append('images', f));
    const uploadRes = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    });
    if (!uploadRes.ok) {
      let errText = await uploadRes.text();
      showErrorModal('Image upload failed: ' + errText);
      return;
    }
    const uploadJson = await uploadRes.json();
    imageUrls = uploadJson.urls || [];
    if (!imageUrls.length) {
      showErrorModal('Image upload failed: No URLs returned.');
      return;
    }
  } catch (err) {
    showErrorModal('Image upload failed: ' + (err.message || err));
    return;
  }
  const data = {
    title,
    description,
    price,
    location,
    placeId,
    images: imageUrls,
    sellerId: currentUser._id
  };
  let errorMsg = '';
  try {
    const res = await fetch(`${API_BASE}/ads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      closeSellModal();
      loadAds();
      form.reset();
    } else {
      // Try to get error text, status, and response
      let errText = await res.text();
      let errJson = {};
      try { errJson = JSON.parse(errText); } catch {}
      errorMsg = errJson && errJson.error ? errJson.error : `Failed to post ad (status ${res.status}): ${errText}`;
      showErrorModal(
        `<div style='color:#b00;font-weight:bold;margin-bottom:8px;'>${errorMsg}</div>` +
        `<div style='font-size:13px;margin-bottom:4px;'><b>Data sent to backend:</b></div>` +
        `<pre style='background:#f5f5f5;padding:8px;border-radius:6px;max-height:180px;overflow:auto;font-size:12px;'>` +
        `${JSON.stringify(data, null, 2)}</pre>`
      );
    }
  } catch (e) {
    showErrorModal('Failed to post ad: ' + (e.message || e));
  }
}
