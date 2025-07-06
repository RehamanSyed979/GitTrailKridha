
// Use window.API_BASE_URL set in HTML for all API calls

$(function() {
  // Modal open/close
  function showModal(id) { $(id).css('display','flex'); }
  function hideModal(id) { $(id).hide(); }

  // Open modals
  $(document).on('click', '#open-signin-modal', function() { showModal('#signin-modal'); });
  $(document).on('click', '#open-signup-modal', function() { showModal('#signup-modal'); });
  $('#close-signin-modal').on('click', function() { hideModal('#signin-modal'); });
  $('#close-signup-modal').on('click', function() { hideModal('#signup-modal'); });
  // Admin modal removed; now handled by admin.html page link

  // Auth state
  function setAuthUI(user) {
    if (user) {
      // Move greeting to header if not already there
      var $greet = $('#user-greeting');
      var $header = $('header .container');
      if ($greet.length && $header.length && !$header.children('#user-greeting').length) {
        $greet.prependTo($header);
      }
      $('#user-greeting').text('Hello, ' + user.name).show();
      $('#open-signin-modal, #open-signup-modal').hide();
      $('#profile-icon-btn').show();
      $('.profile-dropdown-wrapper').show();
      if (user.role === 'admin') $('#open-admin-modal').show();
      else $('#open-admin-modal').hide();
    } else {
      $('#user-greeting').hide();
      $('#open-signin-modal, #open-signup-modal').show();
      $('#profile-icon-btn').hide();
      $('.profile-dropdown-wrapper').hide();
      $('#open-admin-modal').hide();
    }
    // Hide logout button in nav, show only in dropdown
    $('#logout-btn').hide();
    // Move user-greeting to header if present
    var $greet = $('#user-greeting');
    var $header = $('header .container');
    if ($greet.length && $header.length) {
      if (!$header.children('#user-greeting').length) {
        $greet.prependTo($header);
      }
    }
  }

  function getCurrentUser() {
    const u = localStorage.getItem('kridha_current_user');
    return u ? JSON.parse(u) : null;
  }
  function setCurrentUser(user) {
    if (user && user._id) {
      localStorage.setItem('kridha_current_user', JSON.stringify(user));
      window.currentUser = user;
    } else {
      localStorage.removeItem('kridha_current_user');
      window.currentUser = null;
    }
    setAuthUI(user);
  }

  // Sign In Tabs
  $('#signin-tab-email').on('click', function() {
    $('#signin-tab-email').addClass('primary-button').removeClass('secondary-button');
    $('#signin-tab-otp').addClass('secondary-button').removeClass('primary-button');
    $('#signin-form-email').show();
    $('#signin-form-otp').hide();
    $('#signin-error').hide();
  });
  $('#signin-tab-otp').on('click', function() {
    $('#signin-tab-otp').addClass('primary-button').removeClass('secondary-button');
    $('#signin-tab-email').addClass('secondary-button').removeClass('primary-button');
    $('#signin-form-email').hide();
    $('#signin-form-otp').show();
    $('#signin-error').hide();
  });
  // Default to email tab
  $('#signin-tab-email').click();

  // Email/Password Sign In (delegated handler for dynamic DOM)
  $(document).off('submit', '#signin-form-email').on('submit', '#signin-form-email', function(e) {
    e.preventDefault();
    const email = $('#signin-email').val();
    const password = $('#signin-password').val();
    const $btn = $('#signin-form-email button[type="submit"]');
    $btn.prop('disabled', true).text('Signing In...');
    // Use fetch directly to ensure we get the full user object with _id
    fetch(window.API_BASE_URL ? window.API_BASE_URL + '/api/login' : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000/api/login' : `${window.location.protocol}//${window.location.hostname}:3000/api/login`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    .then(async res => {
      $btn.prop('disabled', false).text('Sign In');
      let data = {};
      try { data = await res.json(); } catch (e) { data = { error: 'Unexpected server response' }; }
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        hideModal('#signin-modal');
        $('#signin-error').hide();
        window.location.href = 'home.html';
      } else {
        $('#signin-error').text(data.error || 'Invalid email or password').show();
      }
    })
    .catch(() => {
      $btn.prop('disabled', false).text('Sign In');
      $('#signin-error').text('Sign in failed. Please try again.').show();
    });
  });

  // Mobile OTP Sign In
  let signinConfirmationResult = null;
  let signinVerifiedMobile = null;
  // Setup reCAPTCHA for sign-in OTP
  window.signinRecaptchaVerifier = new firebase.auth.RecaptchaVerifier('signin-recaptcha-container', {
    'size': 'normal',
    'callback': function(response) {
      // reCAPTCHA solved
    }
  });
  $('#signin-send-otp-btn').on('click', function() {
    const mobile = $('#signin-mobile').val();
    if (!/^\d{10}$/.test(mobile)) {
      $('#signin-error').text('Enter a valid 10-digit mobile number').show();
      return;
    }
    $('#signin-error').hide();
    const phoneNumber = '+91' + mobile; // Change country code if needed
    firebase.auth().signInWithPhoneNumber(phoneNumber, window.signinRecaptchaVerifier)
      .then(function(result) {
        signinConfirmationResult = result;
        $('#signin-otp-section').show();
        $('#signin-send-otp-btn').prop('disabled', true);
      })
      .catch(function(error) {
        $('#signin-error').text(error.message || 'Failed to send OTP').show();
      });
  });
  $('#signin-verify-otp-btn').on('click', function() {
    const $btn = $(this);
    const otp = $('#signin-otp').val();
    if (!otp) {
      $('#signin-error').text('Enter OTP').show();
      return;
    }
    if (!signinConfirmationResult) {
      $('#signin-error').text('Please request OTP first').show();
      return;
    }
    $btn.prop('disabled', true).text('Verifying...');
    signinConfirmationResult.confirm(otp)
      .then(function(result) {
        $('#signin-error').hide();
        signinVerifiedMobile = $('#signin-mobile').val();
        // Now call backend to get user by mobile
        fetch(window.API_BASE_URL ? window.API_BASE_URL + '/api/login-mobile' : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000/api/login-mobile' : `${window.location.protocol}//${window.location.hostname}:3000/api/login-mobile`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile: signinVerifiedMobile })
        })
        .then(async res => {
          let data = {};
          try {
            data = await res.json();
          } catch (e) {
            data = { error: 'Unexpected server response' };
          }
          if (res.ok && data.user) {
            setCurrentUser(data.user);
            hideModal('#signin-modal');
            // Reset OTP form and section
            $('#signin-form-otp')[0].reset();
            $('#signin-otp-section').hide();
            $('#signin-send-otp-btn').prop('disabled', false);
            $btn.prop('disabled', false).text('Verify OTP & Sign In');
            window.location.href = 'home.html';
          } else {
            $('#signin-error').text(data.error || 'Mobile not registered').show();
            $btn.prop('disabled', false).text('Verify OTP & Sign In');
          }
        })
        .catch(() => {
          $('#signin-error').text('Server error. Please try again.').show();
          $btn.prop('disabled', false).text('Verify OTP & Sign In');
        });
      })
      .catch(function(error) {
        $btn.prop('disabled', false).text('Verify OTP & Sign In');
        $('#signin-error').text(error.message || 'Invalid OTP').show();
        // If code expired or used, allow user to resend OTP
        if (error.code === 'auth/code-expired' || error.code === 'auth/invalid-verification-code') {
          $('#signin-otp-section').hide();
          $('#signin-send-otp-btn').prop('disabled', false);
        }
      });
  });
  // Cancel button for OTP form
  $('#close-signin-modal-otp').on('click', function() {
    hideModal('#signin-modal');
    // Reset OTP form
    $('#signin-form-otp')[0].reset();
    $('#signin-otp-section').hide();
    $('#signin-send-otp-btn').prop('disabled', false);
    $('#signin-error').hide();
  });

  // --- Firebase Phone Auth Integration ---
  // Add Firebase SDK via <script> in your HTML or use import if using modules
  // Example assumes Firebase SDK is loaded globally as firebase
  let verifiedMobile = null;
  let confirmationResult = null;

  // Setup reCAPTCHA
  window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
    'size': 'normal',
    'callback': function(response) {
      // reCAPTCHA solved
    }
  });

  // Use delegated event handler for send-otp-btn to ensure it always works
  $(document).off('click', '#send-otp-btn').on('click', '#send-otp-btn', function() {
    const mobile = $('#signup-mobile').val();
    if (!/^\d{10}$/.test(mobile)) {
      $('#signup-error').text('Enter a valid 10-digit mobile number').show();
      return;
    }
    $('#signup-error').hide();
    const phoneNumber = '+91' + mobile; // Change country code if needed
    firebase.auth().signInWithPhoneNumber(phoneNumber, window.recaptchaVerifier)
      .then(function(result) {
        confirmationResult = result;
        $('#otp-section').show();
        $('#send-otp-btn').prop('disabled', true);
      })
      .catch(function(error) {
        $('#signup-error').text(error.message || 'Failed to send OTP').show();
      });
  });

  // Use delegated event handler for verify-otp-btn to ensure it always works
  $(document).off('click', '#verify-otp-btn').on('click', '#verify-otp-btn', function() {
    const $btn = $(this);
    const otp = $('#signup-otp').val();
    if (!otp) {
      $('#signup-error').text('Enter OTP').show();
      return;
    }
    if (!confirmationResult) {
      $('#signup-error').text('Please request OTP first').show();
      return;
    }
    $btn.prop('disabled', true).text('Verifying...');
    confirmationResult.confirm(otp)
      .then(function(result) {
        $('#signup-error').hide();
        $('#signup-mobile-form').hide();
        $('#signup-form').show();
        verifiedMobile = $('#signup-mobile').val();
        $btn.prop('disabled', false).text('Verify OTP');
      })
      .catch(function(error) {
        $btn.prop('disabled', false).text('Verify OTP');
        $('#signup-error').text(error.message || 'Invalid OTP').show();
        // If code expired or used, allow user to resend OTP
        if (error.code === 'auth/code-expired' || error.code === 'auth/invalid-verification-code') {
          $('#otp-section').hide();
          $('#send-otp-btn').prop('disabled', false);
        }
      });
  });

  // Sign Up (after OTP verified)
  $('#signup-form').off('submit').on('submit', async function(e) {
    e.preventDefault();
    const name = $('#signup-name').val();
    const email = $('#signup-email').val();
    const password = $('#signup-password').val();
    if (!verifiedMobile) {
      // Reset to mobile/OTP step and show error
      $('#signup-form').hide();
      $('#signup-mobile-form').show();
      $('#signup-error').text('Please verify your mobile number first').show();
      return;
    }
    fetch(window.API_BASE_URL ? window.API_BASE_URL + '/api/register' : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000/api/register' : `${window.location.protocol}//${window.location.hostname}:3000/api/register`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: verifiedMobile, email, password, name })
    }).then(async res => {
      if (res.ok) {
        $('#signup-error').hide();
        hideModal('#signup-modal');
        setTimeout(showSignupSuccessModal, 100);
      } else {
        const data = await res.json();
        $('#signup-error').text(data.error || 'Registration failed').show();
      }
    });
  });

  // Show signup success modal instead of alert
  function showSignupSuccessModal() {
    const modal = document.getElementById('signup-success-modal');
    if (!modal) {
      // Try to find it with jQuery in case it's not in the DOM yet
      const $modal = $('#signup-success-modal');
      if ($modal.length) {
        $modal.addClass('active').css('display', 'flex');
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
          const okBtn = document.getElementById('signup-success-ok');
          if (okBtn) okBtn.focus();
        }, 100);
      }
      return;
    }
    modal.classList.add('active');
    modal.style.display = 'flex';
    // Focus OK button for accessibility
    setTimeout(() => {
      const okBtn = document.getElementById('signup-success-ok');
      if (okBtn) okBtn.focus();
    }, 100);
    // Prevent background scroll
    document.body.style.overflow = 'hidden';
  }

  // Hide signup success modal
  function hideSignupSuccessModal() {
    const modal = document.getElementById('signup-success-modal');
    if (!modal) {
      const $modal = $('#signup-success-modal');
      if ($modal.length) {
        $modal.removeClass('active').css('display', 'none');
        document.body.style.overflow = '';
      }
      // Always show sign-in modal after hiding
      showModal('#signin-modal');
      return;
    }
    modal.classList.remove('active');
    modal.style.display = 'none';
    // Restore background scroll
    document.body.style.overflow = '';
    // Always show sign-in modal after hiding
    showModal('#signin-modal');
  }

  // Attach event for OK button (use jQuery and delegate in case modal is dynamically rendered)
  $(document).on('click', '#signup-success-ok', function() {
    hideSignupSuccessModal();
  });

  // Profile dropdown logic
  const $profileBtn = $('#profile-icon-btn');
  const $profileDropdown = $('#profile-dropdown');
  // Show/hide Admin Panel in dropdown
  const user = getCurrentUser();
  if (user && user.role === 'admin') {
    $('#open-admin-modal').show();
  } else {
    $('#open-admin-modal').hide();
  }

  // Show/hide dropdown on hover/focus/blur
  let dropdownTimeout = null;
  function showProfileDropdown() {
    clearTimeout(dropdownTimeout);
    $profileDropdown.stop(true, true).fadeIn(120);
  }
  function hideProfileDropdown() {
    dropdownTimeout = setTimeout(() => {
      $profileDropdown.fadeOut(120);
    }, 180);
  }
  $profileBtn.on('mouseenter focus', showProfileDropdown);
  $profileBtn.on('mouseleave blur', hideProfileDropdown);
  $profileDropdown.on('mouseenter', showProfileDropdown);
  $profileDropdown.on('mouseleave', hideProfileDropdown);

  // Hide dropdown on click outside
  $(document).on('mousedown', function(e) {
    if (!$profileBtn.is(e.target) && $profileBtn.has(e.target).length === 0 && !$profileDropdown.is(e.target) && $profileDropdown.has(e.target).length === 0) {
      $profileDropdown.fadeOut(120);
    }
  });

  // Logout from dropdown
  $(document).on('click', '#profile-logout-btn', function() {
    setCurrentUser(null);
    $profileDropdown.fadeOut(120);
  });

  // View Profile and Settings
  $(document).on('click', '#view-profile-btn', function() {
    window.location.href = 'profile.html';
    $profileDropdown.fadeOut(120);
  });
  $(document).on('click', '#profile-settings-btn', function() {
    // Placeholder for future settings page
    alert('Settings coming soon!');
    $profileDropdown.fadeOut(120);
  });

  // Admin Panel
  function renderAdminUsers() {
    const users = window.kridhaAuth.getAllUsers();
    let html = '<table class="w-table" style="width:100%;margin-bottom:1rem"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead><tbody>';
    users.forEach(u => {
      html += `<tr><td>${u.name||''}</td><td>${u.email}</td><td><select class="input" data-email="${u.email}"><option value="user"${u.role==='user'?' selected':''}>User</option><option value="admin"${u.role==='admin'?' selected':''}>Admin</option></select></td><td>${u.email!=='admin@kridha.com'?`<button class="button secondary-button" data-del="${u.email}">Delete</button>`:''}</td></tr>`;
    });
    html += '</tbody></table>';
    $('#admin-users-list').html(html);
    // Role change
    $('#admin-users-list select').on('change', function() {
      const email = $(this).data('email');
      const role = $(this).val();
      window.kridhaAuth.setUserRole(email, role);
      if (getCurrentUser().email === email) setCurrentUser(window.kridhaAuth.loginUser(email, getCurrentUser().password));
      renderAdminUsers();
    });
    // Delete user
    $('#admin-users-list button[data-del]').on('click', function() {
      const email = $(this).data('del');
      if (confirm('Delete user ' + email + '?')) {
        window.kridhaAuth.deleteUser(email);
        renderAdminUsers();
      }
    });
  }

  // Modal close on background click
  $('.modal').on('click', function(e) { if (e.target === this) $(this).hide(); });

  // On load
  setAuthUI(getCurrentUser());
});
