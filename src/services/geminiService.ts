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

    // Handle HTTP errors
    if (!res.ok) {
      const errorText = await res.text();
      console.error("API Error:", errorText);
      return "Something went wrong. Please try again.";
    }

    const data = await res.json();

    // Handle backend error response
    if (data.error) {
      console.error("Backend Error:", data.error);
      return "I encountered an error while processing your request.";
    }

    return data.reply || "No response received.";

  } catch (error) {
    console.error("Network Error:", error);
    return "Unable to connect to server. Please check your connection.";
  }
}
