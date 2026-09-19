import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// handle env variable parsing
var root: string;
var client: string;

if (process.env?.NODE_ENV === "development") {
  var root = path.resolve(__dirname, "..", "..");
  var client = path.resolve(root, "client", "dist");

  dotenv.config({
    path: path.resolve(root, ".env"),
  });
} else {
  var root = path.resolve(__dirname, "..", "..", "..");
  var client = path.resolve(root, "client", "dist");

  dotenv.config({
    path: path.resolve(root, ".env"),
  });
}

import express, { Express, Request, Response } from "express";
import { checkEnvironmentVariables, listDatabases } from "./lib/utils";

import { Client } from "@notionhq/client";

import { runMigrations } from "./db/migrate";

import formRouter from "./routes/form";
import webhookRouter from "./routes/webhook";
import meetingsRouter from "./routes/meetings";
import meetingRouter from "./routes/meeting";
import chatRouter from "./routes/chat";

import cors from "cors";

const app: Express = express();

// SANITY CHWECK
// ENV variables
const missingEnvVars = checkEnvironmentVariables();
// NOTION DATABASES (easy source of error)
if (process.env.NOTION_API_KEY) {
  try {
    const notion = new Client({ auth: process.env.NOTION_API_KEY });
    listDatabases(notion);
  } catch {
    console.log("⚠️ Could not access Notion.");
  }
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("trust proxy", 1); // trust first proxy
app.use(cors());

// The client is deployed separately (Vercel) in the hosted setup, so its build
// output is only present when the whole app is served from one box.
const clientIndex = path.join(client, "index.html");
const hasClientBuild = fs.existsSync(clientIndex);

if (hasClientBuild) {
  app.use(express.static(path.join(client)));
} else {
  console.log(
    `[server]: no client build at ${client} — serving the API only.`,
  );
}

const health = (_req: Request, res: Response) => res.status(200).send("OK");

app.get("/health", health);
// The client probes /api/health to decide between server and IndexedDB mode.
app.get("/api/health", health);

app.use("/api/meetings", meetingsRouter);
app.use("/api/meeting", meetingRouter);

app.use("/api/chat", chatRouter);

app.use("/api/join", formRouter);
app.use("/api/webhook", webhookRouter);

// Unknown /api routes must not fall through to the SPA shell.
app.use("/api", (_req: Request, res: Response) =>
  res.status(404).json({ error: "Not found" }),
);

app.use((req, res) => {
  if (!hasClientBuild) {
    return res.status(404).json({ error: "Not found" });
  }
  res.sendFile(clientIndex);
});

const PORT = Number(process.env.PORT || 3080);
const HOST = process.env.HOST || "0.0.0.0";

async function start() {
  try {
    await runMigrations();
  } catch (error) {
    // A broken database should not stop the API from answering /api/health,
    // which is what tells the client the backend is reachable at all.
    console.error("[db]: migrations did not run:", error);
  }

  app.listen(PORT, HOST, () => {
    const url = `http://localhost:${PORT}`;
    console.log(
      `\n\n[server]: 🟢🟢 Server is running at \u001b]8;;${url}\u001b\\${url}\u001b]8;;\u001b\\ 🟢🟢`,
    );
  });
}

start();
