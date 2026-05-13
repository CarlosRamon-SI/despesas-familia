type CategoryStyle = { color: string; bg: string }

const CATEGORY_COLORS: Record<string, CategoryStyle> = {
  "Alimentação":  { color: "#D97706", bg: "var(--amber-l)" },
  "Transporte":   { color: "#2563EB", bg: "var(--sky-l)" },
  "Moradia":      { color: "#4F46E5", bg: "var(--violet-l)" },
  "Saúde":        { color: "#DC2626", bg: "var(--rose-l)" },
  "Educação":     { color: "#059669", bg: "var(--emerald-l)" },
  "Lazer":        { color: "#7C3AED", bg: "var(--violet-l)" },
}

const INCOME_STYLE: CategoryStyle = { color: "#059669", bg: "var(--emerald-l)" }
const DEFAULT_STYLE: CategoryStyle = { color: "var(--text2)", bg: "var(--surface3)" }

export function getCategoryStyle(name: string, type: "EXPENSE" | "INCOME"): CategoryStyle {
  if (type === "INCOME") return INCOME_STYLE
  return CATEGORY_COLORS[name] ?? DEFAULT_STYLE
}
