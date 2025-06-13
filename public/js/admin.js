// Editor Configuration
const initEditor = () => {
  const editor = document.getElementById('article-content');
  if (!editor) return;
  
  // Make editor element editable
  editor.contentEditable = true;
  editor.focus();
  
  // Handle file drops
  editor.addEventListener('dragover', (e) => {
    e.preventDefault();
    editor.classList.add('dragover');
  });
  
  editor.addEventListener('dragleave', () => {
    editor.classList.remove('dragover');
  });
  
  editor.addEventListener('drop', (e) => {
    e.preventDefault();
    editor.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length) {
      // Add files to the media upload input
      const mediaUpload = document.getElementById('media-upload');
      if (mediaUpload) {
        mediaUpload.files = files;
        
        // Trigger change event
        const event = new Event('change');
        mediaUpload.dispatchEvent(event);
      }
    }
  });
  
  // Handle paste events to clean up pasted content
  editor.addEventListener('paste', (e) => {
    e.preventDefault();
    
    // Get pasted text
    let text = '';
    if (e.clipboardData || e.originalEvent.clipboardData) {
      text = (e.originalEvent || e).clipboardData.getData('text/html') || 
             (e.originalEvent || e).clipboardData.getData('text/plain');
    } else if (window.clipboardData) {
      text = window.clipboardData.getData('Text');
    }
    
    // Clean up pasted HTML
    if (text.includes('<')) {
      // Very basic HTML cleanup
      text = text
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<(?:meta|link|input|button|form)[^>]*>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '');
    }
    
    // Insert text at cursor position
    document.execCommand('insertHTML', false, text);
  });
};

// Media Upload Handler
const initMediaUpload = () => {
  const mediaUpload = document.getElementById('media-upload');
  const mediaPreview = document.getElementById('media-preview');
  const mediaCaption = document.getElementById('media-caption');
  
  if (!mediaUpload || !mediaPreview) return;
  
  mediaUpload.addEventListener('change', () => {
    mediaPreview.innerHTML = '';
    
    for (const file of mediaUpload.files) {
      const reader = new FileReader();
      const mediaItem = document.createElement('div');
      mediaItem.className = 'media-item';
      
      reader.onload = (e) => {
        if (file.type.startsWith('image/')) {
          mediaItem.innerHTML = `
            <img src="${e.target.result}" alt="Preview">
            <button type="button" class="media-remove" title="Remove">&times;</button>
            <input type="text" class="media-caption-input" placeholder="Caption (optional)">
          `;
        } else if (file.type.startsWith('video/')) {
          mediaItem.innerHTML = `
            <video src="${e.target.result}" controls></video>
            <button type="button" class="media-remove" title="Remove">&times;</button>
            <input type="text" class="media-caption-input" placeholder="Caption (optional)">
          `;
        }
        
        mediaPreview.appendChild(mediaItem);
        
        // Remove button functionality
        const removeBtn = mediaItem.querySelector('.media-remove');
        if (removeBtn) {
          removeBtn.addEventListener('click', () => {
            mediaItem.remove();
            
            // If this is the last media item, clear the input
            if (mediaPreview.children.length === 0) {
              // We can't directly reset the file input, so we clone and replace it
              const newMediaUpload = mediaUpload.cloneNode(true);
              mediaUpload.parentNode.replaceChild(newMediaUpload, mediaUpload);
              
              // Re-initialize the event listener
              newMediaUpload.addEventListener('change', mediaUpload.onchange);
            }
          });
        }
        
        // Insert into editor button
        const insertBtn = document.createElement('button');
        insertBtn.type = 'button';
        insertBtn.className = 'media-insert';
        insertBtn.textContent = 'Insert into Content';
        insertBtn.title = 'Insert into Content';
        
        insertBtn.addEventListener('click', () => {
          const editor = document.getElementById('article-content');
          if (!editor) return;
          
          const caption = mediaItem.querySelector('.media-caption-input').value;
          
          if (file.type.startsWith('image/')) {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
              const imgHTML = `
                <figure class="article-image">
                  <img src="${e.target.result}" alt="${caption || 'Image'}" style="max-width: 100%;">
                  ${caption ? `<figcaption>${caption}</figcaption>` : ''}
                </figure>
              `;
              
              editor.focus();
              document.execCommand('insertHTML', false, imgHTML);
            };
          } else if (file.type.startsWith('video/')) {
            const videoHTML = `
              <figure class="article-video">
                <video src="${e.target.result}" controls style="max-width: 100%;"></video>
                ${caption ? `<figcaption>${caption}</figcaption>` : ''}
              </figure>
            `;
            
            editor.focus();
            document.execCommand('insertHTML', false, videoHTML);
          }
        });
        
        mediaItem.appendChild(insertBtn);
      };
      
      reader.readAsDataURL(file);
    }
  });
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initEditor();
  initMediaUpload();
  
  // Category selector
  const categorySelect = document.getElementById('article-category');
  if (categorySelect) {
    const categories = [
      'General'
    ];
    
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categorySelect.appendChild(option);
    });
  }
});

// Dashboard Charts (if needed)
const initDashboardCharts = () => {
  const viewsChart = document.getElementById('views-chart');
  if (!viewsChart) return;
  
  // This is a placeholder for chart initialization
  // You would use a library like Chart.js here
  console.log('Charts would be initialized here');
};

// Handle theme switch
const themeSwitch = document.getElementById('theme-switch');
if (themeSwitch) {
  const currentTheme = localStorage.getItem('admin-theme') || 'light';
  document.body.classList.toggle('dark-theme', currentTheme === 'dark');
  themeSwitch.checked = currentTheme === 'dark';
  
  themeSwitch.addEventListener('change', () => {
    document.body.classList.toggle('dark-theme', themeSwitch.checked);
    localStorage.setItem('admin-theme', themeSwitch.checked ? 'dark' : 'light');
  });
}

// Admin Navigation
const navLinks = document.querySelectorAll('.sidebar-nav-link');
navLinks.forEach(link => {
  if (link.getAttribute('href') === window.location.pathname) {
    link.classList.add('active');
  }
});