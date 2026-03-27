export async function getGeminiResponse(
  query: string,
  product: string,
  version: string
): Promise<string> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, product, version }),
    });

    if (!res.ok) {
      return "Something went wrong. Please try again.";
    }

    const data = await res.json();

    return data.reply || "No response received.";
  } catch (error) {
    return "Unable to connect to server.";
  }
}
