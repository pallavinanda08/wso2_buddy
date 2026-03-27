export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { query, product = "UNKNOWN", version = "UNKNOWN" } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query missing" });
    }

    // 🧠 Your SYSTEM PROMPT (shortened version - you can paste full one if needed)
    const SYSTEM_PROMPT = `
You are WSO2 Buddy, an expert assistant for WSO2 APIM, MI, IS.
You MUST only give version-specific guidance.
If product/version missing → ask user to select.
Always follow structured output.
`;

    // 🧠 Context handling
    const versionContext =
      product !== "UNKNOWN"
        ? `User selected WSO2 ${product} ${version}. Give exact implementation guidance.`
        : `User has NOT selected product/version. Ask them to select first.`;

    // 🧠 Final prompt
    const finalPrompt = `
${SYSTEM_PROMPT}

${versionContext}

USER QUERY:
${query}
`;

    // 🔥 Gemini API call
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: finalPrompt }] }],
        }),
      }
    );

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from model";

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("BACKEND ERROR:", error);
    return res.status(500).json({ error: "Backend failed" });
  }
}
