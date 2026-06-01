// This is a Vercel Serverless Function skeleton for the Anthropic Claude API
// It securely holds the API key on the server-side, preventing exposure in the frontend.

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { imageBase64 } = req.body;
        const apiKey = process.env.ANTHROPIC_API_KEY;

        if (!apiKey) {
            // Mock response if API key is not configured (e.g. for the demo)
            return res.status(200).json({
                name: "Grilled Chicken Salad",
                calories: 340,
                protein: 42,
                carbs: 12,
                fat: 14
            });
        }

        // Real API call logic (commented out until API key is available):
        /*
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 1024,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: 'image/jpeg',
                                    data: imageBase64
                                }
                            },
                            {
                                type: 'text',
                                text: 'Analyze this food. Return ONLY a JSON object with properties: name, calories, protein, carbs, fat.'
                            }
                        ]
                    }
                ]
            })
        });

        const data = await response.json();
        // Parse Claude's JSON response and return it
        const parsed = JSON.parse(data.content[0].text);
        return res.status(200).json(parsed);
        */

    } catch (error) {
        console.error('Error analyzing image:', error);
        return res.status(500).json({ error: 'Failed to analyze image' });
    }
}
