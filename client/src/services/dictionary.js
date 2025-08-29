import axios from 'axios';

const cache = new Map();

export async function validateWord(word) {
  const key = word.toLowerCase();
  if (cache.has(key)) return cache.get(key);
  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`;
    const res = await axios.get(url, { timeout: 8000 });
    const valid = Array.isArray(res.data) && res.data.length > 0;
    cache.set(key, valid);
    return valid;
  } catch (err) {
    return false;
  }
}


