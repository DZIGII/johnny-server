import 'dotenv/config';
import express from 'express';
import { sequelize } from './db.js';
import userRouter from "./router/user.router.js"
import driveRouter from "./router/drive.router.js"
import { EmailService } from './service/email.service.js';
import cors from "cors";

const app = express();
app.use(express.json());

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://rasko.dev",
    "https://www.rasko.dev"
  ],
  credentials: true
}));

await sequelize.sync();

app.get('/health', async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ ok: true, db: 'up' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, db: 'down' });
  }
});


app.use("/users", userRouter)
app.use("/drive", driveRouter)




const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`http://localhost:${port}`));