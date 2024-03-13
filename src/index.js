import "dotenv/config";
import express from "express";
import mysql from "mysql2/promise";

import { customerRouter } from "./routes/customer.router.js";
import { userRouter } from "./routes/user.router.js";
import { serviceRouter } from "./routes/service.router.js";

const app = express();
const port = process.env.PORT || 5000;
const dbURI = process.env.DB_URI;

if (!dbURI) {
  console.error("Error: database URI not specified.");
  process.exit(1);
}

if (!process.env.SECRET_ACCESS_TOKEN) {
  console.error("Error: access token not specified.");
  process.exit(1);
}

// MySQL connection
export const dbConnection = await mysql.createConnection({ uri: dbURI });
console.log("Database connected successfully");

app.use(express.json());

app.use("/customer", customerRouter);
app.use("/user", userRouter);
app.use("/service", serviceRouter);

app.listen(port, () => {
  console.log("Server started on port " + port);
});
