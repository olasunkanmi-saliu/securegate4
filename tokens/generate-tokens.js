#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const COLOR_INPUT = path.join(__dirname, "color-tokens.json");
const TYPOGRAPHY_INPUT = path.join(__dirname, "design-tokens.tokens.json");
const OUTPUT = path.join(__dirname, "design-tokens.css");

const toKebab = (str) =>
  String(str)
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .toLowerCase();

const resolveRef = (ref, root) => {
  const path = ref.slice(1, -1).split(".");
  let node = root;
  for (const key of path) {
    if (node == null) return undefined;
    node = node[key];
  }
  return node;
};

const isRef = (v) => typeof v === "string" && v.startsWith("{") && v.endsWith("}");

const buildColorVars = (roleSet, colorRoot) => {
  const lines = [];
  for (const [name, value] of Object.entries(roleSet)) {
    const resolved = isRef(value) ? resolveRef(value, colorRoot) : value;
    if (resolved == null) {
      console.warn(`  ! unresolved color role: ${name} -> ${value}`);
      continue;
    }
    lines.push(`  --color-${toKebab(name)}: ${resolved};`);
  }
  return lines;
};

const PX_TO_REM = (px) => {
  const rem = px / 16;
  return `${Number.isInteger(rem) ? rem : parseFloat(rem.toFixed(4))}rem`;
};

const formatTypographyValue = (prop, raw) => {
  switch (prop) {
    case "fontSize":
    case "lineHeight":
    case "paragraphIndent":
    case "paragraphSpacing":
      return PX_TO_REM(raw);
    case "letterSpacing":
      return `${raw}px`;
    case "fontWeight":
      return String(raw);
    case "fontFamily":
      return `"${raw}"`;
    default:
      return String(raw);
  }
};

const TYPO_PROP_SUFFIX = {
  fontSize: "size",
  lineHeight: "line-height",
  letterSpacing: "letter-spacing",
  fontFamily: "family",
  fontWeight: "weight",
  fontStyle: "style",
  fontStretch: "stretch",
  paragraphIndent: "paragraph-indent",
  paragraphSpacing: "paragraph-spacing",
  textCase: "text-case",
  textDecoration: "text-decoration",
};

const buildTypographyVars = (typography) => {
  const lines = [];
  for (const [scale, weights] of Object.entries(typography)) {
    for (const [weight, props] of Object.entries(weights)) {
      lines.push(`  /* ${scale} / ${weight} */`);
      for (const [prop, entry] of Object.entries(props)) {
        const suffix = TYPO_PROP_SUFFIX[prop];
        if (!suffix) continue;
        const value = formatTypographyValue(prop, entry.value);
        lines.push(`  --font-${toKebab(scale)}-${weight}-${suffix}: ${value};`);
      }
    }
  }
  return lines;
};

const buildFlatVars = (obj, prefix) => {
  if (!obj) return [];
  const lines = [];
  for (const [name, value] of Object.entries(obj)) {
    lines.push(`  --${prefix}-${toKebab(name)}: ${value};`);
  }
  return lines;
};

const buildRoleTokens = () => {
  const lines = [];

  lines.push("  /* Semantic tokens */");
  lines.push("  --surface-primary: var(--color-surface);");
  lines.push("  --surface-secondary: var(--color-surface-variant);");
  lines.push("  --surface-inverse: var(--color-inverse-surface);");
  lines.push("  --text-primary: var(--color-on-surface);");
  lines.push("  --text-secondary: var(--color-on-surface-variant);");
  lines.push("  --text-muted: var(--color-outline);");
  lines.push("  --text-placeholder: var(--color-outline-variant);");
  lines.push("  --border-default: var(--color-outline);");
  lines.push("  --brand-primary: var(--color-primary);");
  lines.push("  --success: var(--color-tertiary);");
  lines.push("  --error: var(--color-error);");
  lines.push("  --warning: hsl(38, 92%, 50%);");
  lines.push("  --info: var(--color-secondary);");

  lines.push("");
  lines.push("  /* Role tokens */");

  lines.push("  /* Button roles */");
  lines.push("  --btn-primary-bg: var(--color-primary);");
  lines.push("  --btn-primary-text: var(--color-on-primary);");
  lines.push("  --btn-primary-hover: var(--color-primary-container);");
  lines.push("  --btn-primary-disabled-bg: var(--color-surface-variant);");
  lines.push("  --btn-primary-disabled-text: var(--color-on-surface-variant);");

  lines.push("  /* Input roles */");
  lines.push("  --input-bg: var(--color-surface);");
  lines.push("  --input-text: var(--color-on-surface);");
  lines.push("  --input-placeholder: var(--color-on-surface-variant);");
  lines.push("  --input-border: var(--color-outline);");
  lines.push("  --input-border-hover: var(--color-on-surface);");
  lines.push("  --input-border-focus: var(--color-primary);");
  lines.push("  --input-border-error: var(--color-error);");
  lines.push("  --input-border-success: var(--color-tertiary);");
  lines.push("  --input-focus-ring: var(--color-primary-container);");
  lines.push("  --input-error-ring: var(--color-error-container);");
  lines.push("  --input-label: var(--color-on-surface-variant);");
  lines.push("  --input-error-text: var(--color-error);");
  lines.push("  --input-success-text: var(--color-tertiary);");

  lines.push("  /* Card roles */");
  lines.push("  --card-bg: var(--color-surface-container-low);");
  lines.push("  --card-border: var(--color-outline-variant);");

  lines.push("  /* Nav roles */");
  lines.push("  --nav-bg: var(--color-surface-container);");
  lines.push("  --nav-text: var(--color-on-surface);");
  lines.push("  --nav-active: var(--color-primary);");

  lines.push("  /* Password strength roles */");
  lines.push("  --strength-track: var(--color-surface-container-highest);");
  lines.push("  --strength-weak: var(--color-error);");
  lines.push("  --strength-fair: hsl(38, 92%, 50%);");
  lines.push("  --strength-strong: var(--color-tertiary);");
  lines.push("  --strength-label: var(--color-on-surface-variant);");

  lines.push("  /* Link roles */");
  lines.push("  --link-default: var(--color-primary);");
  lines.push("  --link-hover: var(--color-secondary);");

  lines.push("  /* Alert roles */");
  lines.push("  --alert-success-bg: var(--color-tertiary-container);");
  lines.push("  --alert-success-border: var(--color-tertiary);");
  lines.push("  --alert-success-text: var(--color-on-tertiary-container);");
  lines.push("  --alert-success-icon: var(--color-tertiary);");
  lines.push("  --alert-error-bg: var(--color-error-container);");
  lines.push("  --alert-error-border: var(--color-error);");
  lines.push("  --alert-error-text: var(--color-on-error-container);");
  lines.push("  --alert-error-icon: var(--color-error);");
  lines.push("  --alert-warning-bg: hsl(40, 100%, 90%);");
  lines.push("  --alert-warning-border: hsl(38, 92%, 50%);");
  lines.push("  --alert-warning-text: hsl(38, 80%, 30%);");
  lines.push("  --alert-warning-icon: hsl(38, 92%, 50%);");
  lines.push("  --alert-info-bg: var(--color-secondary-container);");
  lines.push("  --alert-info-border: var(--color-secondary);");
  lines.push("  --alert-info-text: var(--color-on-secondary-container);");
  lines.push("  --alert-info-icon: var(--color-secondary);");

  lines.push("  /* Overlay roles */");
  lines.push("  --overlay-scrim: rgba(0, 0, 0, 0.5);");

  lines.push("  /* Badge roles */");
  lines.push("  --badge-bg: var(--color-primary-container);");
  lines.push("  --badge-text: var(--color-on-primary-container);");

  lines.push("  /* Divider roles */");
  lines.push("  --divider-border: var(--color-outline-variant);");

  lines.push("  /* Tooltip roles */");
  lines.push("  --tooltip-bg: var(--color-inverse-surface);");
  lines.push("  --tooltip-text: var(--color-inverse-on-surface);");

  lines.push("  /* Skeleton roles */");
  lines.push("  --skeleton-bg: var(--color-surface-container-highest);");
  lines.push("  --skeleton-shimmer: var(--color-surface-bright);");

  lines.push("");
  lines.push("  /* Typography shorthand */");
  lines.push("  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;");
  lines.push("  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;");
  lines.push("  --font-size-xs: 0.75rem;");
  lines.push("  --font-size-sm: 0.875rem;");
  lines.push("  --font-size-base: 1rem;");
  lines.push("  --font-size-lg: 1.25rem;");
  lines.push("  --font-size-xl: 1.75rem;");
  lines.push("  --font-weight-regular: 400;");
  lines.push("  --font-weight-medium: 500;");
  lines.push("  --line-height-body: 1.5;");
  lines.push("  --line-height-heading: 1.2;");

  lines.push("");
  lines.push("  /* Shadow tokens */");
  lines.push("  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);");
  lines.push("  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);");
  lines.push("  --shadow-focus: 0 0 0 3px var(--color-primary-container);");
  lines.push("  --shadow-error: 0 0 0 3px var(--color-error-container);");

  return lines;
};

const colorJson = JSON.parse(fs.readFileSync(COLOR_INPUT, "utf8"));
const typographyJson = JSON.parse(fs.readFileSync(TYPOGRAPHY_INPUT, "utf8"));

const lightLines = buildColorVars(colorJson.color.role.light, colorJson);
const darkLines = buildColorVars(colorJson.color.role.dark, colorJson);
const typographyLines = buildTypographyVars(typographyJson.typography);
const spacingLines = buildFlatVars(typographyJson.spacing, "space");
const radiusLines = buildFlatVars(typographyJson.radius, "radius");
const widthLines = buildFlatVars(typographyJson.width, "width");
const transitionLines = buildFlatVars(
  typographyJson.transitions || typographyJson.transition,
  "transition"
);
const containerLines = buildFlatVars(typographyJson.container, "container");
const contentLines = buildFlatVars(typographyJson.content, "content");
const roleLines = buildRoleTokens();

const out = [
  "/* Generated from color-tokens.json and design-tokens.tokens.json. Do not edit by hand. */",
  "",
  ":root {",
  "  /* Color roles - light */",
  ...lightLines,
  "",
  "  /* Typography */",
  ...typographyLines,
  "",
  "  /* Spacing */",
  ...spacingLines,
  "",
  "  /* Radius */",
  ...radiusLines,
  "",
  "  /* Width */",
  ...widthLines,
  "",
  "  /* Transition */",
  ...transitionLines,
  "",
  "  /* Container */",
  ...containerLines,
  "",
  "  /* Content */",
  ...contentLines,
  "",
  ...roleLines,
  "}",
  "",
  "[data-theme=\"dark\"] {",
  "  /* Color roles - dark */",
  ...darkLines,
  "}",
  "",
].join("\n");

fs.writeFileSync(OUTPUT, out);
const count = (arr) => arr.filter((l) => l.startsWith("  --")).length;
console.log(
  `Wrote ${OUTPUT}\n` +
    `  ${lightLines.length} light roles, ${darkLines.length} dark roles\n` +
    `  ${count(typographyLines)} typography, ${spacingLines.length} spacing, ${radiusLines.length} radius\n` +
    `  ${widthLines.length} width, ${transitionLines.length} transition, ${containerLines.length} container, ${contentLines.length} content\n` +
  `  ${roleLines.length} role/semantic tokens`
);
