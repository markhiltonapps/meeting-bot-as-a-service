import { Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";

// The Anthropic constructor throws when no key is configured, so build the
// client per request instead of at import time — an unconfigured key must
// degrade to a 503 on /api/chat, not stop the whole server from booting.
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  // Resolves ANTHROPIC_API_KEY from the environment.
  return new Anthropic();
}

export const chat = async (req: Request, res: Response) => {
  const { messages } = req.body as { messages: Anthropic.MessageParam[] };
  const systemPrompt =  "You are a helpful assistant named AI Meeting Bot. You will be given a context of a meeting and some meeting notes, you will answer questions based on the context."

  const anthropic = getClient();
  if (!anthropic) {
    return res
      .status(503)
      .json({ error: "ANTHROPIC_API_KEY is not set on the server." });
  }

  try {
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-opus-5",
      max_tokens: 16000,
      // The system prompt is a top-level field, not a message.
      system: systemPrompt,
      messages,
    });

    // content is a ContentBlock[] discriminated union — narrow to text blocks.
    const response = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");
    res.json({ response });
  } catch {
    res.status(500).send("Error completing chat request.");
  }
};
