const USERNAME_PATTERN = /^[A-Za-z0-9_-]{3,24}$/;

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function validateUsername(username: string) {
  const trimmed = username.trim();

  if (!USERNAME_PATTERN.test(trimmed)) {
    return "Use 3-24 letters, numbers, underscores, or hyphens.";
  }

  return null;
}
