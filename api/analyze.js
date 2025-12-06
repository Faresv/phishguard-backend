export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const HF_TOKEN = process.env.HF_TOKEN;
  const MODEL_ID = "mrm8488/bert-tiny-finetuned-sms-spam-detection";

  try {
    const hfResponse = await fetch(
      `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: req.body.text
        })
      }
    );

    const output = await hfResponse.json();

    // ❗ NEW: Extract proper label + score
    const result = output[0][0];

    return res.status(200).json({
      label: result.label,
      score: result.score,
      reason: "Model output parsed"
    });

  } catch (err) {
    return res.status(500).json({
      label: "unknown",
      score: null,
      reason: err.message
    });
  }
}
