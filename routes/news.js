import express from 'express';
import Article from '../models/Article.js';
import { isAuthenticated } from '../middleware/auth.js';
import sanitizeHtml from 'sanitize-html';
import { upload } from '../utils/upload.js';

const router = express.Router();

// Get all published articles with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const search = req.query.search;
    
    // Build query
    const query = { published: true };
    
    // Add category filter if provided
    if (category && category !== 'All') {
      query.category = category;
    }
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subtitle: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    const totalArticles = await Article.countDocuments(query);
    const totalPages = Math.ceil(totalArticles / limit);
    
    const articles = await Article.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'username');
    
    res.json({
      success: true,
      data: articles,
      pagination: {
        page,
        limit,
        totalArticles,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get featured articles
router.get('/featured', async (req, res) => {
  try {
    const articles = await Article.find({ published: true, featured: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('author', 'username');
    
    res.json({
      success: true,
      data: articles
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get article by ID
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('author', 'username');
    
    if (!article) {
      return res.status(404).json({ 
        success: false, 
        message: 'Article not found' 
      });
    }
    
    // Increment view count
    article.views += 1;
    await article.save();
    
    res.json({
      success: true,
      data: article
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create new article
router.post('/', isAuthenticated, upload.array('media', 10), async (req, res) => {
  try {
    const { title, subtitle, content, category, tags, featured } = req.body;
    
    // Sanitize HTML content
    const sanitizedContent = sanitizeHtml(content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'video', 'source']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'width', 'height', 'class'],
        video: ['src', 'controls', 'width', 'height', 'class'],
        source: ['src', 'type']
      }
    });
    
    // Process uploaded files
    const mediaFiles = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const fileType = file.mimetype.startsWith('image') ? 'image' : 'video';
        mediaFiles.push({
          type: fileType,
          url: `/uploads/${file.filename}`,
          caption: ''
        });
      });
    }
    
    // Set featured image if available
    let featuredImage = '';
    if (mediaFiles.length > 0 && mediaFiles[0].type === 'image') {
      featuredImage = mediaFiles[0].url;
    }
    
    // Create new article
    const article = new Article({
      title,
      subtitle: subtitle || '',
      content: sanitizedContent,
      author: req.session.userId,
      category: category || 'Other',
      featuredImage,
      media: mediaFiles,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      featured: featured === 'true',
      published: true
    });
    
    await article.save();
    
    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: article
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update article
router.put('/:id', isAuthenticated, upload.array('media', 10), async (req, res) => {
  try {
    const { title, subtitle, content, category, tags, published, featured } = req.body;
    
    // Find article
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ 
        success: false, 
        message: 'Article not found' 
      });
    }
    
    // Check if user is the author
    if (article.author.toString() !== req.session.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized to update this article' 
      });
    }
    
    // Sanitize HTML content
    const sanitizedContent = sanitizeHtml(content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'video', 'source']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'width', 'height', 'class'],
        video: ['src', 'controls', 'width', 'height', 'class'],
        source: ['src', 'type']
      }
    });
    
    // Process uploaded files
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const fileType = file.mimetype.startsWith('image') ? 'image' : 'video';
        article.media.push({
          type: fileType,
          url: `/uploads/${file.filename}`,
          caption: ''
        });
      });
      
      // Update featured image if it doesn't exist
      if (!article.featuredImage && article.media.length > 0 && article.media[0].type === 'image') {
        article.featuredImage = article.media[0].url;
      }
    }
    
    // Update article fields
    article.title = title || article.title;
    article.subtitle = subtitle !== undefined ? subtitle : article.subtitle;
    article.content = sanitizedContent || article.content;
    article.category = category || article.category;
    article.tags = tags ? tags.split(',').map(tag => tag.trim()) : article.tags;
    article.published = published !== undefined ? published === 'true' : article.published;
    article.featured = featured !== undefined ? featured === 'true' : article.featured;
    article.updatedAt = Date.now();
    
    await article.save();
    
    res.json({
      success: true,
      message: 'Article updated successfully',
      data: article
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete article
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ 
        success: false, 
        message: 'Article not found' 
      });
    }
    
    // Check if user is the author
    if (article.author.toString() !== req.session.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized to delete this article' 
      });
    }
    
    await Article.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;