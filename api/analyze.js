export default async function handler(req, res) {
  // ==== CORS FIX ====
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end(); // preflight request success
  }

  // ==== BLOCK NON-POST ====
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ==== ENV TOKEN ====
  const HF_TOKEN = process.env.HF_TOKEN;
  if (!HF_TOKEN) {
    return res.status(500).json({ error: "HF_TOKEN missing on server" });
  }

  // ==== MODEL ====
  const MODEL_ID = "mrm8488/bert-tiny-finetuned-sms-spam-detection";

  try {
    const hfResponse = await fetch(
      `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: req.body.inputs || ""
        })
      }
    );

    const data = await hfResponse.json();

    if (!hfResponse.ok) {
      return res.status(hfResponse.status).json({
        error: "HF request failed",
        details: data
      });
    }

    // Extract result
    const result = data[0];

    return res.status(200).json({
      label: result.label,
      confidence: result.score,
      reason: "Model output parsed"
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }
}
