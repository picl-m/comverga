import { dbConnection } from "../index.js";
import { authenticateToken } from "../auth.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import express from "express";
const router = express.Router();

router.delete("/", authenticateToken("Admin"), async (req, res) => {
  try {
    if (req.query.email) {
      await dbConnection.query(
        `DELETE FROM user WHERE email='${req.query.email}'`,
      );
      res.status(200).json("User successfully deleted");
    } else {
      res.status(400).json("Error: no email specified!");
    }
  } catch (err) {
    res.status(500).json("Error removing customer: " + err);
  }
});

router.get("/", authenticateToken("Admin"), async (req, res) => {
  try {
    if (req.query.email) {
      const [results] = await dbConnection.query(
        `SELECT id, email, role, customer_id FROM user WHERE email='${req.query.email}'`,
      );
      res.status(200).json(results);
    } else {
      res.status(400).json("Error: no email specified!");
    }
  } catch (err) {
    res.status(500).json("Error getting customer info: " + err);
  }
});

async function createUser(res, email, password, role) {
  const [existingUsers] = await dbConnection.query(
    `SELECT * FROM user WHERE email='${email}'`,
  );
  if (existingUsers.length > 0) {
    res.status(409).json("Error: user with this email already exists!");
    return;
  }

  const [existingCustomers] = await dbConnection.query(
    `SELECT id FROM customer WHERE email='${email}'`,
  );

  const hash = await bcrypt.hash(password, 10);
  if (existingCustomers.length > 0) {
    await dbConnection.query(
      `INSERT INTO user (email, password, role, customer_id) VALUES ('${email}', '${hash}', '${role}', '${existingCustomers[0].id}')`,
    );
  } else {
    await dbConnection.query(
      `INSERT INTO user (email, password, role) VALUES ('${email}', '${hash}', '${role}')`,
    );
  }

  res.status(201).json("User created successfully!");
}

router.post("/register-customer", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json("Error: missing data");
      return;
    }

    createUser(res, email, password, "Customer");
  } catch (err) {
    res.status(500).json("Error creating user: " + err);
  }
});

router.post("/register-admin", authenticateToken("Admin"), async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json("Error: missing data");
      return;
    }

    createUser(res, email, password, "Admin");
  } catch (err) {
    res.status(500).json("Error creating user: " + err);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json("Error: missing data");
      return;
    }

    const [[dbUser]] = await dbConnection.query(
      `SELECT * FROM user WHERE email="${email}"`,
    );
    if (!dbUser) {
      res.status(400).json("Error: user with this email doesnt exist!");
      return;
    }

    const login = await bcrypt.compare(password, dbUser.password);

    if (login === true) {
      const user = {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        customer_id: dbUser.customer_id,
      };
      const accessToken = jwt.sign(user, process.env.SECRET_ACCESS_TOKEN, {
        expiresIn: "30m",
      });

      res.status(200).json({ accessToken: accessToken });
    } else {
      res.status(400).json("Error: incorrect password!");
    }
  } catch (err) {
    res.status(500).json("Error logging in user: " + err);
  }
});

export { router as userRouter };
