export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({error: 'API key not configured'});

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const prompt = body && body.messages && body.messages[0] && body.messages[0].parts && body.messages[0].parts[0] && body.messages[0].parts[0].text;

    if (!prompt) return res.status(400).json({error: 'No message provided'});

    const geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          contents: [{parts: [{text: prompt}]}],
          generationConfig: {temperature: 0.5, maxOutputTokens: 1000}
        })
      }
    );

    const rawText = await geminiRes.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch(e) {
      return res.status(500).json({error: 'Invalid response from Gemini'});
    }

    if (data.error) return res.status(500).json({error: data.error.message});

    const text = data.candidates &&
                 data.candidates[0] &&
                 data.candidates[0].content &&
                 data.candidates[0].content.parts &&
                 data.candidates[0].content.parts[0] &&
                 data.candidates[0].content.parts[0].text;

    if (!text) return res.status(500).json({error: 'No response generated'});

    return res.status(200).json({text: text});

  } catch(err) {
    return res.status(500).json({error: err.message || 'Server error'});
  }
}
