const { users } = require('../services/appwriteService');

const jwtMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    
    console.log('🔐 Verifying JWT token...');

    try {
      const payload = decodeJWT(token);
      
      if (!payload.userId) {
        throw new Error('Invalid JWT payload');
      }

      const user = await users.get(payload.userId);
      
      req.user = {
        id: user.$id,
        email: user.email,
        name: user.name
      };

      console.log('✅ Authenticated user:', req.user.email);
      next();
      
    } catch (jwtError) {
      console.error('❌ JWT invalid:', jwtError.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

function decodeJWT(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload;
  } catch (error) {
    throw new Error('Invalid JWT format');
  }
}

module.exports = jwtMiddleware;