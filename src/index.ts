import 'dotenv/config';
import express from 'express';
import { sequelize } from './db.js';
import userRouter from "./router/user.router.js"
import { EmailService } from './service/email.service.js';

const app = express();
app.use(express.json());

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




const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`http://localhost:${port}`));