/** Généré par scaffold.mjs — copie typée de portfolio.config.json */
export const portfolioConfig = {
  "meta": {
    "name": "Thibaud Lescroart",
    "role": "Dévelopeur Junior"
  },
  "design": {
    "theme": "glass",
    "accentColor": "#f7c59f",
    "typography": "mono-hero"
  },
  "tech": {
    "framework": "nextjs",
    "renderer": "msdf-type",
    "stack": [
      "react",
      "tailwind",
      "node",
      "webgpu",
      "typescript",
      "nextjs",
      "wasm"
    ]
  },
  "content": {
    "projectOrga": "case",
    "sections": [
      "about",
      "projects",
      "lab",
      "blog",
      "contact",
      "hero"
    ]
  }
} as const;

export const accentColor = "#f7c59f" as const;
