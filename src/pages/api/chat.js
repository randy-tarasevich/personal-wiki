import { Ollama } from "ollama";
import db from "../../lib/db.js";

const ollama = new Ollama({
  host: "http://localhost:11434",
});

export async function POST({ request }) {
  try {
    const { message, model = "llama3:latest", sessionId } = await request.json();

    // Log the model being used for debugging
    console.log(`🤖 Using model: ${model}`);

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get current date and time
    const now = new Date();
    const currentDate = now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const currentTime = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

    // Handle conversation memory
    let conversationId = null;
    let conversationHistory = [];

    if (sessionId) {
      try {
        // Get or create conversation
        let conversation = db
          .prepare("SELECT id FROM chat_conversations WHERE session_id = ?")
          .get(sessionId);

        if (!conversation) {
          // Create new conversation
          const result = db
            .prepare("INSERT INTO chat_conversations (session_id) VALUES (?)")
            .run(sessionId);
          conversationId = result.lastInsertRowid;
        } else {
          conversationId = conversation.id;
        }

        // Get conversation history (last 10 messages to keep context manageable)
        conversationHistory = db
          .prepare(
            `
          SELECT role, content, created_at 
          FROM chat_messages 
          WHERE conversation_id = ? 
          ORDER BY created_at DESC 
          LIMIT 10
        `
          )
          .all(conversationId);

        // Reverse to get chronological order
        conversationHistory.reverse();
      } catch (error) {
        console.error("Error handling conversation memory:", error);
      }
    }

    // Fetch recent notes from the database
    let recentNotes = [];
    try {
      recentNotes = db
        .prepare(
          `
        SELECT n.id, n.title, n.slug, n.content, n.created_at, n.updated_at,
               GROUP_CONCAT(t.name) as tags
        FROM notes n
        LEFT JOIN note_tags nt ON n.id = nt.note_id
        LEFT JOIN tags t ON nt.tag_id = t.id
        GROUP BY n.id
        ORDER BY n.updated_at DESC
        LIMIT 10
      `
        )
        .all();
    } catch (error) {
      console.error("Error fetching notes for chat:", error);
    }

    // Format notes for the system prompt
    let notesContext = "";
    if (recentNotes.length > 0) {
      notesContext = "\n\nRecent notes in your personal wiki:\n";
      recentNotes.forEach((note, index) => {
        const tags = note.tags ? ` (Tags: ${note.tags})` : "";
        const contentPreview =
          note.content.length > 200
            ? note.content.substring(0, 200) + "..."
            : note.content;
        notesContext += `${index + 1}. **${note.title}**${tags}\n   Content: ${contentPreview}\n\n`;
      });
    }

    // Create system prompt with current context and notes
    const systemPrompt = `You are a helpful AI assistant for a personal wiki application. You have access to the current date and time, and can see the user's recent notes.

Current date: ${currentDate}
Current time: ${currentTime}${notesContext}

You can help users with:
- Answering questions about dates, times, and current information
- Referencing and discussing their notes
- Suggesting tags for their notes
- Finding related notes in their wiki
- General knowledge and assistance

Always be helpful and provide accurate information. You can reference the user's notes when relevant to their questions.`;

    // Build messages array with conversation history
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
    ];

    // Add conversation history
    conversationHistory.forEach((msg) => {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    });

    // Add current user message
    messages.push({
      role: "user",
      content: message,
    });

    // Add timeout and better error handling
    const response = await Promise.race([
      ollama.chat({
        model,
        messages,
        stream: false,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Ollama request timeout')), 30000)
      )
    ]);

    // Store messages in database if we have a conversation
    if (conversationId) {
      try {
        // Store user message
        db.prepare(
          `
          INSERT INTO chat_messages (conversation_id, role, content) 
          VALUES (?, 'user', ?)
        `
        ).run(conversationId, message);

        // Store assistant response
        db.prepare(
          `
          INSERT INTO chat_messages (conversation_id, role, content) 
          VALUES (?, 'assistant', ?)
        `
        ).run(conversationId, response.message.content);

        // Update conversation timestamp
        db.prepare(
          `
          UPDATE chat_conversations 
          SET updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `
        ).run(conversationId);
      } catch (error) {
        console.error("Error storing conversation messages:", error);
      }
    }

    return new Response(
      JSON.stringify({
        response: response.message.content,
        sessionId: sessionId || null,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Ollama API error:", error);
    
    // Provide more specific error messages
    let errorMessage = "Failed to get response from Ollama";
    if (error.message === 'Ollama request timeout') {
      errorMessage = "Request timed out. Please try again.";
    } else if (error.message.includes('ECONNREFUSED')) {
      errorMessage = "Ollama service is not running. Please check the server.";
    } else if (error.message.includes('model')) {
      errorMessage = `Model "${model}" not found. Please try a different model.`;
    }
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
