import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h2" sx={{ mb: 2, color: 'red', fontWeight:800 }}>404</Typography>
            <Typography variant="h5" sx={{ mb: 2 }}>Oops! Page Not Found</Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>The page you are looking for does not exist.</Typography>
            <Button variant="contained" color="primary" onClick={() => navigate('/')}>
                Go to Home
            </Button>
        </Box>
    );
};

export default NotFound;
