import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import LlamaAI from "llamaai";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const apiToken = process.env.LLAMA_API_KEY;
const llamaAPI = new LlamaAI(apiToken);

const googleApplicationCredentials = {
  type: process.env.GOOGLE_TYPE,
  project_id: process.env.GOOGLE_PROJECT_ID,
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_CLIENT_ID,
  auth_uri: process.env.GOOGLE_AUTH_URI,
  token_uri: process.env.GOOGLE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
};

const client = new TextToSpeechClient({
  credentials: googleApplicationCredentials,
});

app.get("/", (req, res) => {
  res.json({ app_name: "Audiofy server" });
});

// Route for content generation
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  const apiRequestJson = {
    messages: [{ role: "user", content: prompt }],
    stream: false,
  };

  try {
    const response = await llamaAPI.run(apiRequestJson);
    const generatedText = response.messages[0].content;
    res.json({ generatedText });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).send("Error generating content");
  }
});

app.post("/synthesize", async (req, res) => {
  const { text, voice } = req.body;
  const voiceName = voice === "FEMALE" ? "en-US-Studio-O" : "en-US-Studio-M";

  const request = {
    input: { text: text },
    voice: { languageCode: "en-US", ssmlGender: voice, name: voiceName },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: 1.0,
      pitch: 0.0,
      volumeGainDb: 0.0,
    },
  };

  try {
    const [response] = await client.synthesizeSpeech(request);
    res.set("Content-Type", "audio/mpeg");
    res.send(response.audioContent);
  } catch (error) {
    console.error("Error synthesizing speech:", error);
    res.status(500).send("Error synthesizing speech");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
