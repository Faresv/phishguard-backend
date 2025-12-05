export default async function handler(req, res) {
  // ==== CORS HEADERS ====
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const HF_TOKEN = process.env.HF_TOKEN;
  if (!HF_TOKEN) {
    return res.status(500).json({
      error: "HF_TOKEN missing on server"
    });
  }

  const MODEL_ID = "mrm8488/bert-tiny-finetuned-sms-spam-detection";

  // 🟡 DEBUG: Show what Chrome extension is sending
  console.log("BODY RECEIVED:", req.body);

  const emailText = req.body.inputs || "";

  if (!emailText || emailText.trim() === "") {
    return res.status(400).json({
      error: "No email text received",
      received: req.body
    });
  }

  try {
    const hfResponse = await fetch(
      `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: emailText })
      }
    );

    const data = await hfResponse.json();

    if (!hfResponse.ok) {
      return res.status(hfResponse.status).json({
        error: "HF request failed",
        details: data
      });
    }

    const result = data[0];

    return res.status(200).json({
      label: result.label || "unknown",
      confidence: result.score || 0,
      reason: "Model output parsed"
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }
}

