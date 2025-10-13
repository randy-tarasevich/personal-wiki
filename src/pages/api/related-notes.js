import { Ollama } from "ollama";
import db from "../../lib/db.js";

const ollama = new Ollama({
  host: "http://localhost:11434",
});

export async function POST({ request }) {
  try {
    const { noteId, title, content } = await request.json();

    if (!noteId || !title || !content) {
      return new Response(
        JSON.stringify({
          error: "Note ID, title, and content are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get all other notes from database
    const allNotes = db
      .prepare(
        `
      SELECT n.id, n.title, n.slug, n.content, n.created_at, n.updated_at,
             GROUP_CONCAT(t.name) as tags
      FROM notes n
      LEFT JOIN note_tags nt ON n.id = nt.note_id
      LEFT JOIN tags t ON nt.tag_id = t.id
      WHERE n.id != ?
      GROUP BY n.id
      ORDER BY n.updated_at DESC
      LIMIT 20
    `
      )
      .all(noteId);

    if (allNotes.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          relatedNotes: [],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create a prompt for finding related notes
    const notesList = allNotes
      .map(
        (note, index) =>
          `${index + 1}. Title: "${note.title}"\n   Content: "${note.content.substring(0, 200)}..."\n   Tags: ${note.tags || "none"}\n   ID: ${note.id}`
      )
      .join("\n\n");

    const prompt = `Analyze the following note and find the 3 most related notes from the list below. Consider content similarity, shared topics, and tags.

Current Note:
Title: "${title}"
Content: "${content}"

Available Notes:
${notesList}

Please respond with only the IDs of the 3 most related notes, separated by commas, no other text. Example: 5,12,8`;

    const response = await ollama.chat({
      model: "llama2",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: false,
    });

    // Parse the response to extract note IDs
    const suggestedIds = response.message.content
      .split(",")
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id) && id > 0)
      .slice(0, 3);

    // Get the suggested notes with their full details
    const relatedNotes = allNotes.filter((note) =>
      suggestedIds.includes(note.id)
    );

    return new Response(
      JSON.stringify({
        success: true,
        relatedNotes: relatedNotes,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Related notes error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to find related notes. Make sure Ollama is running.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
