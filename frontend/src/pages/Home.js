import React from 'react';
import Layout from '../components/Layout';
import { Box, Typography, Paper } from '@mui/material';

function Home() {
    return (
        <Layout>
            <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h4" component="h1" sx={{ mb: 3, textAlign: 'center' }}>
                        Welcome to UrbanFix
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Our system detects potholes and reports them to the nearest Municipal Corporation. We also track the complaints to ensure they are addressed promptly.
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        By using our platform, you can help improve the quality of roads in your area and ensure a safer driving experience for everyone.
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Simply upload a photo of the pothole, and our system will take care of the rest. You can also view the history of your complaints and track their status.
                    </Typography>
                    <Typography variant="body1" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                        Together, we can make our roads better!
                    </Typography>
                </Paper>
            </Box>
        </Layout>
    );
}

export default Home;