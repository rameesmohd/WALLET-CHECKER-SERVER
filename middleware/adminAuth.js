const jwt = require("jsonwebtoken");

const verifyToken = async (req, res, next) => {
    try {
      const token = req.header('Authorization');
      if (!token) {
        return res.status(401).json({ message: 'Authentication failed: No token provided.' });
      }
  
      if (!token.startsWith('Bearer')) {
        return res.status(401).json({ message: 'Authentication failed: Invalid token format.' });
      }
  
      const tokenWithoutBearer = token.slice(7).trim();
  
      const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET_KEY_ADMIN);
      req.decodedUser = decoded;
      next();
      if (decoded.role === 'admin') {
      } else {
        return res.status(403).json({ message: 'Authentication failed: Invalid role.' });
      }
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Authentication failed: Token has expired.' });
      }
      return res.status(401).json({ message: 'Authentication failed: Invalid token.' });
    }
  };

module.exports = { verifyToken }