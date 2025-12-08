import { get } from '@vercel/blob';

export default async function handler(req, res) {
  try {
    const { key } = req.query;

    if (!key) {
      return res.status(400).json({ error: "Missing key parameter" });
    }

    const blobPathOrUrl = `data/${key}.json`;
    const blob = await get(blobPathOrUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
    
    if (!blob) {
      // Return empty array if blob doesn't exist
      return res.status(200).json([]);
    }

    // blob from Vercel is a web ReadableStream, need to get the text
    const response = await fetch(blob.url);
    if (!response.ok) {
      return res.status(200).json([]);
    }
    
    const text = await response.text();
    const data = JSON.parse(text);
    return res.status(200).json(data);
  } catch (err) {
    console.error('GET error:', err);
    // Return empty array on error instead of 500
    return res.status(200).json([]);
  }
}}
