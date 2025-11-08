import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Card, CardContent, Button, 
  TextField, Box, Fab, Dialog, DialogTitle, 
  DialogContent, DialogActions, Chip, IconButton,
  Slider, List, ListItem, ListItemText, Tabs, Tab, Checkbox, ThemeProvider, createTheme
} from '@mui/material';
import { Add, Delete, PushPin, PushPinOutlined, Restaurant, Close, Edit, PhotoCamera, FileUpload, FileDownload } from '@mui/icons-material';
import { Grid } from '@mui/material';
import { scrapeRecipeFromUrl } from './recipeScraper';

interface Recipe {
  id: number;
  title: string;
  ingredients: string[];
  instructions: string[];
  image?: string;
  servings?: string;
  url?: string;
  notes?: string;
  pinned: boolean;
}

// Simple hash-based auth - password is hashed client-side
const ADMIN_PASSWORD_HASH = '1ed8988d8b366154376a378ecf2d4c271baccec00d73c563c5dc1a39b8b8a691'; // SHA-256 of your password

const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const theme = createTheme({
  palette: {
    primary: {
      main: '#D81B60', // Dark pink
    },
  },
});

function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginOpen, setLoginOpen] = useState(true);
  

  const [password, setPassword] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [portionMultiplier, setPortionMultiplier] = useState(1);
  const [addTab, setAddTab] = useState(0);
  const [url, setUrl] = useState('');
  const [checkedIngredients, setCheckedIngredients] = useState<{[key: string]: boolean}>({});
  const [newRecipe, setNewRecipe] = useState({
    title: '',
    ingredients: [''],
    instructions: [''],
    image: '',
    servings: '',
    url: '',
    notes: ''
  });

  const loadDefaultRecipes = async () => {
    try {
      const response = await fetch(process.env.PUBLIC_URL + '/recipes.json');
      const defaultRecipes = await response.json();
      setRecipes(defaultRecipes);
      // Save default recipes to localStorage for guests
      localStorage.setItem('recipes', JSON.stringify(defaultRecipes));
    } catch (error) {
      console.error('Failed to load default recipes:', error);
      setRecipes([]);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('recipes');
    if (saved) {
      setRecipes(JSON.parse(saved));
    } else {
      // Load default recipes from public/recipes.json
      loadDefaultRecipes();
    }
    
    const auth = localStorage.getItem('auth');
    if (auth) {
      const authData = JSON.parse(auth);
      if (Date.now() - authData.timestamp < 30 * 24 * 60 * 60 * 1000) {
        setIsAdmin(authData.role === 'admin');
        setLoginOpen(false);
      }
    }
  }, []);

  // Debug state
  useEffect(() => {
    console.log('Dialog states - loginOpen:', loginOpen, 'addOpen:', addOpen, 'viewOpen:', viewOpen, 'editOpen:', editOpen);
  }, [loginOpen, addOpen, viewOpen, editOpen]);

  // Controlled pinned recipe auto-open
  useEffect(() => {
    if (!loginOpen && recipes.length > 0 && !viewOpen) {
      const pinned = recipes.find(r => r.pinned);
      if (pinned) {
        setSelectedRecipe(pinned);
        setPortionMultiplier(1);
        setCheckedIngredients({});
        setViewOpen(true);
      }
    }
  }, [recipes, loginOpen]);

  // Force logout function
  const forceLogout = () => {
    console.log('Force logout triggered');
    localStorage.removeItem('auth'); // Only remove auth, keep recipes
    setIsAdmin(false);
    setLoginOpen(true);
    setAddOpen(false);
    setViewOpen(false);
    setEditOpen(false);
  };

  // Force close all dialogs
  const closeAllDialogs = () => {
    setLoginOpen(false);
    setAddOpen(false);
    setViewOpen(false);
    setEditOpen(false);
    setSelectedRecipe(null);
    setEditingRecipe(null);
  };

  // Emergency dialog close and keyboard shortcuts
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      console.log('Click detected on:', e.target);
      console.log('Element classes:', (e.target as Element)?.className);
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+L to logout
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        forceLogout();
      }
      // Ctrl+Shift+C to close all dialogs
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        closeAllDialogs();
      }
      // Escape to close all dialogs
      if (e.key === 'Escape') {
        closeAllDialogs();
      }
    };
    
    // Emergency close for mobile - triple tap anywhere to close all dialogs
    let tapCount = 0;
    let tapTimer: NodeJS.Timeout;
    const handleTripleTap = () => {
      tapCount++;
      if (tapCount === 1) {
        tapTimer = setTimeout(() => {
          tapCount = 0;
        }, 1000);
      } else if (tapCount === 3) {
        clearTimeout(tapTimer);
        tapCount = 0;
        if (loginOpen || addOpen || editOpen || viewOpen) {
          closeAllDialogs();
          console.log('Emergency close triggered by triple tap');
        }
      }
    };
    
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('touchend', handleTripleTap);
    
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('touchend', handleTripleTap);
      if (tapTimer) clearTimeout(tapTimer);
    };
  }, [loginOpen, addOpen, editOpen, viewOpen]);

  const saveRecipes = (newRecipes: Recipe[]) => {
    setRecipes(newRecipes);
    localStorage.setItem('recipes', JSON.stringify(newRecipes));
    // Create backup
    localStorage.setItem('recipes_backup', JSON.stringify(newRecipes));
  };



  const exportRecipes = () => {
    const dataStr = JSON.stringify(recipes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'recipes.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importRecipes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedRecipes = JSON.parse(e.target?.result as string);
          if (Array.isArray(importedRecipes)) {
            saveRecipes(importedRecipes);
            alert('Recipes imported successfully!');
          } else {
            alert('Invalid recipe file format.');
          }
        } catch (error) {
          alert('Error reading recipe file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const login = async (asAdmin: boolean) => {
    if (asAdmin) {
      const hashedInput = await hashPassword(password);
      if (hashedInput !== ADMIN_PASSWORD_HASH) return;
    }
    
    const authData = { role: asAdmin ? 'admin' : 'guest', timestamp: Date.now() };
    localStorage.setItem('auth', JSON.stringify(authData));
    setIsAdmin(asAdmin);
    setLoginOpen(false);
    setPassword('');
  };

  const addRecipe = () => {
    const recipe: Recipe = {
      id: Date.now(),
      title: newRecipe.title,
      ingredients: newRecipe.ingredients.filter(i => i.trim()),
      instructions: newRecipe.instructions.filter(i => i.trim()),
      image: newRecipe.image,
      servings: newRecipe.servings,
      url: newRecipe.url,
      notes: newRecipe.notes,
      pinned: false
    };
    saveRecipes([...recipes, recipe]);
    setNewRecipe({ title: '', ingredients: [''], instructions: [''], image: '', servings: '', url: '', notes: '' });
    setImagePreview('');
    setUrl('');
    setAddTab(0);
    setAddOpen(false);
  };

  const scrapeRecipe = async () => {
    if (!url.trim()) return;
    
    try {
      const recipe = await scrapeRecipeFromUrl(url);
      saveRecipes([...recipes, recipe]);
      setUrl('');
      setAddTab(0);
      setAddOpen(false);
    } catch (error) {
      console.error('Error scraping recipe:', error);
      alert('Failed to scrape recipe. Please try manual entry.');
    }
  };

  const togglePin = (id: number) => {
    const updated = recipes.map(r => ({ ...r, pinned: r.id === id ? !r.pinned : false }));
    saveRecipes(updated);
    
    // Update selectedRecipe if it's the one being toggled
    if (selectedRecipe && selectedRecipe.id === id) {
      setSelectedRecipe({ ...selectedRecipe, pinned: !selectedRecipe.pinned });
    }
  };

  const deleteRecipe = (id: number) => {
    const recipe = recipes.find(r => r.id === id);
    if (recipe && window.confirm(`Are you sure you want to delete "${recipe.title}"?`)) {
      saveRecipes(recipes.filter(r => r.id !== id));
      setViewOpen(false);
    }
  };

  // Dialog close handlers
  const handleCloseAddDialog = () => {
    setAddOpen(false);
    setNewRecipe({ title: '', ingredients: [''], instructions: [''], image: '', servings: '', url: '', notes: '' });
    setImagePreview('');
    setUrl('');
    setAddTab(0);
  };

  const handleCloseEditDialog = () => {
    setEditOpen(false);
    setEditingRecipe(null);
    setNewRecipe({ title: '', ingredients: [''], instructions: [''], image: '', servings: '', url: '', notes: '' });
    setImagePreview('');
  };

  const handleCloseViewDialog = () => {
    setViewOpen(false);
    setSelectedRecipe(null);
    setCheckedIngredients({});
  };

  const editRecipe = (recipe: Recipe) => {
    // Safety guard: close other dialogs first
    if (addOpen || viewOpen) {
      setAddOpen(false);
      setViewOpen(false);
    }
    
    setEditingRecipe(recipe);
    setNewRecipe({
      title: recipe.title,
      ingredients: [...recipe.ingredients],
      instructions: [...recipe.instructions],
      image: recipe.image || '',
      servings: recipe.servings || '',
      url: recipe.url || '',
      notes: recipe.notes || ''
    });
    setImagePreview(recipe.image || '');
    setEditOpen(true);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 1MB)
      if (file.size > 1024 * 1024) {
        alert('Image too large. Please choose an image smaller than 1MB.');
        return;
      }

      // Create canvas for compression
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 400px width/height)
        const maxSize = 400;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        
        setNewRecipe({ ...newRecipe, image: compressedDataUrl });
        setImagePreview(compressedDataUrl);
      };
      
      // Read file as data URL for the image element
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const saveEditedRecipe = () => {
    if (!editingRecipe) return;
    
    const updatedRecipe = {
      ...editingRecipe,
      title: newRecipe.title,
      ingredients: newRecipe.ingredients.filter(i => i.trim()),
      instructions: newRecipe.instructions.filter(i => i.trim()),
      image: newRecipe.image,
      servings: newRecipe.servings,
      url: newRecipe.url,
      notes: newRecipe.notes
    };
    
    const updatedRecipes = recipes.map(r => 
      r.id === editingRecipe.id ? updatedRecipe : r
    );
    
    saveRecipes(updatedRecipes);
    
    // Clear all form state
    setNewRecipe({ title: '', ingredients: [''], instructions: [''], image: '', servings: '', url: '', notes: '' });
    setImagePreview('');
    setEditingRecipe(null);
    
    // Force close edit dialog
    setEditOpen(false);
    
    // If this was the selected recipe, update it
    if (selectedRecipe && selectedRecipe.id === editingRecipe.id) {
      setSelectedRecipe(updatedRecipe);
    }
  };

  const adjustIngredient = (ingredient: string) => {
    if (portionMultiplier === 1) return ingredient;
    return ingredient.replace(/(\d+(?:\.\d+)?)/g, (match) => {
      const num = parseFloat(match);
      const adjusted = num * portionMultiplier;
      return adjusted % 1 === 0 ? adjusted.toString() : adjusted.toFixed(1);
    });
  };

  const pinnedRecipe = recipes.find(r => r.pinned);
  const otherRecipes = recipes.filter(r => !r.pinned);



  return (
    <ThemeProvider theme={theme}>
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: '#FFC5D3',
      py: 4,
      pointerEvents: 'auto'
    }}>
    <Container maxWidth="lg">
      {/* Login Dialog */}
      <Dialog 
        open={loginOpen} 
        onClose={() => setLoginOpen(false)}
        PaperProps={{ sx: { borderRadius: 4, p: 2 } }} 
        disableEscapeKeyDown={false}
      >
        <DialogTitle>COOKBOOK</DialogTitle>
        <IconButton
          onClick={() => setLoginOpen(false)}
          sx={{ 
            position: 'absolute', 
            right: 8, 
            top: 8, 
            zIndex: 9999,
            backgroundColor: 'rgba(255,255,255,0.9)',
            '&:hover': { backgroundColor: 'rgba(255,255,255,1)' },
            border: '1px solid #ccc'
          }}
        >
          <Close sx={{ color: 'black' }} />
        </IconButton>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              type="password"
              label="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button fullWidth variant="contained" onClick={() => login(true)} disabled={!password} className="primary-button">
              Login as Admin
            </Button>
          </Box>
          <Button fullWidth variant="outlined" onClick={() => login(false)} className="secondary-button">
            Browse as Guest
          </Button>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 1,
        p: 3
      }}>
        <Typography 
          variant="h3" 
          className="main-title"
          sx={{
            fontSize: { xs: '2rem', sm: '3rem' }
          }}
        >
          COOKBOOK
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ color: 'black' }}>
            {isAdmin ? 'ADMIN MODE' : 'GUEST MODE'}
          </Typography>
          <Button 
            onClick={forceLogout}
            variant="outlined"
            className="secondary-button"
            sx={{ pointerEvents: 'auto', mr: 1 }}
          >
            Logout
          </Button>
          {isAdmin && (
            <Button 
              onClick={() => {
                localStorage.removeItem('recipes');
                localStorage.removeItem('recipes_backup');
                loadDefaultRecipes();
              }}
              variant="outlined"
              className="secondary-button"
              sx={{ pointerEvents: 'auto' }}
            >
              Reset to Default
            </Button>
          )}
        </Box>
      </Box>



      {/* Welcome Screen - only show when no recipes */}
      {recipes.length === 0 && (
        <Box sx={{ 
          textAlign: 'center', 
          py: 8,
          mb: 4
        }}>
          <Typography variant="h3" sx={{ 
            color: 'black',
            fontWeight: 'bold',
            mb: 3,
            fontFamily: 'Momo Trust Display, sans-serif'
          }}>
            What will you cook today? 🍳
          </Typography>
          <Typography variant="h6" sx={{ 
            color: 'black', 
            mb: 4,
            fontFamily: 'Momo Trust Display, sans-serif'
          }}>
            Discover delicious recipes and create culinary magic
          </Typography>
          {isAdmin && (
            <Button
              variant="outlined"
              size="large"
              onClick={() => {
                // Safety guard: close other dialogs first
                if (editOpen || viewOpen) {
                  setEditOpen(false);
                  setViewOpen(false);
                }
                setNewRecipe({ title: '', ingredients: [''], instructions: [''], image: '', servings: '', url: '', notes: '' });
                setImagePreview('');
                setUrl('');
                setAddTab(0);
                setAddOpen(true);
              }}
              className="secondary-button"
              sx={{
                px: 4,
                py: 1.5
              }}
            >
              Add Your First Recipe
            </Button>
          )}
        </Box>
      )}

      {/* Recipe Grid */}
      {otherRecipes.length > 0 && (
        <Box>
          <Box className="section-lines">
            <Typography variant="h5" className="section-title">All Recipes</Typography>
          </Box>
          <Grid container spacing={3} sx={{ mt: 8 }}>
            {otherRecipes.map(recipe => (
              <Grid size={{xs:12, sm:6, md:3}} key={recipe.id}>
                <RecipeCard recipe={recipe} onEdit={editRecipe} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Floating Action Buttons */}
      {isAdmin && (
        <>
          {/* Export Button */}
          <Fab
            sx={{ 
              position: 'fixed', 
              bottom: 170, 
              left: 24, 
              zIndex: 1000,
              backgroundColor: 'white',
              color: 'black',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                transform: 'scale(1.05)'
              },
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}
            onClick={exportRecipes}
          >
            <FileDownload />
          </Fab>
          
          {/* Import Button */}
          <input
            accept=".json"
            style={{ display: 'none' }}
            id="import-recipes"
            type="file"
            onChange={importRecipes}
          />
          <label htmlFor="import-recipes">
            <Fab
              component="span"
              sx={{ 
                position: 'fixed', 
                bottom: 100, 
                left: 24, 
                zIndex: 1000,
                backgroundColor: 'white',
                color: 'black',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  transform: 'scale(1.05)'
                },
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
              }}
            >
              <FileUpload />
            </Fab>
          </label>
          
          {/* Add Button */}
          <Fab
            sx={{ 
              position: 'fixed', 
              bottom: 30, 
              left: 24, 
              zIndex: 1000,
              backgroundColor: 'white',
              color: 'black',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                transform: 'scale(1.05)'
              },
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}
            onClick={() => {
              // Safety guard: close other dialogs first
              if (editOpen || viewOpen) {
                setEditOpen(false);
                setViewOpen(false);
              }
              setNewRecipe({ title: '', ingredients: [''], instructions: [''], image: '', servings: '', url: '', notes: '' });
              setImagePreview('');
              setUrl('');
              setAddTab(0);
              setAddOpen(true);
            }}
          >
            <Add />
          </Fab>
        </>
      )}

      {/* Add Recipe Dialog */}
      <Dialog 
        open={addOpen} 
        onClose={handleCloseAddDialog} 
        maxWidth="md" 
        fullWidth 
        disableEscapeKeyDown={false}
        PaperProps={{ 
          sx: { 
            borderRadius: 4,
            fontFamily: 'Momo Trust Display, sans-serif'
          } 
        }}
      >
        <IconButton
          onClick={handleCloseAddDialog}
          sx={{ 
            position: 'absolute', 
            right: 8, 
            top: 8, 
            zIndex: 9999,
            backgroundColor: 'rgba(255,255,255,0.9)',
            '&:hover': { backgroundColor: 'rgba(255,255,255,1)' },
            border: '1px solid #ccc'
          }}
        >
          <Close sx={{ color: 'black' }} />
        </IconButton>
        <DialogTitle sx={{ fontFamily: 'Momo Trust Display, sans-serif' }}>Add New Recipe</DialogTitle>
        <DialogContent>
          <Tabs value={addTab} onChange={(_, newTab) => setAddTab(newTab)} sx={{ mb: 2 }}>
            <Tab label="From Website" />
            <Tab label="Manual Recipe" />
          </Tabs>

          {addTab === 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Momo Trust Display, sans-serif' }}>
                Add Recipe from Website
              </Typography>
              <TextField
                fullWidth
                label="Recipe URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://allrecipes.com/recipe/..."
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                Paste a URL from a recipe website and we'll automatically extract the ingredients and instructions.
              </Typography>
            </Box>
          )}

          {addTab === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Momo Trust Display, sans-serif' }}>
                Create Recipe Manually
              </Typography>
              <TextField
                fullWidth
                label="Recipe Title"
                value={newRecipe.title}
                onChange={(e) => setNewRecipe({ ...newRecipe, title: e.target.value })}
                sx={{ mb: 2, mt: 1 }}
              />
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontFamily: 'Momo Trust Display, sans-serif' }}>Recipe Image</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="image-upload"
                    type="file"
                    onChange={handleImageUpload}
                  />
                  <label htmlFor="image-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<PhotoCamera />}
                      sx={{ borderRadius: 2 }}
                    >
                      Upload Photo
                    </Button>
                  </label>
                  <Typography variant="body2" color="text.secondary">or</Typography>
                  <TextField
                    placeholder="Paste image URL"
                    value={newRecipe.image.startsWith('data:') ? '' : newRecipe.image}
                    onChange={(e) => setNewRecipe({ ...newRecipe, image: e.target.value })}
                    size="small"
                    sx={{ flexGrow: 1 }}
                  />
                </Box>
                {(newRecipe.image || imagePreview) && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <img 
                      src={imagePreview || newRecipe.image} 
                      alt="Preview" 
                      style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px' }}
                    />
                  </Box>
                )}
              </Box>
              <TextField
                fullWidth
                label="Servings"
                value={newRecipe.servings}
                onChange={(e) => setNewRecipe({ ...newRecipe, servings: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Recipe URL (optional)"
                value={newRecipe.url}
                onChange={(e) => setNewRecipe({ ...newRecipe, url: e.target.value })}
                placeholder="https://example.com/recipe"
                sx={{ mb: 2 }}
              />
              
              <Typography variant="h6" sx={{ mb: 1, fontFamily: 'Momo Trust Display, sans-serif' }}>Ingredients</Typography>
              {newRecipe.ingredients.map((ingredient, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    value={ingredient}
                    onChange={(e) => {
                      const updated = [...newRecipe.ingredients];
                      updated[index] = e.target.value;
                      setNewRecipe({ ...newRecipe, ingredients: updated });
                    }}
                    placeholder="e.g., 2 cups flour"
                  />
                  <IconButton onClick={() => {
                    const updated = newRecipe.ingredients.filter((_, i) => i !== index);
                    setNewRecipe({ ...newRecipe, ingredients: updated });
                  }}>
                    <Delete />
                  </IconButton>
                </Box>
              ))}
              <Button onClick={() => setNewRecipe({ ...newRecipe, ingredients: [...newRecipe.ingredients, ''] })} sx={{ color: '#D81B60' }}>
                Add Ingredient
              </Button>

              <Typography variant="h6" sx={{ mb: 1, mt: 2, fontFamily: 'Momo Trust Display, sans-serif' }}>Instructions</Typography>
              {newRecipe.instructions.map((instruction, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    value={instruction}
                    onChange={(e) => {
                      const updated = [...newRecipe.instructions];
                      updated[index] = e.target.value;
                      setNewRecipe({ ...newRecipe, instructions: updated });
                    }}
                    placeholder={`Step ${index + 1}`}
                  />
                  <IconButton onClick={() => {
                    const updated = newRecipe.instructions.filter((_, i) => i !== index);
                    setNewRecipe({ ...newRecipe, instructions: updated });
                  }}>
                    <Delete />
                  </IconButton>
                </Box>
              ))}
              <Button onClick={() => setNewRecipe({ ...newRecipe, instructions: [...newRecipe.instructions, ''] })} sx={{ color: '#D81B60' }}>
                Add Step
              </Button>

              <Typography variant="h6" sx={{ mb: 1, mt: 2, fontFamily: 'Momo Trust Display, sans-serif' }}>Notes (optional)</Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={newRecipe.notes}
                onChange={(e) => setNewRecipe({ ...newRecipe, notes: e.target.value })}
                placeholder="Any additional notes, tips, or variations..."
                sx={{ mb: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          {addTab === 0 ? (
            <Button onClick={scrapeRecipe} variant="contained" disabled={!url.trim()} sx={{ backgroundColor: '#D81B60', '&:hover': { backgroundColor: '#C2185B' } }}>
              Scrape Recipe
            </Button>
          ) : (
            <Button onClick={addRecipe} variant="contained" disabled={!newRecipe.title.trim()} sx={{ backgroundColor: '#D81B60', '&:hover': { backgroundColor: '#C2185B' } }}>
              Add Recipe
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Edit Recipe Dialog */}
      <Dialog 
        open={editOpen} 
        onClose={handleCloseEditDialog} 
        maxWidth="md" 
        fullWidth 
        disableEscapeKeyDown={false}
        PaperProps={{ 
          sx: { 
            borderRadius: 4,
            fontFamily: 'Momo Trust Display, sans-serif'
          } 
        }}
      >
        <IconButton
          onClick={handleCloseEditDialog}
          sx={{ 
            position: 'absolute', 
            right: 8, 
            top: 8, 
            zIndex: 9999,
            backgroundColor: 'rgba(255,255,255,0.9)',
            '&:hover': { backgroundColor: 'rgba(255,255,255,1)' },
            border: '1px solid #ccc'
          }}
        >
          <Close sx={{ color: 'black' }} />
        </IconButton>
        <DialogTitle sx={{ fontFamily: 'Momo Trust Display, sans-serif' }}>Edit Recipe</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Recipe Title"
            value={newRecipe.title}
            onChange={(e) => setNewRecipe({ ...newRecipe, title: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontFamily: 'Momo Trust Display, sans-serif' }}>Recipe Image</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="edit-image-upload"
                type="file"
                onChange={handleImageUpload}
              />
              <label htmlFor="edit-image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<PhotoCamera />}
                  sx={{ borderRadius: 2 }}
                >
                  Upload Photo
                </Button>
              </label>
              <Typography variant="body2" color="text.secondary">or</Typography>
              <TextField
                placeholder="Paste image URL"
                value={newRecipe.image.startsWith('data:') ? '' : newRecipe.image}
                onChange={(e) => setNewRecipe({ ...newRecipe, image: e.target.value })}
                size="small"
                sx={{ flexGrow: 1 }}
              />
            </Box>
            {(newRecipe.image || imagePreview) && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <img 
                  src={imagePreview || newRecipe.image} 
                  alt="Preview" 
                  style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px' }}
                />
              </Box>
            )}
          </Box>
          <TextField
            fullWidth
            label="Servings"
            value={newRecipe.servings}
            onChange={(e) => setNewRecipe({ ...newRecipe, servings: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Recipe URL (optional)"
            value={newRecipe.url}
            onChange={(e) => setNewRecipe({ ...newRecipe, url: e.target.value })}
            placeholder="https://example.com/recipe"
            sx={{ mb: 2 }}
          />
          
          <Typography variant="h6" sx={{ mb: 1, fontFamily: 'Momo Trust Display, sans-serif' }}>Ingredients</Typography>
          {newRecipe.ingredients.map((ingredient, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                value={ingredient}
                onChange={(e) => {
                  const updated = [...newRecipe.ingredients];
                  updated[index] = e.target.value;
                  setNewRecipe({ ...newRecipe, ingredients: updated });
                }}
                placeholder="e.g., 2 cups flour"
              />
              <IconButton onClick={() => {
                const updated = newRecipe.ingredients.filter((_, i) => i !== index);
                setNewRecipe({ ...newRecipe, ingredients: updated });
              }}>
                <Delete />
              </IconButton>
            </Box>
          ))}
          <Button onClick={() => setNewRecipe({ ...newRecipe, ingredients: [...newRecipe.ingredients, ''] })} sx={{ color: '#D81B60' }}>
            Add Ingredient
          </Button>

          <Typography variant="h6" sx={{ mb: 1, mt: 2, fontFamily: 'Momo Trust Display, sans-serif' }}>Instructions</Typography>
          {newRecipe.instructions.map((instruction, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                value={instruction}
                onChange={(e) => {
                  const updated = [...newRecipe.instructions];
                  updated[index] = e.target.value;
                  setNewRecipe({ ...newRecipe, instructions: updated });
                }}
                placeholder={`Step ${index + 1}`}
              />
              <IconButton onClick={() => {
                const updated = newRecipe.instructions.filter((_, i) => i !== index);
                setNewRecipe({ ...newRecipe, instructions: updated });
              }}>
                <Delete />
              </IconButton>
            </Box>
          ))}
          <Button onClick={() => setNewRecipe({ ...newRecipe, instructions: [...newRecipe.instructions, ''] })} sx={{ color: '#D81B60' }}>
            Add Step
          </Button>

          <Typography variant="h6" sx={{ mb: 1, mt: 2, fontFamily: 'Momo Trust Display, sans-serif' }}>Notes (optional)</Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={newRecipe.notes}
            onChange={(e) => setNewRecipe({ ...newRecipe, notes: e.target.value })}
            placeholder="Any additional notes, tips, or variations..."
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={saveEditedRecipe} variant="contained" disabled={!newRecipe.title.trim()} sx={{ backgroundColor: '#D81B60', '&:hover': { backgroundColor: '#C2185B' } }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Recipe Dialog */}
      <Dialog 
        open={viewOpen && selectedRecipe !== null} 
        onClose={selectedRecipe?.pinned ? () => {} : handleCloseViewDialog} 
        maxWidth="md" 
        fullWidth 
        disableEscapeKeyDown={selectedRecipe?.pinned ? true : false}
        PaperProps={{ 
          sx: { 
            borderRadius: 4,
            fontFamily: 'Momo Trust Display, sans-serif'
          } 
        }}
      >
        {selectedRecipe && !selectedRecipe.pinned && (
          <IconButton
            onClick={handleCloseViewDialog}
            sx={{ 
              position: 'absolute', 
              right: 8, 
              top: 8, 
              zIndex: 9999,
              backgroundColor: 'rgba(255,255,255,0.9)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,1)' },
              border: '1px solid #ccc'
            }}
          >
            <Close sx={{ color: 'black' }} />
          </IconButton>
        )}
        {selectedRecipe && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" sx={{ fontFamily: 'Momo Trust Display, sans-serif' }}>{selectedRecipe.title}</Typography>
              {selectedRecipe.pinned && (
                <Button
                  onClick={() => {
                    togglePin(selectedRecipe.id);
                    setViewOpen(false);
                    setSelectedRecipe(null);
                  }}
                  variant="outlined"
                  size="small"
                  className="secondary-button"
                >
                  Unpin Recipe
                </Button>
              )}
            </DialogTitle>
            <DialogContent>
              <Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Momo Trust Display, sans-serif' }}>
                  Portion Size: {portionMultiplier === 0.5 ? '1/2x' : `${portionMultiplier}x`}
                </Typography>
                <Slider
                  value={portionMultiplier}
                  onChange={(_, value) => setPortionMultiplier(value as number)}
                  min={0.5}
                  max={3}
                  step={0.5}
                  marks={[
                    { value: 0.5, label: '1/2x' },
                    { value: 1, label: '1x' },
                    { value: 2, label: '2x' },
                    { value: 3, label: '3x' }
                  ]}
                  sx={{
                    color: '#FFC5D3',
                    '& .MuiSlider-thumb': {
                      backgroundColor: '#FFC5D3'
                    },
                    '& .MuiSlider-track': {
                      backgroundColor: '#FFC5D3'
                    },
                    '& .MuiSlider-rail': {
                      backgroundColor: '#f0f0f0'
                    },
                    '& .MuiSlider-markLabel': {
                      fontFamily: 'Momo Trust Display, sans-serif'
                    }
                  }}
                />
              </Box>

              <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Momo Trust Display, sans-serif' }}>Shopping List</Typography>
              <List dense>
                {selectedRecipe.ingredients.map((ingredient, index) => {
                  const ingredientKey = `${selectedRecipe.id}-${index}`;
                  return (
                    <ListItem key={ingredientKey} sx={{ py: 0.5 }}>
                      <Checkbox
                        checked={checkedIngredients[ingredientKey] || false}
                        onChange={(e) => {
                          const newCheckedState = { ...checkedIngredients };
                          if (e.target.checked) {
                            newCheckedState[ingredientKey] = true;
                          } else {
                            delete newCheckedState[ingredientKey];
                          }
                          setCheckedIngredients(newCheckedState);
                        }}
                        sx={{ 
                          mr: 1,
                          color: '#D81B60',
                          '&.Mui-checked': {
                            color: '#D81B60'
                          }
                        }}
                      />
                      <ListItemText 
                        primary={adjustIngredient(ingredient)} 
                        sx={{ 
                          textDecoration: checkedIngredients[ingredientKey] ? 'line-through' : 'none',
                          opacity: checkedIngredients[ingredientKey] ? 0.6 : 1,
                          fontFamily: 'Momo Trust Display, sans-serif'
                        }}
                      />
                    </ListItem>
                  );
                })}
              </List>

              {!selectedRecipe.pinned && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2, fontFamily: 'Momo Trust Display, sans-serif' }}>Instructions</Typography>
                  <List>
                    {selectedRecipe.instructions.map((instruction, index) => (
                      <ListItem key={index} sx={{ alignItems: 'flex-start' }}>
                        <ListItemText primary={`${index + 1}. ${instruction}`} sx={{ fontFamily: 'Momo Trust Display, sans-serif' }} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
              </Box>
            </DialogContent>
            {isAdmin && (
              <DialogActions>
                <Button 
                  onClick={() => deleteRecipe(selectedRecipe.id)} 
                  color="error" 
                  startIcon={<Delete />}
                  variant="outlined"
                >
                  Delete Recipe
                </Button>
              </DialogActions>
            )}
          </>
        )}
      </Dialog>
    </Container>
    </Box>
    </ThemeProvider>
  );

  function RecipeCard({ recipe, onEdit }: { recipe: Recipe; onEdit?: (recipe: Recipe) => void }) {
    return (
      <Card className="recipe-card"
        onClick={() => {
          setSelectedRecipe(recipe);
          setPortionMultiplier(1);
          setCheckedIngredients({}); // Clear checkbox state when switching recipes
          setViewOpen(true);
        }}
      >


        {/* Tilted Image */}
        {recipe.image && (
          <Box className="tilted-image">
            <Box
              component="img"
              src={recipe.image}
              alt={recipe.title}
              sx={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                borderRadius: 1
              }}
            />
            {/* Paperclip effect */}
            <Box
              component="img"
              src={process.env.PUBLIC_URL + "/binderclip.png"}
              sx={{
                position: 'absolute',
                top: -50,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 75,
                height: 75
              }}
            />
          </Box>
        )}

        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
          <Box sx={{ mt: recipe.image ? 30 : 4.5 }}>
            <Typography variant="h6" className="recipe-title">
              {recipe.title}
            </Typography>
          </Box>
        </CardContent>
        
        <Box sx={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 0.5, zIndex: 3 }}>
          {isAdmin && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(recipe);
              }}
              sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}
            >
              <Edit sx={{ color: 'black' }} />
            </IconButton>
          )}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              togglePin(recipe.id);
            }}
            sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}
          >
            {recipe.pinned ? <PushPin sx={{ color: 'black' }} /> : <PushPinOutlined sx={{ color: 'black' }} />}
          </IconButton>
        </Box>
      </Card>
    );
  }
}

export default App;
