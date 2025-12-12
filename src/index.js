import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import transactionsRoutes from "./api/transaction.js";
import usersRoutes from "./api/users.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api/transactions", transactionsRoutes);
app.use("/api/users", usersRoutes);

app.get("/", (req, res) => res.send("FinTrack Backend is up"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
