import { put } from '@vercel/blob';

export default async function handler(req, res) {
  try {
    let body = req.body;
    
    // Handle both string and object body
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    
    const { key, data } = body;

    if (!key || data === undefined) {
      return res.status(400).json({ error: "Missing key or data parameter" });
    }

    const blob = await put(
      `data/${key}.json`,
      JSON.stringify(data),
      { access: 'protected', token: process.env.BLOB_READ_WRITE_TOKEN }
    );

    return res.status(200).json({ success: true, url: blob.url });
  } catch (err) {
    console.error('PUT error:', err);
    return res.status(500).json({ error: err.message });
  }
}
