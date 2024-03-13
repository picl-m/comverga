import { dbConnection } from "../index.js";
import { authenticateToken } from "../auth.js";
import express from "express";
const router = express.Router();

router.get("/", authenticateToken(), async (req, res) => {
  try {
    let results;
    if (req.user.role === "Admin") {
      [results] = await dbConnection.query("SELECT * FROM customer");
    } else if (req.user.role === "Customer") {
      [results] = await dbConnection.query(
        `SELECT * FROM customer WHERE email='${req.user.email}'`,
      );
    } else {
      res.status(403).json("Error: unknown user role!");
      return;
    }

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json("Error getting customer info: " + err);
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
      res.status(400).json("Error: missing data");
      return;
    }

    const [existingCustomers] = await dbConnection.query(
      `SELECT * FROM customer WHERE email='${email}'`,
    );
    if (existingCustomers.length > 0) {
      res.status(409).json("Error: customer with this email already exists!");
      return;
    }

    await dbConnection.query(
      `INSERT INTO customer (name, email, phone) VALUES ('${name}', '${email}', '${phone}')`,
    );

    res.status(201).json("Customer created successfully!");
  } catch (err) {
    res.status(500).json("Error creating customer: " + err);
  }
});

export { router as customerRouter };
