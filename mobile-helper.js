// mobile-helper.js

/**
 * Sets a CSS custom property (--app-height) to the window's inner height.
 * This helps create a stable 100% height layout on mobile browsers,
 * avoiding issues with the address bar appearing/disappearing.
 */
function setAppHeight() {
    const doc = document.documentElement;
    doc.style.setProperty('--app-height', `${window.innerHeight}px`);
}

// Set the height on initial load, resize, and orientation changes.
window.addEventListener('resize', setAppHeight);
window.addEventListener('orientationchange', setAppHeight);
setAppHeight();