import { get } from '@vercel/blob';

export default async function handler(req, res) {
  try {
    const { key } = req.query;

    const blob = await get(\data/\.json\, { token: process.env.BLOB_READ_WRITE_TOKEN });
    if (!blob) return res.status(404).json({ error: "Not found" });

    const text = await blob.text();
    return res.status(200).json(JSON.parse(text));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
