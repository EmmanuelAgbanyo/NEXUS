import { put } from '@vercel/blob';

export default async function handler(req, res) {
  try {
    const { key, value } = JSON.parse(req.body);

    const blob = await put(
      \data/\.json\,
      JSON.stringify(value),
      { access: 'protected', token: process.env.BLOB_READ_WRITE_TOKEN }
    );

    return res.status(200).json({ success: true, url: blob.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
