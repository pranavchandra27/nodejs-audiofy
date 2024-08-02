const express = require("express");
const textToSpeech = require("@google-cloud/text-to-speech");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

let googleApplicationCredentials;
try {
  googleApplicationCredentials = JSON.parse(
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  );
} catch (error) {
  console.error("Error parsing GOOGLE_APPLICATION_CREDENTIALS_JSON:", error);
  process.exit(1);
}

const client = new textToSpeech.TextToSpeechClient({
  credentials: googleApplicationCredentials,
});

app.post("/synthesize", async (req, res) => {
  const { text, voice } = req.body;
  const voiceName = voice === "FEMALE" ? "en-US-Studio-F" : "en-US-Studio-M";

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

module.exports = app;
