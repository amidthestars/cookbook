import { scrapeRecipeFromUrl } from './recipeScraper';

// Test URLs with known recipe structured data
const testUrls = [
  'https://www.allrecipes.com/recipe/213742/cheesy-chicken-broccoli-casserole/',
  'https://www.foodnetwork.com/recipes/alton-brown/baked-macaroni-and-cheese-recipe-1939524',
  'https://www.tasteofhome.com/recipes/makeover-creamy-macaroni-and-cheese/'
];

export const testRecipeScraper = async () => {
  console.log('🧪 Testing Recipe Scraper...\n');
  
  for (const url of testUrls) {
    try {
      console.log(`Testing: ${url}`);
      const recipe = await scrapeRecipeFromUrl(url);
      
      console.log('✅ Success!');
      console.log(`Title: ${recipe.title}`);
      console.log(`Ingredients: ${recipe.ingredients.length} items`);
      console.log(`Instructions: ${recipe.instructions.length} steps`);
      console.log(`Image: ${recipe.image ? 'Yes' : 'No'}`);
      console.log(`Servings: ${recipe.servings || 'Not specified'}`);
      console.log('---\n');
      
    } catch (error) {
      console.log('❌ Failed:', error);
      console.log('---\n');
    }
  }
};

// Run test if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - add to window for manual testing
  (window as any).testRecipeScraper = testRecipeScraper;
  console.log('Recipe scraper test available as window.testRecipeScraper()');
}