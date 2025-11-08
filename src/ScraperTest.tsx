import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, CircularProgress } from '@mui/material';
import { scrapeRecipeFromUrl, ScrapedRecipe } from './recipeScraper';

const ScraperTest: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapedRecipe | null>(null);
  const [error, setError] = useState<string>('');

  const testScraper = async () => {
    if (!url.trim()) return;
    
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const recipe = await scrapeRecipeFromUrl(url);
      setResult(recipe);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testUrls = [
    'https://www.allrecipes.com/recipe/213742/cheesy-chicken-broccoli-casserole/',
    'https://www.foodnetwork.com/recipes/alton-brown/baked-macaroni-and-cheese-recipe-1939524',
    'https://www.tasteofhome.com/recipes/makeover-creamy-macaroni-and-cheese/'
  ];

  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>Recipe Scraper Test</Typography>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Recipe URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.allrecipes.com/recipe/..."
          sx={{ mb: 2 }}
        />
        <Button 
          variant="contained" 
          onClick={testScraper} 
          disabled={!url.trim() || loading}
          sx={{ mr: 2 }}
        >
          {loading ? <CircularProgress size={20} /> : 'Test Scraper'}
        </Button>
      </Box>

      <Typography variant="h6" gutterBottom>Quick Test URLs:</Typography>
      <Box sx={{ mb: 3 }}>
        {testUrls.map((testUrl, index) => (
          <Button
            key={index}
            variant="outlined"
            size="small"
            onClick={() => setUrl(testUrl)}
            sx={{ mr: 1, mb: 1 }}
          >
            Test URL {index + 1}
          </Button>
        ))}
      </Box>

      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#ffebee' }}>
          <Typography color="error">Error: {error}</Typography>
        </Paper>
      )}

      {result && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Scraped Recipe:</Typography>
          <Typography><strong>Title:</strong> {result.title}</Typography>
          <Typography><strong>Servings:</strong> {result.servings || 'Not specified'}</Typography>
          <Typography><strong>Image:</strong> {result.image ? 'Yes' : 'No'}</Typography>
          
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            <strong>Ingredients ({result.ingredients.length}):</strong>
          </Typography>
          <Box sx={{ pl: 2 }}>
            {result.ingredients.slice(0, 5).map((ingredient, index) => (
              <Typography key={index} variant="body2">• {ingredient}</Typography>
            ))}
            {result.ingredients.length > 5 && (
              <Typography variant="body2">... and {result.ingredients.length - 5} more</Typography>
            )}
          </Box>

          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            <strong>Instructions ({result.instructions.length}):</strong>
          </Typography>
          <Box sx={{ pl: 2 }}>
            {result.instructions.slice(0, 3).map((instruction, index) => (
              <Typography key={index} variant="body2">
                {index + 1}. {instruction.substring(0, 100)}...
              </Typography>
            ))}
            {result.instructions.length > 3 && (
              <Typography variant="body2">... and {result.instructions.length - 3} more steps</Typography>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default ScraperTest;