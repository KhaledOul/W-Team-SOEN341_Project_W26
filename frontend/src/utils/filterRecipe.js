function toArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function normalizeString(s, caseSensitive) {
  if (s == null) return '';
  return caseSensitive ? String(s) : String(s).toLowerCase();
}


