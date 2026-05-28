import axios from 'axios';
import http from 'http';
import https from 'https';

export const aiClient = axios.create({
  baseURL: process.env.AI_SERVICE_URL||"http://localhost:8000",
  // Reusing connections prevents "Socket Buffer Full" errors
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
});