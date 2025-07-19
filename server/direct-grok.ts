// Direct Grok API passthrough - no additional processing
import express from 'express';
import axios from 'axios';

const router = express.Router();
const API_KEY = process.env.XAI_API_KEY;

// Direct passthrough to Grok API without any modifications
router.post('/api/grok/direct', async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      req.body, // Pass request body directly
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );
    
    res.json(response.data);
  } catch (error: any) {
    console.error('Direct Grok error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(
      error.response?.data || { error: error.message }
    );
  }
});

export default router;