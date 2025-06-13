import express from 'express';
import Article from '../models/Article.js';
import User from '../models/User.js';

const router = express.Router();

// Get admin dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.session || !req.session.userId) {
      console.log('User not authenticated');
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }

    // Get current user
    const user = await User.findById(req.session.userId).select('-password');
    if (!user) {
      console.log('User not found:', req.session.userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get all articles by current user
    const articles = await Article.find({ author: req.session.userId });
    
    // Calculate stats
    const stats = {
      totalArticles: articles.length,
      publishedArticles: articles.filter(a => a.published).length,
      featuredArticles: articles.filter(a => a.featured).length,
      totalViews: articles.reduce((sum, article) => sum + (article.views || 0), 0)
    };

    // Get recent articles
    const recentArticles = await Article.find({ author: req.session.userId })
      .sort({ createdAt: -1 })
      .limit(5);

    console.log('Dashboard data:', {
      user: user.username,
      stats,
      recentArticlesCount: recentArticles.length
    });

    res.json({
      success: true,
      data: {
        user,
        stats,
        recentArticles
      }
    });
  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

// Get all articles by current user
router.get('/articles', async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const totalArticles = await Article.countDocuments({ author: req.session.userId });
    const totalPages = Math.ceil(totalArticles / limit);
    
    const articles = await Article.find({ author: req.session.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    
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
    console.error('Articles Error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

export default router;