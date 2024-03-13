import { dbConnection } from "../index.js";
import { authenticateToken } from "../auth.js";
import express from "express";
const router = express.Router();

router.get("/", authenticateToken(), async (req, res) => {
  try {
    let results;
    if (req.user.role === "Admin") {
      if (!req.query.customer_id) {
        res.status(400).json("Error: no customer id specified!");
        return;
      }
      [results] = await dbConnection.query(
        `SELECT * FROM service WHERE customer_id='${req.query.customer_id}'`,
      );
    } else if (req.user.role === "Customer") {
      [results] = await dbConnection.query(
        `SELECT * FROM service WHERE customer_id='${req.user.customer_id}'`,
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

router.post("/", authenticateToken("Admin"), async (req, res) => {
  try {
    const { name, startDate, endDate, customerEmail } = req.body;
    if (!name || !startDate || !endDate || !customerEmail) {
      res.status(400).json("Error: missing data");
      return;
    }

    const [customer] = await dbConnection.query(
      `SELECT id FROM customer WHERE email='${customerEmail}'`,
    );
    if (customer.length < 0) {
      res.status(404).json("Error: customer could not be found!");
      return;
    }

    await dbConnection.query(
      `INSERT INTO service (name, start_date, end_date, customer_id) VALUES 
      ('${name}', '${startDate}', '${endDate}', '${customer[0].id}')`,
    );

    res.status(201).json("Service created successfully!");
  } catch (err) {
    res.status(500).json("Error creating service: " + err);
  }
});

export { router as serviceRouter };
