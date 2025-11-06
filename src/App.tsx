import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Card, CardContent, Button, 
  TextField, Box, Fab, Dialog, DialogTitle, 
  DialogContent, DialogActions, Chip, IconButton,
  Slider, List, ListItem, ListItemText
} from '@mui/material';
import { Add, Delete, PushPin, PushPinOutlined, Restaurant } from '@mui/icons-material';
import { Grid } from '@mui/material';

interface Recipe {
  id: number;
  title: string;
  ingredients: string[];
  instructions: string[];
  image?: string;
  servings?: string;
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
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [portionMultiplier, setPortionMultiplier] = useState(1);
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
      pinned: false
    };
    saveRecipes([...recipes, recipe]);
    setNewRecipe({ title: '', ingredients: [''], instructions: [''], image: '', servings: '' });
    setAddOpen(false);
  };

  const togglePin = (id: number) => {
    const updated = recipes.map(r => ({ ...r, pinned: r.id === id ? !r.pinned : false }));
    saveRecipes(updated);
  };

  const deleteRecipe = (id: number) => {
    saveRecipes(recipes.filter(r => r.id !== id));
    setViewOpen(false);
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Login Dialog */}
      <Dialog open={loginOpen}>
        <DialogTitle>🍳 My Cookbook</DialogTitle>
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
            <Button fullWidth variant="contained" onClick={() => login(true)} disabled={!password}>
              Login as Admin
            </Button>
          </Box>
          <Button fullWidth variant="outlined" onClick={() => login(false)}>
            Browse as Guest
          </Button>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h3">🍳 My Cookbook</Typography>
        <Box>
          <Chip label={isAdmin ? 'Admin' : 'Guest'} color={isAdmin ? 'primary' : 'default'} />
          <Button onClick={() => { localStorage.clear(); window.location.reload(); }} sx={{ ml: 1 }}>
            Logout
          </Button>
        </Box>
      </Box>

      {/* Pinned Recipe */}
      {pinnedRecipe && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>📌 Pinned Recipe</Typography>
          <Grid container spacing={2}>
            <Grid size={{xs:12, sm:6, md:4}}>
              <RecipeCard recipe={pinnedRecipe} />
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Main Content */}
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h4" color="text.secondary">
          What will you cook today? 🍳
        </Typography>
      </Box>

      {/* Recipe Grid */}
      {otherRecipes.length > 0 && (
        <Box>
          <Typography variant="h5" sx={{ mb: 2 }}>All Recipes</Typography>
          <Grid container spacing={3}>
            {otherRecipes.map(recipe => (
              <Grid size={{xs:12, sm:6, md:4}} key={recipe.id}>
                <RecipeCard recipe={recipe} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Add Button */}
      {isAdmin && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setAddOpen(true)}
        >
          <Add />
        </Fab>
      )}

      {/* Add Recipe Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Recipe</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Recipe Title"
            value={newRecipe.title}
            onChange={(e) => setNewRecipe({ ...newRecipe, title: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="Image URL (optional)"
            value={newRecipe.image}
            onChange={(e) => setNewRecipe({ ...newRecipe, image: e.target.value })}
            sx={{ mb: 2 }}
          />
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
          <Button onClick={() => setNewRecipe({ ...newRecipe, ingredients: [...newRecipe.ingredients, ''] })}>
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
          <Button onClick={() => setNewRecipe({ ...newRecipe, instructions: [...newRecipe.instructions, ''] })}>
            Add Step
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button onClick={addRecipe} variant="contained" disabled={!newRecipe.title.trim()}>
            Add Recipe
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Recipe Dialog */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth>
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
  );

  function RecipeCard({ recipe }: { recipe: Recipe }) {
    return (
      <Card 
        sx={{ 
          height: 300, 
          cursor: 'pointer',
          position: 'relative',
          '&:hover': { transform: 'scale(1.02)' }
        }}
        onClick={() => {
          setSelectedRecipe(recipe);
          setPortionMultiplier(1);
          setViewOpen(true);
        }}
      >
        {isAdmin && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              togglePin(recipe.id);
            }}
            sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.8)' }}
          >
            {recipe.pinned ? <PushPin color="primary" /> : <PushPinOutlined />}
          </IconButton>
        )}

        {recipe.image ? (
          <Box
            component="img"
            src={recipe.image}
            alt={recipe.title}
            sx={{ width: '100%', height: 200, objectFit: 'cover' }}
          />
        ) : (
          <Box 
            sx={{ 
              height: 200, 
              bgcolor: '#e0e0e0', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <Restaurant sx={{ fontSize: 60, color: '#bdbdbd' }} />
          </Box>
        )}

        <CardContent>
          <Typography variant="h6" noWrap>
            {recipe.title}
          </Typography>
          {recipe.servings && (
            <Chip label={`Serves ${recipe.servings}`} size="small" sx={{ mt: 1 }} />
          )}
        </CardContent>
      </Card>
    );
  }
}

export default App;
