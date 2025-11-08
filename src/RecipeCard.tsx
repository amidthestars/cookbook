import React from 'react';
import { 
  Card, CardContent, Typography, Box, IconButton, Chip 
} from '@mui/material';
import { PushPin, PushPinOutlined, Restaurant, Edit } from '@mui/icons-material';

interface Recipe {
  id: number;
  title: string;
  ingredients: string[];
  instructions: string[];
  image?: string;
  servings?: string;
  pinned: boolean;
}

interface RecipeCardProps {
  recipe: Recipe;
  onEdit: (recipe: Recipe) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onEdit }) => {
  return (
    <Card 
      sx={{ 
        height: 300, 
        cursor: 'pointer',
        position: 'relative',
        '&:hover': { transform: 'scale(1.02)' }
      }}
      onClick={() => {
        // Handle recipe view click
      }}
    >
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, display: 'flex', gap: 0.5 }}>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(recipe);
          }}
          sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}
        >
          <Edit />
        </IconButton>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            // Handle pin toggle
          }}
          sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}
        >
          {recipe.pinned ? <PushPin color="primary" /> : <PushPinOutlined />}
        </IconButton>
      </Box>

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
};

export default RecipeCard;