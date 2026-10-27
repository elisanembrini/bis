const svg = (background: string, accent: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><rect width="640" height="480" fill="${background}"/><circle cx="320" cy="240" r="150" fill="${accent}"/></svg>`,
  )}`;

export const dishImage = svg("#f4e3c1", "#d9480f");
export const stepImage = svg("#e6f4ea", "#2b8a3e");
