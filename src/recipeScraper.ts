export interface ScrapedRecipe {
  id: number;
  title: string;
  ingredients: string[];
  instructions: string[];
  image?: string;
  servings?: string;
  url?: string;
  pinned: boolean;
}

const flattenJson = (node: any): any[] => {
  if (!node) return [];
  if (Array.isArray(node)) {
    return node.flatMap(flattenJson);
  }
  if (typeof node === "object") {
    return [node, ...Object.values(node).flatMap(flattenJson)];
  }
  return [];
};

const extractInstructions = (raw: any): string[] => {
  if (!raw) return [];

  // If instructions is a string (some sites use this)
  if (typeof raw === "string") {
    return raw
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean);
  }

  // Typical case: array of steps
  if (Array.isArray(raw)) {
    return raw
      .flatMap((step: any) => {
        if (typeof step === "string") return step;
        if (step?.text) return step.text;
        // Nested HowToSection with itemListElement
        if (step.itemListElement) {
          return extractInstructions(step.itemListElement);
        }
        return [];
      })
      .map(s => s.trim())
      .filter(Boolean);
  }

  return [];
};

const extractIngredients = (item: any): string[] => {
  return (
    item.recipeIngredient ||
    item.ingredients ||
    []
  ).map((ing: any) => (typeof ing === "string" ? ing : "")).filter(Boolean);
};

export const scrapeRecipeFromUrl = async (url: string): Promise<ScrapedRecipe> => {
  if (!url.trim()) {
    throw new Error("URL is required");
  }

  try {
    // Use CORS proxy since this runs in the browser
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const data = await response.json();
    const html = data.contents;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const scripts = Array.from(
      doc.querySelectorAll('script[type="application/ld+json"]')
    );

    for (const script of scripts) {
      try {
        const jsonData = JSON.parse(script.textContent || "{}");
        const flat = flattenJson(jsonData);

        for (const item of flat) {
          const type = item["@type"];

          if (
            type === "Recipe" ||
            (Array.isArray(type) && type.includes("Recipe"))
          ) {
            return {
              id: Date.now(),
              title: item.name || doc.title || "Scraped Recipe",
              ingredients: extractIngredients(item),
              instructions: extractInstructions(item.recipeInstructions),
              image:
                typeof item.image === "string"
                  ? item.image
                  : Array.isArray(item.image)
                  ? item.image[0]
                  : "",
              servings: item.recipeYield || "",
              url: url,
              pinned: false,
            };
          }
        }
      } catch {
        // Skip bad JSON blocks silently
        continue;
      }
    }

    // ✅ Fallback with basic scraping
    const fallbackIngredients = Array.from(doc.querySelectorAll('li'))
      .map(li => li.textContent?.trim())
      .filter((text): text is string => text !== undefined && text !== null && (
        text.includes('cup') || text.includes('tsp') || text.includes('tbsp') ||
        text.includes('pound') || text.includes('oz') || text.includes('gram')
      ))
      .slice(0, 10);
    
    const fallbackInstructions = Array.from(doc.querySelectorAll('ol li, .instructions li, .directions li'))
      .map(li => li.textContent?.trim())
      .filter((text): text is string => text !== undefined && text !== null && text.length > 20)
      .slice(0, 8);

    return {
      id: Date.now(),
      title: doc.title || "Recipe from " + new URL(url).hostname,
      ingredients: fallbackIngredients.length > 0 ? fallbackIngredients : ['Add ingredients manually'],
      instructions: fallbackInstructions.length > 0 ? fallbackInstructions : ['Add instructions manually'],
      image: "",
      servings: "",
      url: url,
      pinned: false,
    };
  } catch (error) {
    console.error("Error scraping recipe:", error);
    throw new Error("Failed to scrape recipe. Please try manual entry.");
  }
};
