// Utils to save and load JSON from Vercel Blob

export async function saveToCloud(key, data) {
  const response = await fetch("/api/storage/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ key, data }),
  });

  const result = await response.json();
  return result;
}

export async function loadFromCloud(key) {
  const response = await fetch(`/api/storage/get?key=${key}`);
  const result = await response.json();
  return result;
}
