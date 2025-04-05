import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';
import Layout from '../components/Layout';

const backendURL = process.env.REACT_APP_BACKEND_URL;

const Upload = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [status, setStatus] = useState('');
    const [latitude, setLatitude] = useState('Fetching...');
    const [longitude, setLongitude] = useState('Fetching...');
    const [message, setMessage] = useState('');
    const [potholesDetected, setPotholesDetected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLatitude(position.coords.latitude);
                setLongitude(position.coords.longitude);
            },
            (error) => {
                alert("Error fetching location: " + error.message);
                setLatitude("Unavailable");
                setLongitude("Unavailable");
            },
            { enableHighAccuracy: true }
        );
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target.result);
        };
        reader.readAsDataURL(file);
        // Reset pothole detection status when new file is selected
        setPotholesDetected(false);
        setStatus('');
    };

    const uploadImage = async () => {
        if (!file) {
            setStatus('Please choose an image file to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('latitude', latitude);
        formData.append('longitude', longitude);

        setStatus('Processing image...');
        setIsLoading(true);

        try {
            console.log('Uploading file:', file);
            
            // First make a request to get detection results
            const response = await axios.post(`${backendURL}/detect`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            // Check if potholes were detected from the response
            const detectionData = response.data;
            console.log('Detection result:', detectionData);
            
            if (detectionData.potholesDetected) {
                setPotholesDetected(true);
                setStatus('Potholes detected! You can report this to the municipal corporation.');
                // Set the processed image preview
                setPreview(detectionData.imageUrl);
            } else {
                setPotholesDetected(false);
                setStatus('No potholes found. Try again with a different image.');
            }
        } catch (error) {
            console.error('Error:', error);
            setStatus('Error detecting pothole: ' + (error.response?.data?.error || error.message));
            setPotholesDetected(false);
        } finally {
            setIsLoading(false);
        }
    };

    const sendEmail = async () => {
        if (!message) {
            alert('Please write a message before sending the email.');
            return;
        }

        setIsLoading(true);
        const emailData = {
            message,
            latitude,
            longitude,
            imageId: Date.now().toString() // This can be replaced with actual image ID if available
        };

        try {
            const userId = localStorage.getItem("user_id"); // Get user ID from localStorage
            if (!userId) {
                alert("User not logged in. Please log in to send complaints.");
                setIsLoading(false);
                return;
            }

            await axios.post(`${backendURL}/send-email`, emailData, {
                headers: {
                    'User-Id': userId  // Pass user ID in headers
                }
            });

            alert('Email sent successfully to the municipal corporation.');
            setFile(null); // Reset file input
            setPreview(''); // Clear the preview image
            setStatus(''); // Clear the status message
            setMessage(''); // Clear the message field after successful submission
        } catch (error) {
            console.error('Error sending email:', error);
            alert('Error sending email: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout>
            <Box sx={{ maxWidth: 600, mx: 'auto', p: 3, border: '1px solid #ccc', borderRadius: 2, boxShadow: 3 }}>
                <Typography variant="h4" component="h1" sx={{ mb: 3, textAlign: 'center' }}>
                    Pothole Detection
                </Typography>
                <form id="uploadForm" encType="multipart/form-data">
                    <TextField
                        type="file"
                        accept="image/*"
                        capture="camera"
                        onChange={handleFileChange}
                        fullWidth
                        required
                        sx={{ mb: 2 }}
                        InputProps={{
                            inputProps: { accept: 'image/*' }
                        }}
                    />
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={uploadImage} 
                        fullWidth
                        disabled={isLoading || !file}
                    >
                        {isLoading ? 'Processing...' : (file ? 'Detect Potholes' : 'Upload Image')}
                    </Button>
                </form>
                
                {preview && (
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <img src={preview} alt="preview" style={{ maxWidth: '100%', maxHeight: 300 }} />
                    </Box>
                )}
                
                {status && (
                    <Alert 
                        severity={status.includes('No potholes') ? "info" : 
                                status.includes('Error') ? "error" : 
                                potholesDetected ? "warning" : "info"}
                        sx={{ mt: 2 }}
                    >
                        {status}
                    </Alert>
                )}
                
                <Box sx={{ mt: 2, textAlign: 'center' }} id="location">
                    <Typography variant="body2">
                        Latitude: <span id="latitude">{latitude}</span>
                    </Typography>
                    <Typography variant="body2">
                        Longitude: <span id="longitude">{longitude}</span>
                    </Typography>
                </Box>
                
                {potholesDetected && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                            Report to Municipal Corporation
                        </Typography>
                        <TextField
                            label="Your Message"
                            multiline
                            rows={4}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            fullWidth
                            variant="outlined"
                            sx={{ mb: 2 }}
                            placeholder="Describe the pothole condition and any additional details that might be helpful..."
                        />
                        <Button 
                            variant="contained" 
                            color="secondary" 
                            onClick={sendEmail} 
                            fullWidth
                            disabled={isLoading || !message}
                        >
                            Send Email to Municipal Corporation
                        </Button>
                    </Box>
                )}
            </Box>
        </Layout>
    );
};

export default Upload;