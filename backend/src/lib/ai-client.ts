import axios from 'axios';

// In Docker, this will be http://ai-service:8000
// For local dev, it is http://localhost:8000
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 10000, // 10 seconds timeout for AI processing
  headers: {
    'Content-Type': 'application/json',
  },
});