import { Ollama } from "ollama";

const ollama = new Ollama({
  host: "http://localhost:11434",
});

export async function POST({ request }) {
  try {
    const { message, model = "llama2" } = await request.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await ollama.chat({
      model,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
      stream: false,
    });

    return new Response(
      JSON.stringify({
        response: response.message.content,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Ollama API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to get response from Ollama",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
