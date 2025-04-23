// --- START OF FILE Upload.js ---

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';
import Layout from '../components/Layout';

// Make sure REACT_APP_BACKEND_URL is correctly set in your .env file
const backendURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'; // Provide a default

const Upload = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [status, setStatus] = useState('');
    const [latitude, setLatitude] = useState('Fetching...');
    const [longitude, setLongitude] = useState('Fetching...');
    const [message, setMessage] = useState('');
    const [potholesDetected, setPotholesDetected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [processedImagePath, setProcessedImagePath] = useState(''); // Store path for potential future use

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLatitude(position.coords.latitude);
                setLongitude(position.coords.longitude);
            },
            (error) => {
                console.error("Error fetching location: ", error);
                // Don't use alert, show message in UI
                setStatus(`Error fetching location: ${error.message}. Using defaults.`);
                setLatitude("Unavailable");
                setLongitude("Unavailable");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 } // Add timeout and maximumAge
        );
    }, []);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreview(e.target.result);
            };
            reader.readAsDataURL(selectedFile);
            // Reset status and detection state
            setPotholesDetected(false);
            setStatus('');
            setMessage(''); // Also clear message field
            setProcessedImagePath(''); // Clear stored path
        } else {
            // Handle case where user cancels file selection
            setFile(null);
            setPreview('');
            setStatus('File selection cancelled.');
        }
    };

    const uploadImage = async () => {
        if (!file) {
            setStatus('Please choose an image file to upload.');
            return;
        }

        // Check if location is available
        if (latitude === 'Fetching...' || latitude === 'Unavailable') {
            setStatus('Waiting for location data... Please ensure location services are enabled.');
            // Optionally try fetching location again here or prompt user
            return; // Prevent upload without location if it's required
        }


        const formData = new FormData();
        formData.append('file', file);
        formData.append('latitude', latitude);
        formData.append('longitude', longitude);

        setStatus('Processing image...');
        setIsLoading(true);
        setPreview(''); // Clear previous preview while processing
        setPotholesDetected(false); // Reset detection status

        try {
            console.log('Uploading file:', file.name, 'Size:', file.size);
            console.log('Sending to URL:', `${backendURL}/detect`);

            const response = await axios.post(`${backendURL}/detect`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 60000 // Add timeout for potentially long inference
            });

            const detectionData = response.data;
            console.log('Detection result:', detectionData);

            // Update preview with the processed image from the backend
            setPreview(detectionData.imageUrl);
            setProcessedImagePath(detectionData.processedImagePath); // Store the path

            if (detectionData.potholesDetected) {
                setPotholesDetected(true);
                // Use the detailed message from the backend
                setStatus(detectionData.message + ' You can now report this.');
            } else {
                setPotholesDetected(false);
                setStatus(detectionData.message || 'No potholes found.'); // Use backend message or default
            }
        } catch (error) {
            console.error('Error during pothole detection:', error);
            let errorMessage = 'Error detecting pothole: ';
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Error response data:', error.response.data);
                console.error('Error response status:', error.response.status);
                errorMessage += error.response.data?.error || `Server responded with status ${error.response.status}`;
            } else if (error.request) {
                // The request was made but no response was received
                console.error('Error request:', error.request);
                errorMessage += 'No response received from server. Check network or backend status.';
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error message:', error.message);
                errorMessage += error.message;
            }
            setStatus(errorMessage);
            setPotholesDetected(false);
            setPreview(''); // Clear preview on error
        } finally {
            setIsLoading(false);
        }
    };

    const sendEmail = async () => {
        if (!message) {
            setStatus('Please write a message before sending the email.'); // Use setStatus for feedback
            return;
        }
        if (!potholesDetected) {
            setStatus('Cannot send report: No potholes were detected in the last analysis.');
            return;
        }

        setIsLoading(true);
        setStatus('Sending report...'); // Update status

        // NOTE: Using imageId like Date.now() is unreliable if you need the *specific* image.
        // The backend currently finds the *latest* processed image.
        // A robust solution would pass `processedImagePath` from `uploadImage` state here.
        // For simplicity, we keep the current flow, but acknowledge the backend's limitation.
        const emailData = {
            message,
            latitude,
            longitude,
            // imageId: processedImagePath || Date.now().toString() // Consider passing the actual path if needed robustly
            imageId: Date.now().toString() // Keep existing logic for now
        };

        try {
            const userId = localStorage.getItem("user_id");
            if (!userId) {
                setStatus("User not logged in. Please log in to send complaints."); // Use setStatus
                setIsLoading(false);
                return;
            }

            console.log('Sending email data:', emailData);
            console.log('Sending to URL:', `${backendURL}/send-email`);

            await axios.post(`${backendURL}/send-email`, emailData, {
                headers: {
                    'User-Id': userId,
                    'Content-Type': 'application/json' // Ensure correct content type
                },
                timeout: 30000 // Add timeout for email sending
            });

            setStatus('Report sent successfully to the municipal corporation.'); // Use setStatus
            // Reset form after successful send
            setFile(null);
            setPreview('');
            setMessage('');
            setPotholesDetected(false);
            setProcessedImagePath('');
            // Clear the file input visually (optional, requires useRef)
            // e.g., fileInputRef.current.value = null;
        } catch (error) {
            console.error('Error sending email:', error);
            let errorMessage = 'Error sending report: ';
            if (error.response) {
                console.error('Error response data:', error.response.data);
                errorMessage += error.response.data?.error || `Server responded with status ${error.response.status}`;
            } else if (error.request) {
                errorMessage += 'No response received from server.';
            } else {
                errorMessage += error.message;
            }
            setStatus(errorMessage); // Use setStatus for error feedback
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout>
            <Box sx={{ maxWidth: 600, mx: 'auto', p: 3, border: '1px solid #ccc', borderRadius: 2, boxShadow: 3 }}>
                <Typography variant="h4" component="h1" sx={{ mb: 3, textAlign: 'center' }}>
                    Pothole Detection & Reporting
                </Typography>

                {/* Location Display */}
                <Box sx={{ mb: 2, p: 1, border: '1px dashed grey', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="body2" component="div">
                        Location: Lat: <span id="latitude" style={{ fontWeight: 'bold' }}>{latitude}</span>, Long: <span id="longitude" style={{ fontWeight: 'bold' }}>{longitude}</span>
                    </Typography>
                    {latitude === 'Fetching...' && <Typography variant="caption" color="textSecondary">Getting location...</Typography>}
                    {latitude === 'Unavailable' && <Typography variant="caption" color="error">Location unavailable. Reporting may be less effective.</Typography>}
                </Box>

                {/* File Input */}
                <TextField
                    type="file"
                    // accept="image/*" // Standard images
                    accept="image/jpeg, image/png, image/webp" // Be more specific if needed
                    capture="environment" // Prioritize back camera on mobile
                    onChange={handleFileChange}
                    fullWidth
                    required
                    sx={{ mb: 2 }}
                    InputLabelProps={{ shrink: true }} // Keep label floated
                    label="Select Pothole Image"
                    // inputRef={fileInputRef} // Add ref if needed to clear input visually
                />

                {/* Detect Button */}
                <Button
                    variant="contained"
                    color="primary"
                    onClick={uploadImage}
                    fullWidth
                    disabled={isLoading || !file || latitude === 'Fetching...'} // Disable if loading, no file, or still fetching location
                    sx={{ mb: 2 }}
                >
                    {isLoading ? 'Processing...' : (file ? 'Detect Potholes' : 'Select Image First')}
                </Button>

                {/* Preview Image */}
                {preview && (
                    <Box sx={{ mt: 2, mb: 2, textAlign: 'center', border: '1px solid lightgrey', padding: '5px' }}>
                        <Typography variant="caption" display="block" gutterBottom>Image Preview / Detection Result</Typography>
                        <img src={preview} alt="Pothole Preview" style={{ maxWidth: '100%', maxHeight: 300, display: 'block', margin: 'auto' }} />
                    </Box>
                )}

                {/* Status Message */}
                {status && (
                    <Alert
                        severity={
                            status.includes('Error') || status.includes('failed') || status.includes('unavailable') ? "error" :
                            status.includes('No potholes') ? "info" :
                            status.includes('detected') || status.includes('Report sent') ? "success" : // Mark detection/sent as success
                            status.includes('Processing') || status.includes('Sending') || status.includes('Waiting') ? "info" :
                            "warning" // Default for other messages like 'write a message'
                        }
                        sx={{ mt: 2 }}
                    >
                        {status}
                    </Alert>
                )}


                {/* Reporting Section */}
                {potholesDetected && (
                    <Box sx={{ mt: 3, p: 2, border: '1px solid blue', borderRadius: 1 }}>
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
                            placeholder="Describe the pothole condition, location accuracy, or any additional details..."
                        />
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={sendEmail}
                            fullWidth
                            disabled={isLoading || !message} // Disable if loading or no message
                        >
                        {isLoading ? 'Sending...' : 'Send Report Email'}
                        </Button>
                    </Box>
                )}
            </Box>
        </Layout>
    );
};

export default Upload;

// --- END OF FILE Upload.js ---