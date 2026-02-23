function showNotification(message, type = 'info') {
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    else if (type === 'error') icon = '❌';
    else if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
  `;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }, 3000);
}

// Override default window.alert for an immediate global upgrade
window.alert = function (message) {
    let type = 'info';
    const msgStr = String(message).toLowerCase();

    if (msgStr.includes('✅') || msgStr.includes('success')) {
        type = 'success';
    } else if (msgStr.includes('❌') || msgStr.includes('error') || msgStr.includes('failed')) {
        type = 'error';
    } else if (msgStr.includes('⚠️')) {
        type = 'warning';
    }

    // Clean up emojis from the message since the toast shows its own icon
    const cleanMessage = String(message)
        .replace('✅', '')
        .replace('❌', '')
        .replace('⚠️', '')
        .trim();

    showNotification(cleanMessage, type);
};
