// Authentication middleware
export const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  
  // If it's an API request, return JSON response
  if (req.path.startsWith('/api')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  
  // For page requests, redirect to login
  res.redirect('/login');
};