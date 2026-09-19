import Anthropic from "@anthropic-ai/sdk";

interface TranscriptEntry {
  speaker: string;
  words: Array<{
    start: number;
    end: number;
    word: string;
  }>;
}

const SYSTEM_PROMPT_DESCRIPTION = `Given a detailed transcript of a meeting, generate a concise summary that captures the key points, decisions made, and action items, formatted in Markdown for better readability and organization. Note: Do NOT include a date in the response.`;

export async function summarizeTranscript(transcript: TranscriptEntry[]) {
  try {
    if (process.env.ANTHROPIC_API_KEY) {
      // new Anthropic() reads ANTHROPIC_API_KEY from the environment. Build it
      // here rather than at import time so the server still boots unconfigured.
      const anthropic = new Anthropic();
      const message = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL ?? "claude-opus-5",
        max_tokens: 16000,
        system: SYSTEM_PROMPT_DESCRIPTION,
        messages: [
          {
            role: "user",
            content: transcript
              .map(
                (entry: TranscriptEntry) =>
                  `${entry.speaker}: ${entry.words
                    .map((word) => word.word)
                    .join(" ")}`,
              )
              .join("\n"),
          },
        ],
      });

      // content is a ContentBlock[] discriminated union — narrow to text blocks.
      return message.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("");
    } else {
      return "Anthropic key is not set in Node JS.";
    }
  } catch (error) {
    console.error("Error summarizing transcript:", error);
    return null;
  }
}
