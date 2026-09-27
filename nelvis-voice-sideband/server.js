const express = require("express");
const WebSocket = require("ws");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_PROJECT_ID = process.env.OPENAI_PROJECT_ID;
const SIDEBAND_SECRET = process.env.SIDEBAND_SECRET;

app.get("/", (_req, res) => {
  res.json({
    service: "nelvis-voice-sideband",
    status: "ok"
  });
});

app.post("/sideband/start", (req, res) => {
  const authorization = req.headers.authorization || "";

  if (!SIDEBAND_SECRET || authorization !== `Bearer ${SIDEBAND_SECRET}`) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const { call_id, greeting } = req.body || {};

  if (!call_id) {
    return res.status(400).json({ error: "call_id is required" });
  }

  console.log(`[SIDEBAND] Starting call ${call_id}`);

  startSideband(call_id, greeting).catch((error) => {
    console.error(`[SIDEBAND] Error for ${call_id}: ${error.message}`);
  });

  return res.status(202).json({
    status: "starting",
    call_id
  });
});

function startSideband(callId, customGreeting) {
  return new Promise((resolve, reject) => {
    if (!OPENAI_API_KEY || !OPENAI_PROJECT_ID) {
      return reject(new Error("Missing OpenAI environment variables"));
    }

    const url =
      `wss://api.openai.com/v1/realtime?call_id=${encodeURIComponent(callId)}`;

    const ws = new WebSocket(url, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Project": OPENAI_PROJECT_ID
      }
    });

    let opened = false;

    ws.on("open", () => {
      opened = true;
      console.log(`[SIDEBAND] Connected: ${callId}`);

      const greeting =
        customGreeting ||
        "Bonjour, vous êtes bien chez NELVIS. Comment puis-je vous aider ?";

      ws.send(JSON.stringify({
        type: "response.create",
        response: {
          instructions: `Dis immédiatement et naturellement : "${greeting}"`
        }
      }));

      resolve();
    });

    ws.on("message", (data) => {
      try {
        const event = JSON.parse(data.toString());
        console.log(`[SIDEBAND] ${callId} <- ${event.type}`);

        if (event.type === "error") {
          console.error("[SIDEBAND] OpenAI error:", JSON.stringify(event));
        }
      } catch {
        console.log("[SIDEBAND] Received non-JSON message");
      }
    });

    ws.on("close", (code, reason) => {
      console.log(
        `[SIDEBAND] Closed ${callId} - ${code} ${reason.toString()}`
      );
    });

    ws.on("error", (error) => {
      console.error(
        `[SIDEBAND] WebSocket error ${callId}: ${error.message}`
      );

      if (!opened) {
        reject(error);
      }
    });
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`NELVIS Voice Sideband listening on port ${PORT}`);
});
