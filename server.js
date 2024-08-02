const express = require("express");
const textToSpeech = require("@google-cloud/text-to-speech");
const cors = require("cors");
const util = require("util");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const client = new textToSpeech.TextToSpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

app.post("/synthesize", async (req, res) => {
  const { text, voice, speed } = req.body;
  const request = {
    input: { text },
    voice: {
      languageCode: "en-US",
      ssmlGender: voice,
      name: voice === "FEMALE" ? "en-US-Studio-O" : "en-US-Studio-M",
    },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: speed,
    },
  };
  try {
    const [response] = await client.synthesizeSpeech(request);
    const outputFile = "output.mp3";
    console.log(`Audio content written to file: ${outputFile}`);
    res.set("Content-Type", "audio/mpeg");
    res.send(response.audioContent);
  } catch (error) {
    console.error("Error synthesizing speech:", error);
    res.status(500).send("Error synthesizing speech");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
