import React from 'react';
import Header from './Header';
import Box from '@mui/material/Box';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        background: {
            default: '#E4E9F7',
        },
    },
    typography: {
        fontFamily: 'Arial, sans-serif',
    },
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 900,
            lg: 1200,
            xl: 1536,
        },
    },
});

function Layout({ children }) {
    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Header />
                <Box component="main" sx={{ flex: 1, padding: 2 }}>
                    {children}
                </Box>
            </Box>
        </ThemeProvider>
    );
}

export default Layout;