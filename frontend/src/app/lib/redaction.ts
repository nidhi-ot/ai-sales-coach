export function redactPII(text: string) {
  return text
    .replace(/\S+@\S+\.\S+/g, "[EMAIL]")
    .replace(/\+?\d[\d\s.-]{7,}\d/g, "[PHONE]");
}