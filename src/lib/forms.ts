export interface FormState {
  error?: string;
  message?: string;
  // What the user typed, sent back on error so the form keeps it
  // (React resets uncontrolled forms after every server action).
  values?: Record<string, string>;
}

export function echo(formData: FormData, omit: string[] = ["password"]): Record<string, string> {
  const values: Record<string, string> = {};
  formData.forEach((v, k) => {
    if (typeof v === "string" && !omit.includes(k) && !k.startsWith("$")) values[k] = v;
  });
  return values;
}

export function fail(error: string, formData: FormData): FormState {
  return { error, values: echo(formData) };
}
