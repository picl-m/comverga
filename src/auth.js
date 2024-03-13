import jwt from "jsonwebtoken";

// authenticateToken() returns a function that is used as middleware
// the function returns 403 if the user doesnt have the required role provided
// if no required role is provided the user only needs a valid token

export function authenticateToken(requiredRole) {
  return (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token == null) {
      return res.sendStatus(401);
    }

    jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      if (requiredRole && user.role !== requiredRole) {
        return res.sendStatus(403);
      }

      req.user = user;
      next();
    });
  };
}
