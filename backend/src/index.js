// Entry point - to be implemented by backend-agent
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'GitInsights API' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
