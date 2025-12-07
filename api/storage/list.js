import { list } from '@vercel/blob';

export default async function handler(req, res) {
  try {
    const blobs = await list({ prefix: "data/" });
    return res.status(200).json(blobs.blobs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
