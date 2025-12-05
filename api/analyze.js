export default async function handler(req, res) {
  // CORS
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
    return res.status(500).json({ error: "HF_TOKEN missing" });
  }

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
        body: JSON.stringify({ inputs: req.body.inputs || "" })
      }
    );

    const data = await hfResponse.json();

    if (!hfResponse.ok) {
      return res.status(hfResponse.status).json({
        error: "HF request failed",
        details: data
      });
    }

    // FIX: Your model returns nested arrays → extract properly
    let output = null;

    if (Array.isArray(data) && Array.isArray(data[0])) {
      // your exact format
      output = data[0][0];   // highest score is first element
    } else if (Array.isArray(data)) {
      output = data[0];
    } else {
      return res.status(500).json({
        error: "Unexpected HF response structure",
        raw: data
      });
    }

    // Map labels
    let mappedLabel =
      output.label === "LABEL_1" ? "phishing" :
      output.label === "LABEL_0" ? "safe" :
      "unknown";

    return res.status(200).json({
      label: mappedLabel,
      confidence: output.score,
      reason: "Model output parsed"
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }
}

