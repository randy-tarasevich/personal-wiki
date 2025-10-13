import { Ollama } from "ollama";

const ollama = new Ollama({
  host: "http://localhost:11434",
});

export async function POST({ request }) {
  try {
    const { title, content } = await request.json();

    if (!title || !content) {
      return new Response(
        JSON.stringify({
          error: "Title and content are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create a prompt for tag suggestions
    const prompt = `Analyze the following note and suggest 3-5 relevant tags. The tags should be:
- Short, descriptive keywords (1-2 words each)
- Relevant to the main topics discussed
- Useful for categorization and search
- In lowercase, separated by commas

Note Title: "${title}"
Note Content: "${content}"

Please respond with only the suggested tags, separated by commas, no other text.`;

    const response = await ollama.chat({
      model: "llama2", // You can make this configurable
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: false,
    });

    // Parse the response to extract tags
    const suggestedTags = response.message.content
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0 && tag.length < 30) // Filter out empty or too long tags
      .slice(0, 5); // Limit to 5 tags

    return new Response(
      JSON.stringify({
        success: true,
        tags: suggestedTags,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Tag suggestion error:", error);
    return new Response(
      JSON.stringify({
        error:
          "Failed to generate tag suggestions. Make sure Ollama is running.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
