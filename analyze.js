// api/analyze.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const HF_TOKEN = process.env.HF_TOKEN;  // stored safely on server
  const MODEL_ID = "mrm8488/bert-tiny-finetuned-sms-spam-detection"; // working model

  try {
    const hfResponse = await fetch(
      `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(req.body)
      }
    );

    const text = await hfResponse.text();

    if (!hfResponse.ok) {
      return res.status(hfResponse.status).json({
        error: `HF error ${hfResponse.status}`,
        details: text
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: "Invalid JSON from HF", text });
    }

    return res.status(200).json({ result: parsed });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
