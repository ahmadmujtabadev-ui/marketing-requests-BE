// Add this to your existing auth.js middleware file
// or create a separate roles.js file

export function requireRole(allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.role;
    console.log("userRole 7", userRole)
    
    if (!userRole) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `This action requires one of these roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}