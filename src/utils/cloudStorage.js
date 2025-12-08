// Utils to save and load JSON from Vercel Blob

export async function saveToCloud(key, data) {
  try {
    const response = await fetch("/api/storage/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key, data }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Save failed with status ${response.status}: ${errorText}`);
      return { success: false, error: `Save failed: ${response.status}` };
    }

    const result = await response.json();
    return result;
  } catch (err) {
    console.error('Save error:', err);
    return { success: false, error: err.message };
  }
}

export async function loadFromCloud(key) {
  try {
    const response = await fetch(`/api/storage/get?key=${key}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Load failed with status ${response.status}: ${errorText}`);
      return null;
    }

    const result = await response.json();
    return result;
  } catch (err) {
    console.error('Load error:', err);
    return null;
  }
}
