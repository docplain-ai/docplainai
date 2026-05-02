module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({error: 'API key not configured'});
  try {
    const { messages } = req.body;
    if (!messages) return res.status(400).json({error: 'No messages provided'});
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages,
          generationConfig: { temperature: 0.5, maxOutputTokens: 1000 }
        })
      }
    );
    const data = await response.json();
    if (data.error) return res.status(500).json({error: 'Gemini error: ' + data.error.message});
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({error: 'No response generated'});
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({error: 'Server error: ' + err.message});
  }
};
