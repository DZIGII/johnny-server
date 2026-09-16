import 'dotenv/config';
import express from 'express';
import { sequelize } from './db.js';
import { EmailService } from './service/email.service.js';

const app = express();
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ ok: true, db: 'up' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, db: 'down' });
  }
});

const emailService = new EmailService()

app.get('/testmail', async (req, res) => {
  try {
    await emailService.sendVerificationCode("nraskovic10124rn@raf.rs", "123321")
    res.json({ok: true})
  }
  catch (e) {
    console.log(e)
    res.status(500).json({ok: false})
  }
})



const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`http://localhost:${port}`));