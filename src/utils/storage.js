// Quez App Lite - localStorage Utility

export const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Quez Storage: save failed', key, e);
  }
};

export const load = (key, fallback = null) => {
  try {
    const item = localStorage.getItem(key);
    return item !== null ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error('Quez Storage: load failed', key, e);
    return fallback;
  }
};

export const remove = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Quez Storage: remove failed', key, e);
  }
};

export const appendToList = (key, item) => {
  const current = load(key, []);
  current.push(item);
  save(key, current);
};

export const clearAll = () => {
  try {
    localStorage.clear();
  } catch (e) {
    console.error('Quez Storage: clearAll failed', e);
  }
};
