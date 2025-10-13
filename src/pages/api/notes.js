import db from "../../lib/db.js";
import slugify from "slugify";

export async function POST({ request }) {
  try {
    const formData = await request.formData();
    const title = formData.get("title");
    const content = formData.get("content");
    const tags = formData.get("tags") || "";

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

    // Create slug from title
    const slug = slugify(title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });

    // Check if slug already exists
    const existingNote = db
      .prepare("SELECT id FROM notes WHERE slug = ?")
      .get(slug);
    if (existingNote) {
      return new Response(
        JSON.stringify({
          error: "A note with this title already exists",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Insert new note
    const result = db
      .prepare(
        `
      INSERT INTO notes (title, slug, content) 
      VALUES (?, ?, ?)
    `
      )
      .run(title, slug, content);

    const noteId = result.lastInsertRowid;

    // Handle tags if provided
    if (tags) {
      const tagList = tags
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0);

      for (const tagName of tagList) {
        // Insert or get tag
        let tag = db.prepare("SELECT id FROM tags WHERE name = ?").get(tagName);
        if (!tag) {
          const tagResult = db
            .prepare("INSERT INTO tags (name) VALUES (?)")
            .run(tagName);
          tag = { id: tagResult.lastInsertRowid };
        }

        // Link note to tag
        db.prepare(
          "INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)"
        ).run(noteId, tag.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        note: {
          id: noteId,
          title,
          slug,
          content,
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error saving note:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to save note",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page")) || 1;
    const limit = parseInt(url.searchParams.get("limit")) || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const totalCount = db
      .prepare("SELECT COUNT(*) as count FROM notes")
      .get().count;

    // Get notes with pagination
    const notes = db
      .prepare(
        `
      SELECT id, title, slug, content, created_at, updated_at 
      FROM notes 
      ORDER BY updated_at DESC 
      LIMIT ? OFFSET ?
    `
      )
      .all(limit, offset);

    return new Response(
      JSON.stringify({
        notes,
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
    console.error("Error fetching notes:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch notes",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function PUT({ request }) {
  try {
    const { id, title, content } = await request.json();

    if (!id || !title || !content) {
      return new Response(
        JSON.stringify({
          error: "ID, title and content are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update the note
    const result = db
      .prepare(
        `
      UPDATE notes 
      SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `
      )
      .run(title, content, id);

    if (result.changes === 0) {
      return new Response(
        JSON.stringify({
          error: "Note not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get the updated note
    const updatedNote = db.prepare("SELECT * FROM notes WHERE id = ?").get(id);

    return new Response(
      JSON.stringify({
        success: true,
        note: updatedNote,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating note:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to update note",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function DELETE({ request }) {
  try {
    const { id } = await request.json();

    if (!id) {
      return new Response(
        JSON.stringify({
          error: "Note ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Delete the note
    const result = db.prepare("DELETE FROM notes WHERE id = ?").run(id);

    if (result.changes === 0) {
      return new Response(
        JSON.stringify({
          error: "Note not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Note deleted successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error deleting note:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to delete note",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
