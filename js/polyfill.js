window.mapboxgl = window.maplibregl;

// Suppress harmless AbortError console noise when panning the map
window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.name === 'AbortError') {
    event.preventDefault();
    }
});

// Polyfill for maplibregl.accessToken
window.maplibregl = window.maplibregl || {};
window.maplibregl.accessToken = '';
