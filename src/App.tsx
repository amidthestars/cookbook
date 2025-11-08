import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Card, CardContent, Button, 
  TextField, Box, Fab, Dialog, DialogTitle, 
  DialogContent, DialogActions, Chip, IconButton,
  Slider, List, ListItem, ListItemText, Tabs, Tab
} from '@mui/material';
import { Add, Delete, PushPin, PushPinOutlined, Restaurant, Close, Edit, PhotoCamera } from '@mui/icons-material';
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
  pinned: boolean;
}

const ADMIN_PASSWORD = 'w0y40ch1f4n!';

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
  const [newRecipe, setNewRecipe] = useState({
    title: '',
    ingredients: [''],
    instructions: [''],
    image: '',
    servings: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('recipes');
    if (saved) setRecipes(JSON.parse(saved));
    
    const auth = localStorage.getItem('auth');
    if (auth) {
      const authData = JSON.parse(auth);
      if (Date.now() - authData.timestamp < 30 * 24 * 60 * 60 * 1000) {
        setIsAdmin(authData.role === 'admin');
        setLoginOpen(false);
      }
    }
    
    // Force close all dialogs on mount
    setAddOpen(false);
    setViewOpen(false);
    setEditOpen(false);
  }, []);

  // Debug state
  useEffect(() => {
    console.log('Dialog states - loginOpen:', loginOpen, 'addOpen:', addOpen, 'viewOpen:', viewOpen, 'editOpen:', editOpen);
  }, [loginOpen, addOpen, viewOpen, editOpen]);

  // Force logout function
  const forceLogout = () => {
    console.log('Force logout triggered');
    localStorage.clear();
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
  };

  // Debug click events and keyboard shortcuts
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
    
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const saveRecipes = (newRecipes: Recipe[]) => {
    setRecipes(newRecipes);
    localStorage.setItem('recipes', JSON.stringify(newRecipes));
  };

  const login = (asAdmin: boolean) => {
    if (asAdmin && password !== ADMIN_PASSWORD) return;
    
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
      url: '',
      pinned: false
    };
    saveRecipes([...recipes, recipe]);
    setNewRecipe({ title: '', ingredients: [''], instructions: [''], image: '', servings: '' });
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
  };

  const deleteRecipe = (id: number) => {
    saveRecipes(recipes.filter(r => r.id !== id));
    setViewOpen(false);
  };

  const editRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setNewRecipe({
      title: recipe.title,
      ingredients: [...recipe.ingredients],
      instructions: [...recipe.instructions],
      image: recipe.image || '',
      servings: recipe.servings || ''
    });
    setImagePreview(recipe.image || '');
    setEditOpen(true);
    setViewOpen(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setNewRecipe({ ...newRecipe, image: result });
        setImagePreview(result);
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
      servings: newRecipe.servings
    };
    
    const updatedRecipes = recipes.map(r => 
      r.id === editingRecipe.id ? updatedRecipe : r
    );
    
    saveRecipes(updatedRecipes);
    setNewRecipe({ title: '', ingredients: [''], instructions: [''], image: '', servings: '' });
    setImagePreview('');
    setEditingRecipe(null);
    setEditOpen(false);
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
        <Typography variant="h3" className="main-title">COOKBOOK</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ color: 'black' }}>
            {isAdmin ? 'ADMIN MODE' : 'GUEST MODE'}
          </Typography>
          <Button 
            onClick={forceLogout}
            variant="outlined"
            className="secondary-button"
            sx={{ pointerEvents: 'auto' }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* Pinned Recipe */}
      {pinnedRecipe && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" className="section-title">📌 Pinned Recipe</Typography>
          <Grid container spacing={2}>
            <Grid size={{xs:12, sm:6, md:3}}>
              <RecipeCard recipe={pinnedRecipe} onEdit={editRecipe} />
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Welcome Screen - only show when no recipes */}
      {recipes.length === 0 && (
        <Box sx={{ 
          textAlign: 'center', 
          py: 8,
          bgcolor: 'white',
          borderRadius: 4,
          mb: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <Typography variant="h3" sx={{ 
            color: 'black',
            fontWeight: 'bold',
            mb: 3
          }}>
            What will you cook today? 🍳
          </Typography>
          <Typography variant="h6" sx={{ color: 'black', mb: 4 }}>
            Discover delicious recipes and create culinary magic
          </Typography>
          {isAdmin && (
            <Button
              variant="contained"
              size="large"
              onClick={() => setAddOpen(true)}
              sx={{
                borderRadius: 3,
                px: 4,
                py: 1.5,
                backgroundColor: '#026633',
                '&:hover': {
                  backgroundColor: '#085025'
                }
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

      {/* Add Button */}
      {isAdmin && (
        <Fab
          sx={{ 
            position: 'fixed', 
            bottom: 24, 
            left: 24, 
            zIndex: 100,
            backgroundColor: 'white',
            color: 'black',
            '&:hover': {
              backgroundColor: '#f5f5f5',
              transform: 'scale(1.1)'
            },
            boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
          }}
          onClick={() => setAddOpen(true)}
        >
          <Add />
        </Fab>
      )}

      {/* Add Recipe Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="md" fullWidth disableEscapeKeyDown={false}>
        <DialogTitle>Add New Recipe</DialogTitle>
        <DialogContent>
          <Tabs value={addTab} onChange={(_, newTab) => setAddTab(newTab)} sx={{ mb: 2 }}>
            <Tab label="From Website" />
            <Tab label="Manual Recipe" />
          </Tabs>

          {addTab === 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
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
              <Typography variant="h6" sx={{ mb: 2 }}>
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
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Recipe Image</Typography>
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
              
              <Typography variant="h6" sx={{ mb: 1 }}>Ingredients</Typography>
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
              <Button onClick={() => setNewRecipe({ ...newRecipe, ingredients: [...newRecipe.ingredients, ''] })} sx={{ color: '#026633' }}>
                Add Ingredient
              </Button>

              <Typography variant="h6" sx={{ mb: 1, mt: 2 }}>Instructions</Typography>
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
              <Button onClick={() => setNewRecipe({ ...newRecipe, instructions: [...newRecipe.instructions, ''] })} sx={{ color: '#026633' }}>
                Add Step
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          {addTab === 0 ? (
            <Button onClick={scrapeRecipe} variant="contained" disabled={!url.trim()} sx={{ backgroundColor: '#026633', '&:hover': { backgroundColor: '#085025' } }}>
              Scrape Recipe
            </Button>
          ) : (
            <Button onClick={addRecipe} variant="contained" disabled={!newRecipe.title.trim()} sx={{ backgroundColor: '#026633', '&:hover': { backgroundColor: '#085025' } }}>
              Add Recipe
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Edit Recipe Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth disableEscapeKeyDown={false}>
        <DialogTitle>Edit Recipe</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Recipe Title"
            value={newRecipe.title}
            onChange={(e) => setNewRecipe({ ...newRecipe, title: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Recipe Image</Typography>
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
          
          <Typography variant="h6" sx={{ mb: 1 }}>Ingredients</Typography>
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
          <Button onClick={() => setNewRecipe({ ...newRecipe, ingredients: [...newRecipe.ingredients, ''] })} sx={{ color: '#026633' }}>
            Add Ingredient
          </Button>

          <Typography variant="h6" sx={{ mb: 1, mt: 2 }}>Instructions</Typography>
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
          <Button onClick={() => setNewRecipe({ ...newRecipe, instructions: [...newRecipe.instructions, ''] })} sx={{ color: '#026633' }}>
            Add Step
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={saveEditedRecipe} variant="contained" disabled={!newRecipe.title.trim()} sx={{ backgroundColor: '#026633', '&:hover': { backgroundColor: '#085025' } }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Recipe Dialog */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth disableEscapeKeyDown={false}>
        {selectedRecipe && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5">{selectedRecipe.title}</Typography>
              {isAdmin && (
                <IconButton onClick={() => deleteRecipe(selectedRecipe.id)} color="error">
                  <Delete />
                </IconButton>
              )}
            </DialogTitle>
            <DialogContent>
              {selectedRecipe.image && (
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                  <img 
                    src={selectedRecipe.image} 
                    alt={selectedRecipe.title}
                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
                  />
                </Box>
              )}

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
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
                />
              </Box>

              <Typography variant="h6" gutterBottom>Ingredients</Typography>
              <List dense>
                {selectedRecipe.ingredients.map((ingredient, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={adjustIngredient(ingredient)} />
                  </ListItem>
                ))}
              </List>

              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Instructions</Typography>
              <List>
                {selectedRecipe.instructions.map((instruction, index) => (
                  <ListItem key={index} sx={{ alignItems: 'flex-start' }}>
                    <ListItemText primary={`${index + 1}. ${instruction}`} />
                  </ListItem>
                ))}
              </List>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Container>
    </Box>
  );

  function RecipeCard({ recipe, onEdit }: { recipe: Recipe; onEdit?: (recipe: Recipe) => void }) {
    return (
      <Card className="recipe-card"
        onClick={() => {
          setSelectedRecipe(recipe);
          setPortionMultiplier(1);
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
              src="binderclip.png"
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
        
        {isAdmin && (
          <Box sx={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 0.5, zIndex: 3 }}>
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
        )}
      </Card>
    );
  }
}

export default App;
