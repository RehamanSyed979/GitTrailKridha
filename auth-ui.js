$(function() {
  // Modal open/close
  function showModal(id) { $(id).css('display','flex'); }
  function hideModal(id) { $(id).hide(); }

  // Open modals
  $('#open-signin-modal').on('click', function() { showModal('#signin-modal'); });
  $('#open-signup-modal').on('click', function() { showModal('#signup-modal'); });
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
      if (user.role === 'admin') $('#open-admin-modal').show();
      else $('#open-admin-modal').hide();
    } else {
      $('#user-greeting').hide();
      $('#open-signin-modal, #open-signup-modal').show();
      $('#profile-icon-btn').show();
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
    if (user) localStorage.setItem('kridha_current_user', JSON.stringify(user));
    else localStorage.removeItem('kridha_current_user');
    setAuthUI(user);
  }

  // Sign In
  $('#signin-form').on('submit', function(e) {
    e.preventDefault();
    const email = $('#signin-email').val();
    const password = $('#signin-password').val();
    const user = window.kridhaAuth.loginUser(email, password);
    if (user) {
      setCurrentUser(user);
      hideModal('#signin-modal');
      $('#signin-error').hide();
    } else {
      $('#signin-error').text('Invalid email or password').show();
    }
  });

  // Sign Up
  $('#signup-form').on('submit', function(e) {
    e.preventDefault();
    const name = $('#signup-name').val();
    const email = $('#signup-email').val();
    const password = $('#signup-password').val();
    if (!window.kridhaAuth.registerUser(email, password, name)) {
      $('#signup-error').text('Email already registered').show();
    } else {
      $('#signup-error').hide();
      hideModal('#signup-modal');
      // Delay showing the success modal to ensure modal stack is correct
      setTimeout(showSignupSuccessModal, 100);
    }
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
