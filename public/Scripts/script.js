document.addEventListener('DOMContentLoaded', function() {
    const heroSection = document.querySelector('.hero');

    const images = [
        'Pictures/Picture1 (1).jpeg',
        'Pictures/Picture1 (2).jpeg',
        'Pictures/Picture1 (3).jpeg',
        'Pictures/Picture1 (4).jpeg',
        'Pictures/Picture1 (5).jpeg',
        'Pictures/Picture1 (6).jpeg',
        'Pictures/Picture1 (7).jpeg'
    ];

    let currentIndex = 0;

    function changeBackground() {
        currentIndex = (currentIndex + 1) % images.length;
        heroSection.style.backgroundImage = `url('${images[currentIndex]}')`;
    }

    // Set interval to change background every 10 seconds
    setInterval(changeBackground, 5000);

    // Initialize with the first image
    heroSection.style.backgroundImage = `url('${images[0]}')`;
});