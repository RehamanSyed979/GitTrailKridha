// Profile page logic for advanced profile management
// Handles: edit username, change email, change password, upload/change/remove profile picture, delete account

document.addEventListener('DOMContentLoaded', function () {
  // Show Admin Panel button for admins
  try {
    const userStr = localStorage.getItem('kridha_current_user');
    const userObj = userStr ? JSON.parse(userStr) : null;
    if (userObj && userObj.role === 'admin') {
      const adminPanelRow = document.getElementById('admin-panel-row');
      const adminPanelBtn = document.getElementById('adminPanelBtn');
      if (adminPanelRow) adminPanelRow.style.display = '';
      if (adminPanelBtn) {
        adminPanelBtn.onclick = function() {
          window.location.href = 'admin.html';
        };
      }
    }
  } catch (e) { /* ignore */ }
  // Elements
  const avatarImg = document.getElementById('profile-avatar');
  const avatarUpload = document.getElementById('avatar-upload');
  const uploadAvatarBtn = document.getElementById('upload-avatar-btn');
  const removeAvatarBtn = document.getElementById('remove-avatar-btn');
  const usernameInput = document.getElementById('profile-username');
  const emailInput = document.getElementById('profile-email');
  const currentPasswordInput = document.getElementById('current-password');
  const newPasswordInput = document.getElementById('new-password');
  const profileForm = document.getElementById('profile-form');
  const cancelBtn = document.getElementById('cancel-profile-changes');
  const deleteAccountBtn = document.getElementById('delete-account-btn');
  const successMsg = document.getElementById('profile-success');
  const errorMsg = document.getElementById('profile-error');

  // Mock user data (replace with real API/auth integration)
  let user = {
    username: 'johndoe',
    email: 'john@example.com',
    avatar: 'images/image1.avif',
    isDefaultAvatar: true
  };

  // Load user data into form
  function loadProfile() {
    usernameInput.value = user.username;
    emailInput.value = user.email;
    avatarImg.src = user.avatar;
    removeAvatarBtn.style.display = user.isDefaultAvatar ? 'none' : 'inline-block';
  }

  // Show messages
  function showSuccess(msg) {
    successMsg.textContent = msg;
    successMsg.style.display = 'block';
    errorMsg.style.display = 'none';
  }
  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
    successMsg.style.display = 'none';
  }
  function clearMessages() {
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';
  }

  // Avatar upload/change
  uploadAvatarBtn.addEventListener('click', function () {
    avatarUpload.click();
  });
  avatarUpload.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function (evt) {
        avatarImg.src = evt.target.result;
        user.avatar = evt.target.result;
        user.isDefaultAvatar = false;
        removeAvatarBtn.style.display = 'inline-block';
        showSuccess('Profile picture updated (not saved yet).');
      };
      reader.readAsDataURL(file);
    } else {
      showError('Please select a valid image file.');
    }
  });
  removeAvatarBtn.addEventListener('click', function () {
    user.avatar = 'images/image1.avif';
    user.isDefaultAvatar = true;
    avatarImg.src = user.avatar;
    removeAvatarBtn.style.display = 'none';
    showSuccess('Profile picture removed (not saved yet).');
  });

  // Save profile changes
  profileForm.addEventListener('submit', function (e) {
    e.preventDefault();
    clearMessages();
    // Validate
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    if (!username || !email) {
      showError('Username and email are required.');
      return;
    }
    // Password change logic
    const currentPwd = currentPasswordInput.value;
    const newPwd = newPasswordInput.value;
    if (currentPwd || newPwd) {
      if (!currentPwd || !newPwd) {
        showError('To change password, fill both current and new password.');
        return;
      }
      // Simulate password check (replace with real API call)
      if (currentPwd !== 'password123') {
        showError('Current password is incorrect.');
        return;
      }
      // Simulate password update
      showSuccess('Password changed successfully.');
    }
    // Simulate profile update
    user.username = username;
    user.email = email;
    showSuccess('Profile updated successfully.');
    // Clear password fields
    currentPasswordInput.value = '';
    newPasswordInput.value = '';
  });

  // Cancel changes
  cancelBtn.addEventListener('click', function () {
    loadProfile();
    clearMessages();
    currentPasswordInput.value = '';
    newPasswordInput.value = '';
  });

  // Delete account
  deleteAccountBtn.addEventListener('click', function () {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Simulate account deletion
      showSuccess('Account deleted. (Simulated)');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    }
  });

  // Initial load
  loadProfile();
});
