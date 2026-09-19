export function checkEnvironmentVariables(): string[] {
  const requiredEnvVars = [
    "ANTHROPIC_API_KEY",
    "NOTION_API_KEY",
    "DATABASE_ID",
    "BASS_API_KEY",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length > 0) {
    console.warn(
      "⚠️ Warning: The following required environment variables are not set:",
    );
    missingVars.forEach((varName) => console.warn(`\t‼️ - ${varName}`));
    console.warn(
      "Please set these variables in your .env file or environment.",
      "\n\t- ANTHROPIC_MODEL defaults to claude-opus-5.",
      "\n\t- BASS_API_KEY can be set manually in the form.",
    );
  }

  return missingVars;
}
