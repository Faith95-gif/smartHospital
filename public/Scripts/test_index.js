function detectDeviceWidth() {
    var width = window.innerWidth;
    var linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.type = 'text/css';

    if (width <= 768) { // Assuming 768px is the threshold for mobile devices
        linkElement.href = 'phone.css'; // Path to phone.css
    } else {
        linkElement.href = ''; 
    }

    document.head.appendChild(linkElement);
}

// Run the function when the page loads
window.onload = detectDeviceWidth;

// Optional: Recheck on window resize
window.onresize = detectDeviceWidth;