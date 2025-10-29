import cors from 'cors';
import config from '../config/env.js';

const corsOptions = {
  origin: config.ALLOWED_ORIGINS,
  credentials: true
};

export default cors(corsOptions);
