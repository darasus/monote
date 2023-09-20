module.exports = {
  extends: ["next", "prettier"],
  settings: {
    next: {
      rootDir: ["./src/*/"],
    },
  },
  plugins: ["tailwindcss", "unused-imports"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "react/jsx-key": "off",
    "unused-imports/no-unused-imports": "warn",
  },
}
