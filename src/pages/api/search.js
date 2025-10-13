import { Ollama } from "ollama";
import db from "../../lib/db.js";

const ollama = new Ollama({
  host: "http://localhost:11434",
});

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q");
    const type = url.searchParams.get("type") || "text"; // "text" or "semantic"
    const page = parseInt(url.searchParams.get("page")) || 1;
    const limit = parseInt(url.searchParams.get("limit")) || 10;
    const offset = (page - 1) * limit;

    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: "Search query is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let results = [];
    let totalCount = 0;

    if (type === "semantic") {
      // AI-powered semantic search
      const semanticResults = await performSemanticSearch(query, limit, offset);
      results = semanticResults.results;
      totalCount = semanticResults.totalCount;
    } else {
      // Traditional text search
      const textResults = await performTextSearch(query, limit, offset);
      results = textResults.results;
      totalCount = textResults.totalCount;
    }

    return new Response(
      JSON.stringify({
        success: true,
        query,
        type,
        results,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Search error:", error);
    return new Response(
      JSON.stringify({
        error: "Search failed. Please try again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function performTextSearch(query, limit, offset) {
  const searchTerm = `%${query}%`;

  // Get total count
  const totalCount = db
    .prepare(
      `
    SELECT COUNT(*) as count 
    FROM notes 
    WHERE title LIKE ? OR content LIKE ?
  `
    )
    .get(searchTerm, searchTerm).count;

  // Get search results
  const results = db
    .prepare(
      `
    SELECT n.id, n.title, n.slug, n.content, n.created_at, n.updated_at,
           GROUP_CONCAT(t.name) as tags,
           CASE 
             WHEN n.title LIKE ? THEN 3
             WHEN n.content LIKE ? THEN 1
             ELSE 0
           END as relevance_score
    FROM notes n
    LEFT JOIN note_tags nt ON n.id = nt.note_id
    LEFT JOIN tags t ON nt.tag_id = t.id
    WHERE n.title LIKE ? OR n.content LIKE ?
    GROUP BY n.id
    ORDER BY relevance_score DESC, n.updated_at DESC
    LIMIT ? OFFSET ?
  `
    )
    .all(searchTerm, searchTerm, searchTerm, searchTerm, limit, offset);

  return { results, totalCount };
}

async function performSemanticSearch(query, limit, offset) {
  try {
    // Get all notes for AI analysis
    const allNotes = db
      .prepare(
        `
      SELECT n.id, n.title, n.slug, n.content, n.created_at, n.updated_at,
             GROUP_CONCAT(t.name) as tags
      FROM notes n
      LEFT JOIN note_tags nt ON n.id = nt.note_id
      LEFT JOIN tags t ON nt.tag_id = t.id
      GROUP BY n.id
      ORDER BY n.updated_at DESC
    `
      )
      .all();

    if (allNotes.length === 0) {
      return { results: [], totalCount: 0 };
    }

    // Create a prompt for semantic search
    const notesList = allNotes
      .map(
        (note, index) =>
          `${index + 1}. Title: "${note.title}"\n   Content: "${note.content.substring(0, 300)}..."\n   Tags: ${note.tags || "none"}\n   ID: ${note.id}`
      )
      .join("\n\n");

    const prompt = `Find the most relevant notes for this search query: "${query}"

Consider semantic meaning, context, and conceptual relationships, not just exact word matches.

Available Notes:
${notesList}

Please respond with the IDs of the most relevant notes (up to ${limit}), separated by commas, in order of relevance. Example: 5,12,8,3`;

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
      .slice(0, limit);

    // Get the suggested notes with their full details
    const results = allNotes.filter((note) => suggestedIds.includes(note.id));

    return { results, totalCount: results.length };
  } catch (error) {
    console.error("Semantic search error:", error);
    // Fallback to text search if semantic search fails
    return await performTextSearch(query, limit, offset);
  }
}
