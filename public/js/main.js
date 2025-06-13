// DOM Elements
const body = document.body;
const darkModeToggle = document.getElementById('dark-mode-toggle');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const sidebar = document.querySelector('.sidebar');

// Toggle Dark Mode
if (darkModeToggle) {
  // Check for saved theme preference or prefer-color-scheme
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');
  
  // Apply the saved theme or use the preferred color scheme
  if (savedTheme === 'dark' || (!savedTheme && prefersDarkMode)) {
    body.classList.add('dark-mode');
  }
  
  darkModeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  });
}

// Mobile Menu Toggle
if (mobileMenuToggle && sidebar) {
  mobileMenuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });
}

// Infinite Scroll for News Feed
const articlesContainer = document.querySelector('.articles-grid');
const loadMoreBtn = document.getElementById('load-more');
let currentPage = 1;
let isLoading = false;

async function loadArticles(page = 1) {
  if (isLoading) return;
  
  isLoading = true;
  if (loadMoreBtn) loadMoreBtn.textContent = 'Loading...';
  
  try {
    const response = await fetch(`/api/news?page=${page}&limit=9`);
    const data = await response.json();
    
    if (data.success) {
      renderArticles(data.data);
      
      if (!data.pagination.hasNextPage && loadMoreBtn) {
        loadMoreBtn.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Error loading articles:', error);
    if (loadMoreBtn) loadMoreBtn.textContent = 'Error loading articles. Try again.';
  } finally {
    isLoading = false;
    if (loadMoreBtn) loadMoreBtn.textContent = 'Load More';
  }
}

function renderArticles(articles) {
  if (!articlesContainer) return;
  
  articles.forEach(article => {
    const articleCard = document.createElement('div');
    articleCard.className = 'article-card slide-up';
    
    const formattedDate = new Date(article.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    articleCard.innerHTML = `
      <a href="/article.html?id=${article._id}">
        <img src="${article.featuredImage || '/img/default-article.jpg'}" alt="${article.title}" class="article-img">
        <div class="article-content">
          <span class="article-category">${article.category}</span>
          <h3 class="article-title">${article.title}</h3>
          <div class="article-meta">
            <span>${article.author ? article.author.username : 'Admin'}</span>
            <span>${formattedDate}</span>
          </div>
          <p class="article-excerpt">${article.subtitle || truncateText(stripHtml(article.content), 100)}</p>
          <span class="btn btn-outline">Read More</span>
        </div>
      </a>
    `;
    
    articlesContainer.appendChild(articleCard);
  });
}

// Load more articles when button is clicked
if (loadMoreBtn) {
  loadMoreBtn.addEventListener('click', () => {
    currentPage++;
    loadArticles(currentPage);
  });
}

// Initial load of articles
if (articlesContainer) {
  loadArticles();
}

// Utility Functions
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// Article Page
const articleContainer = document.querySelector('.article-container');
const articleId = new URLSearchParams(window.location.search).get('id');

async function loadArticle(id) {
  if (!articleContainer || !id) return;
  
  try {
    const response = await fetch(`/api/news/${id}`);
    const data = await response.json();
    
    if (data.success) {
      renderArticle(data.data);
    } else {
      articleContainer.innerHTML = `
        <div class="text-center">
          <h2>Article Not Found</h2>
          <p>The article you're looking for doesn't exist or has been removed.</p>
          <a href="/" class="btn btn-primary">Back to Home</a>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading article:', error);
    articleContainer.innerHTML = `
      <div class="text-center">
        <h2>Error Loading Article</h2>
        <p>There was an error loading this article. Please try again later.</p>
        <a href="/" class="btn btn-primary">Back to Home</a>
      </div>
    `;
  }
}

function renderArticle(article) {
  const formattedDate = new Date(article.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  document.title = `${article.title} - News Website`;
  
  articleContainer.innerHTML = `
    <article class="fade-in">
      <div class="article-header">
        <span class="article-category">${article.category}</span>
        <h1>${article.title}</h1>
        ${article.subtitle ? `<div class="article-subtitle">${article.subtitle}</div>` : ''}
        <div class="article-meta">
          <span>By ${article.author ? article.author.username : 'Admin'}</span>
          <span>${formattedDate}</span>
          <span>${article.views} views</span>
        </div>
      </div>
      
      ${article.featuredImage ? `
        <img src="${article.featuredImage}" alt="${article.title}" class="article-featured-img">
      ` : ''}
      
      <div class="article-body">
        ${article.content}
      </div>
      
      ${article.tags && article.tags.length > 0 ? `
        <div class="article-tags">
          ${article.tags.map(tag => `<span class="article-tag">${tag}</span>`).join('')}
        </div>
      ` : ''}
    </article>
  `;
}

// Load article if on article page
if (articleContainer && articleId) {
  loadArticle(articleId);
}

// Admin Login
const loginForm = document.getElementById('login-form');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-msg');
    
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        window.location.href = '/admin';
      } else {
        errorMsg.textContent = data.message;
        errorMsg.style.display = 'block';
      }
    } catch (error) {
      console.error('Login error:', error);
      errorMsg.textContent = 'An error occurred. Please try again.';
      errorMsg.style.display = 'block';
    }
  });
}

// Admin Dashboard
const dashboardStats = document.getElementById('dashboard-stats');
const recentArticles = document.getElementById('recent-articles');

async function loadDashboard() {
  if (!dashboardStats || !recentArticles) return;
  
  try {
    const response = await fetch('/admin/dashboard');
    const data = await response.json();
    
    if (data.success) {
      renderDashboardStats(data.data.stats);
      renderRecentArticles(data.data.recentArticles);
      
      if (data.data.user) {
        document.getElementById('admin-name').textContent = data.data.user.username;
      }
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

function renderDashboardStats(stats) {
  dashboardStats.innerHTML = `
    <div class="stat-card">
      <div class="stat-title">Total Articles</div>
      <div class="stat-value">${stats.totalArticles}</div>
    </div>
    <div class="stat-card">
      <div class="stat-title">Published</div>
      <div class="stat-value">${stats.publishedArticles}</div>
    </div>
    <div class="stat-card">
      <div class="stat-title">Featured</div>
      <div class="stat-value">${stats.featuredArticles}</div>
    </div>
    <div class="stat-card">
      <div class="stat-title">Total Views</div>
      <div class="stat-value">${stats.totalViews}</div>
    </div>
  `;
}

function renderRecentArticles(articles) {
  let html = `
    <table class="table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Category</th>
          <th>Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  if (articles.length === 0) {
    html += `
      <tr>
        <td colspan="5" class="text-center">No articles yet.</td>
      </tr>
    `;
  } else {
    articles.forEach(article => {
      const formattedDate = new Date(article.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      html += `
        <tr>
          <td>${article.title}</td>
          <td>${article.category}</td>
          <td>${formattedDate}</td>
          <td>${article.published ? '<span class="badge-success">Published</span>' : '<span class="badge-warning">Draft</span>'}</td>
          <td>
            <a href="/admin/edit-article.html?id=${article._id}" class="btn-sm btn-outline">Edit</a>
            <a href="/article.html?id=${article._id}" target="_blank" class="btn-sm btn-outline">View</a>
          </td>
        </tr>
      `;
    });
  }
  
  html += `
      </tbody>
    </table>
  `;
  
  recentArticles.innerHTML = html;
}

// Load dashboard if on admin page
if (window.location.pathname === '/admin') {
  loadDashboard();
}

// Create/Edit Article
const articleForm = document.getElementById('article-form');
const articleTitleInput = document.getElementById('article-title');
const articleContent = document.getElementById('article-content');
const mediaPreview = document.getElementById('media-preview');
const editorToolbar = document.getElementById('editor-toolbar');

if (articleForm) {
  // Editor functionality
  if (editorToolbar && articleContent) {
    const editorButtons = [
      { command: 'bold', icon: 'B', title: 'Bold' },
      { command: 'italic', icon: 'I', title: 'Italic' },
      { command: 'underline', icon: 'U', title: 'Underline' },
      { command: 'insertHeading', arg: 'h2', icon: 'H2', title: 'Heading 2' },
      { command: 'insertHeading', arg: 'h3', icon: 'H3', title: 'Heading 3' },
      { command: 'insertUnorderedList', icon: '• List', title: 'Bulleted List' },
      { command: 'insertOrderedList', icon: '1. List', title: 'Numbered List' },
      { command: 'createLink', icon: 'Link', title: 'Insert Link' },
      { command: 'insertImage', icon: 'Image', title: 'Insert Image URL' }
    ];
    
    editorButtons.forEach(button => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'editor-btn';
      btn.textContent = button.icon;
      btn.title = button.title;
      
      btn.addEventListener('click', () => {
        if (button.command === 'createLink') {
          const url = prompt('Enter link URL:');
          if (url) {
            document.execCommand(button.command, false, url);
          }
        } else if (button.command === 'insertImage') {
          const url = prompt('Enter image URL:');
          if (url) {
            document.execCommand(button.command, false, url);
          }
        } else if (button.command === 'insertHeading') {
          document.execCommand('formatBlock', false, button.arg);
        } else {
          document.execCommand(button.command, false, button.arg || null);
        }
        articleContent.focus();
      });
      
      editorToolbar.appendChild(btn);
    });
    
    articleContent.addEventListener('input', () => {
      document.getElementById('article-content-hidden').value = articleContent.innerHTML;
    });
  }
  
  // Media preview
  const mediaInput = document.getElementById('media-upload');
  if (mediaInput && mediaPreview) {
    mediaInput.addEventListener('change', () => {
      mediaPreview.innerHTML = '';
      
      for (const file of mediaInput.files) {
        const reader = new FileReader();
        const mediaItem = document.createElement('div');
        mediaItem.className = 'media-item';
        
        reader.onload = (e) => {
          if (file.type.startsWith('image/')) {
            mediaItem.innerHTML = `
              <img src="${e.target.result}" alt="Preview">
              <button type="button" class="media-remove" title="Remove">&times;</button>
            `;
          } else if (file.type.startsWith('video/')) {
            mediaItem.innerHTML = `
              <video src="${e.target.result}" controls></video>
              <button type="button" class="media-remove" title="Remove">&times;</button>
            `;
          }
          
          mediaPreview.appendChild(mediaItem);
          
          // Remove button functionality
          const removeBtn = mediaItem.querySelector('.media-remove');
          if (removeBtn) {
            removeBtn.addEventListener('click', () => {
              mediaItem.remove();
              // Note: This doesn't actually remove the file from the input
              // We'd need a more complex solution with a custom file list
            });
          }
        };
        
        reader.readAsDataURL(file);
      }
    });
  }
  
  // Submit form
  articleForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(articleForm);
    const submitBtn = document.getElementById('submit-article');
    const errorMsg = document.getElementById('error-msg');
    
    if (articleContent) {
      formData.set('content', articleContent.innerHTML);
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    
    try {
      // Get article ID from URL if editing
      const articleId = new URLSearchParams(window.location.search).get('id');
      const url = articleId ? `/api/news/${articleId}` : '/api/news';
      const method = articleId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        window.location.href = '/admin/articles.html';
      } else {
        errorMsg.textContent = data.message;
        errorMsg.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Article';
      }
    } catch (error) {
      console.error('Error saving article:', error);
      errorMsg.textContent = 'An error occurred. Please try again.';
      errorMsg.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Article';
    }
  });
  
  // Load article data if editing
  const articleId = new URLSearchParams(window.location.search).get('id');
  if (articleId) {
    document.querySelector('.page-title').textContent = 'Edit Article';
    document.getElementById('submit-article').textContent = 'Update Article';
    
    // Fetch article data
    fetch(`/api/news/${articleId}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const article = data.data;
          
          articleTitleInput.value = article.title;
          document.getElementById('article-subtitle').value = article.subtitle || '';
          
          if (articleContent) {
            articleContent.innerHTML = article.content;
            document.getElementById('article-content-hidden').value = article.content;
          }
          
          const categorySelect = document.getElementById('article-category');
          if (categorySelect) {
            categorySelect.value = article.category;
          }
          
          const tagsInput = document.getElementById('article-tags');
          if (tagsInput && article.tags) {
            tagsInput.value = article.tags.join(', ');
          }
          
          const publishedCheckbox = document.getElementById('article-published');
          if (publishedCheckbox) {
            publishedCheckbox.checked = article.published;
          }
          
          const featuredCheckbox = document.getElementById('article-featured');
          if (featuredCheckbox) {
            featuredCheckbox.checked = article.featured;
          }
        }
      })
      .catch(error => {
        console.error('Error loading article for editing:', error);
      });
  }
}

// Admin Articles List
const articlesTable = document.getElementById('articles-table');
const articlesPagination = document.getElementById('articles-pagination');

async function loadAdminArticles(page = 1) {
  if (!articlesTable) return;
  
  try {
    const response = await fetch(`/admin/articles?page=${page}&limit=10`);
    const data = await response.json();
    
    if (data.success) {
      renderAdminArticles(data.data);
      renderPagination(data.pagination);
    }
  } catch (error) {
    console.error('Error loading admin articles:', error);
    articlesTable.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">Error loading articles. Please try again.</td>
      </tr>
    `;
  }
}

function renderAdminArticles(articles) {
  let html = '';
  
  if (articles.length === 0) {
    html = `
      <tr>
        <td colspan="6" class="text-center">No articles found.</td>
      </tr>
    `;
  } else {
    articles.forEach(article => {
      const formattedDate = new Date(article.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      html += `
        <tr>
          <td>${article.title}</td>
          <td>${article.category}</td>
          <td>${formattedDate}</td>
          <td>${article.views}</td>
          <td>
            ${article.published 
              ? '<span class="badge-success">Published</span>' 
              : '<span class="badge-warning">Draft</span>'}
            ${article.featured 
              ? '<span class="badge-primary ml-1">Featured</span>' 
              : ''}
          </td>
          <td>
            <a href="/admin/edit-article.html?id=${article._id}" class="btn-sm btn-outline">Edit</a>
            <a href="/article.html?id=${article._id}" target="_blank" class="btn-sm btn-outline">View</a>
            <button class="btn-sm btn-danger delete-article" data-id="${article._id}">Delete</button>
          </td>
        </tr>
      `;
    });
  }
  
  articlesTable.innerHTML = html;
  
  // Add event listeners for delete buttons
  const deleteButtons = document.querySelectorAll('.delete-article');
  deleteButtons.forEach(button => {
    button.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
        const articleId = button.getAttribute('data-id');
        
        try {
          const response = await fetch(`/api/news/${articleId}`, {
            method: 'DELETE'
          });
          
          const data = await response.json();
          
          if (data.success) {
            // Refresh the articles list
            loadAdminArticles();
          } else {
            alert(`Error: ${data.message}`);
          }
        } catch (error) {
          console.error('Error deleting article:', error);
          alert('An error occurred while deleting the article. Please try again.');
        }
      }
    });
  });
}

function renderPagination(pagination) {
  if (!articlesPagination) return;
  
  let html = '';
  
  if (pagination.totalPages > 1) {
    html = '<div class="pagination">';
    
    // Previous button
    if (pagination.hasPrevPage) {
      html += `<button class="btn-pagination" data-page="${pagination.page - 1}">Previous</button>`;
    } else {
      html += `<button class="btn-pagination disabled">Previous</button>`;
    }
    
    // Page numbers
    const startPage = Math.max(1, pagination.page - 2);
    const endPage = Math.min(pagination.totalPages, pagination.page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      if (i === pagination.page) {
        html += `<button class="btn-pagination active">${i}</button>`;
      } else {
        html += `<button class="btn-pagination" data-page="${i}">${i}</button>`;
      }
    }
    
    // Next button
    if (pagination.hasNextPage) {
      html += `<button class="btn-pagination" data-page="${pagination.page + 1}">Next</button>`;
    } else {
      html += `<button class="btn-pagination disabled">Next</button>`;
    }
    
    html += '</div>';
  }
  
  articlesPagination.innerHTML = html;
  
  // Add event listeners for pagination buttons
  const paginationButtons = document.querySelectorAll('.btn-pagination:not(.disabled):not(.active)');
  paginationButtons.forEach(button => {
    button.addEventListener('click', () => {
      const page = parseInt(button.getAttribute('data-page'));
      loadAdminArticles(page);
    });
  });
}

// Load admin articles if on articles page
if (window.location.pathname === '/admin/articles.html') {
  loadAdminArticles();
}

// Logout functionality
const logoutBtn = document.getElementById('logout-btn');

if (logoutBtn) {
  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/auth/logout');
      const data = await response.json();
      
      if (data.success) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('An error occurred during logout. Please try again.');
    }
  });
}