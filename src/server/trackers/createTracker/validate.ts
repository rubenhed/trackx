export function validateName(name: string) {
  const trimmed = name.trim();

  if (!trimmed) throw new Error("Name is required");
  if (trimmed.length > 100) throw new Error("Name too long");

  return trimmed;
}
