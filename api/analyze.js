export default async function handler(req, res) {
  // CORS FIX (MOST IMPORTANT)
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
          "Authorization": `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: req.body.text  // extension will send { text: "email text" }
        })
      }
    );

    const data = await hfResponse.json();

    return res.status(200).json({
      label: data[0].label,
      score: data[0].score
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

