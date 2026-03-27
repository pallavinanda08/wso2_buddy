export default async function handler(req, res) {
  try {
    const { query, product, version } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query missing" });
    }

    const prompt = `
You are WSO2 Buddy.

Product: ${product}
Version: ${version}

User question:
${query}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({
        error: data.error.message,
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return res.status(200).json({
      reply: reply || "No response from model",
    });

  } catch (error) {
    return res.status(500).json({
      error: "Backend error",
    });
  }
}
