// serverState.js - Server-side state management for islands

export class ServerStateManager {
  constructor() {
    this.states = new Map();
  }

  static getInstance() {
    if (!ServerStateManager.instance) {
      ServerStateManager.instance = new ServerStateManager();
    }
    return ServerStateManager.instance;
  }

  getState(islandId) {
    const state = this.states.get(islandId);
    return state ? state.data : {};
  }

  setState(islandId, data) {
    this.states.set(islandId, {
      id: islandId,
      data,
      lastUpdated: Date.now(),
    });
  }

  updateState(islandId, updates) {
    const currentState = this.getState(islandId);
    this.setState(islandId, { ...currentState, ...updates });
  }

  clearState(islandId) {
    this.states.delete(islandId);
  }

  // Clean up old states (older than 1 hour)
  cleanup() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [id, state] of this.states.entries()) {
      if (state.lastUpdated < oneHourAgo) {
        this.states.delete(id);
      }
    }
  }
}

// Helper function to handle server actions
export async function handleIslandAction(islandId, action, formData) {
  const stateManager = ServerStateManager.getInstance();
  const currentState = stateManager.getState(islandId);

  switch (action) {
    case "chat":
      return await handleChatAction(islandId, formData, currentState);
    case "clear":
      return await handleClearAction(islandId);
    case "changeModel":
      return await handleModelChange(islandId, formData, currentState);
    default:
      return currentState;
  }
}

async function handleChatAction(islandId, formData, currentState) {
  const message = formData.get("message");
  const model = formData.get("model");

  if (!message || !model) {
    return { ...currentState, error: "Message and model are required" };
  }

  try {
    // Call Ollama API
    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, model }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();

    // Update state with new messages
    const messages = currentState.messages || [];
    const newMessages = [
      ...messages,
      { role: "user", content: message, timestamp: Date.now() },
      { role: "assistant", content: data.response, timestamp: Date.now() },
    ];

    const stateManager = ServerStateManager.getInstance();
    const newState = {
      ...currentState,
      messages: newMessages,
      error: null,
      lastMessage: message,
    };

    stateManager.setState(islandId, newState);
    return newState;
  } catch (error) {
    console.error("Chat action error:", error);
    return {
      ...currentState,
      error:
        "Failed to get response from Ollama. Make sure Ollama is running on localhost:11434",
    };
  }
}

async function handleClearAction(islandId) {
  const stateManager = ServerStateManager.getInstance();
  const newState = {
    messages: [],
    error: null,
    lastMessage: null,
  };

  stateManager.setState(islandId, newState);
  return newState;
}

async function handleModelChange(islandId, formData, currentState) {
  const model = formData.get("model");

  const stateManager = ServerStateManager.getInstance();
  const newState = {
    ...currentState,
    selectedModel: model,
    error: null,
  };

  stateManager.setState(islandId, newState);
  return newState;
}
