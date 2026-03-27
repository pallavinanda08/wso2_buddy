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
      body: JSON.stringify({
        query,
        product,
        version,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("API error:", text);
      return "Something went wrong. Please try again.";
    }

    const data = await res.json();

    if (data.error) {
      console.error("Backend error:", data.error);
      return "Error: " + data.error;
    }

    return data.reply || "No response from model";
  } catch (error) {
    console.error("Network error:", error);
    return "Unable to connect to server.";
  }
}
