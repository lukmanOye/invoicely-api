const { users, ID } = require('../services/appwriteService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const tokenBlacklist = new Set();

class AuthController {
  constructor() {
   
  }

  
  
    async register(req, res) {
        try {
            const { email, password, name, role } = req.body;
            
            if (!email || !password || !name) {
                return res.status(400).json({
                    success: false,
                    error: 'Email, password, and name are required'
                });
            }

            console.log('👤 Creating user in Appwrite...');
            
           
            const validRoles = ['USER', 'ADMIN'];
            const userRole = role && validRoles.includes(role.toUpperCase()) 
                ? role.toUpperCase() 
                : 'USER';

           
            const hashedPassword = await bcrypt.hash(password, 12);
            
            
            let user;
            
            try {
                user = await users.create(
                    ID.unique(),
                    email,
                    password, 
                    name
                );
            } catch (error) {
                console.log('❌ Standard creation failed, trying alternative...');
                
               
                const availableMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(users))
                    .filter(method => typeof users[method] === 'function');
                
                console.log('Available user methods:', availableMethods);
                
                if (availableMethods.includes('createBcryptUser')) {
                    user = await users.createBcryptUser(
                        ID.unique(),
                        email,
                        password,
                        name
                    );
                } else {
                    if (error.message.includes('phone')) {
                        return this.registerFallback(req, res, userRole);
                    }
                    throw error;
                }
            }
            
            await users.updatePrefs(user.$id, {
                passwordHash: hashedPassword,
                email: email,
                role: userRole,
                registeredAt: new Date().toISOString(),
                authMethod: 'custom'
            });
            
            console.log(`✅ User created with role: ${userRole}`, user.$id);
            
            res.status(201).json({
                success: true,
                message: 'Account created successfully',
                data: {
                    user: {
                        id: user.$id,
                        email: user.email,
                        name: user.name,
                        role: userRole
                    }
                }
            });

        } catch (error) {
            console.error('❌ Registration error:', error.message);
            
            if (error.message.includes('already exists')) {
                return res.status(409).json({
                    success: false,
                    error: 'User already exists'
                });
            }
            
            if (error.message.includes('phone')) {
                // Ultimate fallback - try with empty string for phone
                return this.registerFallback(req, res);
            }
            
            res.status(500).json({
                success: false,
                error: 'Registration failed: ' + error.message
            });
        }
    }

    async registerFallback(req, res, userRole = 'USER') {
        try {
            const { email, password, name, role } = req.body;
            
            console.log('🔄 Trying fallback registration method...');
            
            const finalRole = userRole || (role && ['USER', 'ADMIN'].includes(role.toUpperCase()) ? role.toUpperCase() : 'USER');
            
            // Hash password before storing
            const hashedPassword = await bcrypt.hash(password, 12);
            
            // Try with empty string for phone
            const user = await users.create(
                ID.unique(),
                email,
                password,
                name,
                "" // Empty string instead of null
            );
            
            await users.updatePrefs(user.$id, {
                passwordHash: hashedPassword,
                email: email,
                role: finalRole,
                registeredAt: new Date().toISOString(),
                authMethod: 'custom'
            });
            
            console.log(`✅ User created with fallback method, role: ${finalRole}`, user.$id);
            
            res.status(201).json({
                success: true,
                message: 'Account created successfully',
                data: {
                    user: {
                        id: user.$id,
                        email: user.email,
                        name: user.name,
                        role: finalRole
                    }
                }
            });
            
        } catch (fallbackError) {
            console.error('❌ Fallback registration also failed:', fallbackError.message);
            res.status(500).json({
                success: false,
                error: 'Registration failed: ' + fallbackError.message
            });
        }
    }


  
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ success: false, error: 'Email & password required' });

      const list = await users.list();
      const user = list.users.find(u => u.email === email);
      if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });

      const prefs = await users.getPrefs(user.$id);
      const isValid = prefs.passwordHash && await bcrypt.compare(password, prefs.passwordHash);
      if (!isValid) return res.status(401).json({ success: false, error: 'Invalid credentials' });

      const token = this.createToken(user, prefs.role || 'USER');
      res.json({
        success: true,
        data: {
          user: { id: user.$id, email: user.email, name: user.name, role: prefs.role || 'USER' },
          token,
          expiresIn: '24h'
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  createToken(user, role = 'USER') {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    return jwt.sign(
      { userId: user.$id, email: user.email, name: user.name, role },
      secret,
      { expiresIn: '24h' }
    );
  }

  verifyToken(token) {
    if (tokenBlacklist.has(token)) throw new Error('Token revoked');
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
  }

  authMiddleware(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ success: false, error: 'No token' });
      req.user = this.verifyToken(token);
      next();
    } catch (err) {
      res.status(401).json({ success: false, error: err.message });
    }
  }

  requireAdmin(req, res, next) {
    this.authMiddleware(req, res, () => {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: 'Admin required' });
      }
      next();
    });
  }

  async logout(req, res) {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) tokenBlacklist.add(token);
    res.json({ success: true, message: 'Logged out' });
  }

  async getCurrentUser(req, res) {
    try {
      const user = await users.get(req.user.userId);
      const prefs = await users.getPrefs(user.$id);
      res.json({
        success: true,
        data: {
          user: {
            id: user.$id,
            email: user.email,
            name: user.name,
            role: prefs.role || 'USER'
          }
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ADMIN: CHANGE PASSWORD
  async changeUserPassword(req, res) {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }
      const { userId } = req.params;
      const { newPassword } = req.body;
      if (!newPassword) return res.status(400).json({ success: false, error: 'Password required' });

      const hashed = await bcrypt.hash(newPassword, 12);
      await users.updatePrefs(userId, { passwordHash: hashed });

      res.json({ success: true, message: 'Password updated' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

const controller = new AuthController();
module.exports = {
  register: controller.register.bind(controller),
  login: controller.login.bind(controller),
  logout: controller.logout.bind(controller),
  getCurrentUser: controller.getCurrentUser.bind(controller),
  authMiddleware: controller.authMiddleware.bind(controller),
  requireAdmin: controller.requireAdmin.bind(controller),
  changeUserPassword: controller.changeUserPassword.bind(controller)
};