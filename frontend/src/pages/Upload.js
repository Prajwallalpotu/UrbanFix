import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Alert, 
  Paper,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider,
  IconButton,
  Chip,
  Tooltip
} from '@mui/material';
import Layout from '../components/Layout';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SendIcon from '@mui/icons-material/Send';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoIcon from '@mui/icons-material/Photo';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const backendURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

const Upload = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [status, setStatus] = useState('');
    const [latitude, setLatitude] = useState('Fetching...');
    const [longitude, setLongitude] = useState('Fetching...');
    const [message, setMessage] = useState('');
    const [potholesDetected, setPotholesDetected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [detectedSeverity, setDetectedSeverity] = useState('Unknown');
    const [processedImagePath, setProcessedImagePath] = useState('');
    const [locationReady, setLocationReady] = useState(false);
    
    const fileInputRef = useRef(null);
    
    const steps = ['Take Photo', 'Detect Potholes', 'Submit Report'];
    
    const severityColors = {
        'Severe': '#d32f2f',
        'Moderate': '#ff9800',
        'Minor': '#ffc107',
        'Unknown': '#757575'
    };

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLatitude(position.coords.latitude.toFixed(6));
                setLongitude(position.coords.longitude.toFixed(6));
                setLocationReady(true);
            },
            (error) => {
                console.error("Error fetching location: ", error);
                setStatus(`Location unavailable: ${error.message}`);
                setLatitude("Unavailable");
                setLongitude("Unavailable");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
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
            setPotholesDetected(false);
            setStatus('');
            setMessage('');
            setProcessedImagePath('');
            setActiveStep(1);
        } else {
            setFile(null);
            setPreview('');
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const clearImage = () => {
        setFile(null);
        setPreview('');
        setStatus('');
        setPotholesDetected(false);
        setProcessedImagePath('');
        setActiveStep(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const uploadImage = async () => {
        if (!file) {
            setStatus('Please choose an image file');
            return;
        }

        if (latitude === 'Fetching...' || latitude === 'Unavailable') {
            setStatus('Waiting for location data. Please ensure location services are enabled.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('latitude', latitude);
        formData.append('longitude', longitude);

        setStatus('Processing image...');
        setIsLoading(true);

        try {
            const response = await axios.post(`${backendURL}/detect`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 60000
            });

            const detectionData = response.data;
            setPreview(detectionData.imageUrl);
            setProcessedImagePath(detectionData.processedImagePath);

            if (detectionData.potholesDetected) {
                const severityCounts = detectionData.severityCounts || {};
                if (severityCounts.Severe > 0) {
                    setDetectedSeverity('Severe');
                } else if (severityCounts.Moderate > 0) {
                    setDetectedSeverity('Moderate');
                } else if (severityCounts.Minor > 0) {
                    setDetectedSeverity('Minor');
                }
                setPotholesDetected(true);
                setStatus('Potholes detected! You can now submit a report.');
                setActiveStep(2);
            } else {
                setStatus('No potholes detected in this image.');
                setPotholesDetected(false);
            }
        } catch (error) {
            console.error('Error during pothole detection:', error);
            let errorMessage = 'Detection failed: ';
            
            if (error.response) {
                errorMessage += error.response.data?.error || `Server error (${error.response.status})`;
            } else if (error.request) {
                errorMessage += 'No response from server. Check your connection.';
            } else {
                errorMessage += error.message;
            }
            
            setStatus(errorMessage);
            setPotholesDetected(false);
        } finally {
            setIsLoading(false);
        }
    };

    const sendEmail = async () => {
        if (!message) {
            setStatus('Please write a message before sending');
            return;
        }
        
        if (!potholesDetected) {
            setStatus('Cannot send report: No potholes were detected');
            return;
        }

        setIsLoading(true);
        setStatus('Sending report...');

        const emailData = {
            message,
            latitude,
            longitude,
            date: new Date().toISOString(),
            severity: detectedSeverity,
            imageId: Date.now().toString()
        };

        try {
            const userId = localStorage.getItem("user_id");
            if (!userId) {
                setStatus("Please log in to send complaints");
                setIsLoading(false);
                return;
            }

            await axios.post(`${backendURL}/send-email`, emailData, {
                headers: {
                    'User-Id': userId,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            setStatus('Report sent successfully!');
            setFile(null);
            setPreview('');
            setMessage('');
            setPotholesDetected(false);
            setProcessedImagePath('');
            setActiveStep(0);
            
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Error sending email:', error);
            let errorMessage = 'Report sending failed: ';
            
            if (error.response) {
                errorMessage += error.response.data?.error || `Server error (${error.response.status})`;
            } else if (error.request) {
                errorMessage += 'No response from server';
            } else {
                errorMessage += error.message;
            }
            
            setStatus(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout>
            <Box sx={{ 
                maxWidth: 800, 
                mx: 'auto', 
                p: { xs: 2, sm: 4 }, 
                mb: 4
            }}>
                <Paper 
                    elevation={3} 
                    sx={{ 
                        p: { xs: 2, sm: 4 }, 
                        borderRadius: 2,
                        background: 'linear-gradient(to bottom, #ffffff, #f7f9fc)'
                    }}
                >
                    <Typography 
                        variant="h4" 
                        component="h1" 
                        sx={{ 
                            mb: 3, 
                            textAlign: 'center', 
                            color: '#1a237e',
                            fontWeight: 600
                        }}
                    >
                        Pothole Reporter
                    </Typography>
                    
                    <Stepper 
                        activeStep={activeStep} 
                        alternativeLabel 
                        sx={{ mb: 4 }}
                    >
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {/* Location Card */}
                    <Card variant="outlined" sx={{ mb: 4, bgcolor: '#f9f9f9' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <LocationOnIcon 
                                color={locationReady ? "success" : "action"} 
                                fontSize="large" 
                            />
                            <Box>
                                <Typography variant="subtitle1" fontWeight="medium">
                                    Your Location
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Latitude: <strong>{latitude}</strong>, Longitude: <strong>{longitude}</strong>
                                </Typography>
                                {latitude === 'Fetching...' && (
                                    <Typography variant="caption" color="text.secondary">
                                        Getting your location...
                                    </Typography>
                                )}
                                {latitude === 'Unavailable' && (
                                    <Typography variant="caption" color="error">
                                        Location unavailable. Please enable location services.
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Step 1: Take Photo */}
                    {activeStep === 0 && (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <input
                                type="file"
                                accept="image/jpeg, image/png, image/webp"
                                capture="environment"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                            />
                            
                            <Box 
                                sx={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    gap: 2,
                                    bgcolor: '#f5f7fa',
                                    border: '2px dashed #bdbdbd',
                                    borderRadius: 2,
                                    p: 4,
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: '#e8f0fe',
                                        borderColor: '#2196f3'
                                    }
                                }}
                                onClick={triggerFileInput}
                            >
                                <CameraAltIcon sx={{ fontSize: 60, color: '#1976d2' }} />
                                <Typography variant="h6">
                                    Take a Photo or Select Image
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Capture a clear image of the pothole
                                </Typography>
                            </Box>

                            <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
                                Make sure the pothole is clearly visible in the image
                            </Typography>
                        </Box>
                    )}

                    {/* Steps 1-2: Image Preview & Detection */}
                    {(activeStep === 1 || activeStep === 2) && (
                        <>
                            {/* Image Preview Section */}
                            <Box sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6">
                                        {potholesDetected ? 'Detection Results' : 'Image Preview'}
                                    </Typography>
                                    <IconButton 
                                        color="error" 
                                        onClick={clearImage}
                                        size="small"
                                        sx={{
                                            height: 36,
                                            width: 36,
                                            '&:hover': {
                                                bgcolor: '#f44336',
                                                color: 'white'
                                            }
                                        }}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                                
                                <Box 
                                    sx={{ 
                                        position: 'relative',
                                        height: '100%',
                                        display: 'flex',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {preview && (
                                        <img 
                                            src={preview} 
                                            alt="Pothole" 
                                            style={{ 
                                                maxWidth: '100%', 
                                                maxHeight: 300, 
                                                objectFit: 'contain'
                                            }} 
                                        />
                                    )}
                                    
                                    {potholesDetected && (
                                        <Box 
                                            sx={{ 
                                                position: 'absolute', 
                                                top: 10, 
                                                right: 10 
                                            }}
                                        >
                                            <Chip 
                                                icon={<ReportProblemIcon />} 
                                                label={`${detectedSeverity} Pothole`}
                                                sx={{ 
                                                    bgcolor: severityColors[detectedSeverity] || '#757575',
                                                    color: 'white',
                                                    fontWeight: 'bold'
                                                }}
                                            />
                                        </Box>
                                    )}
                                </Box>
                            </Box>

                            {/* Step 1: Detect Button */}
                            {activeStep === 1 && (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={uploadImage}
                                    fullWidth
                                    disabled={isLoading || !file || latitude === 'Fetching...'}
                                    sx={{ 
                                        py: 1,
                                        fontSize: '1rem',
                                        fontWeight: 'medium',
                                        boxShadow: 2,
                                        '&:hover': {
                                            boxShadow: 4
                                        }
                                    }}
                                    startIcon={<PhotoIcon />}
                                >
                                    {isLoading ? (
                                        <>
                                            <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                                            Processing...
                                        </>
                                    ) : 'Detect Potholes'}
                                </Button>
                            )}
                        </>
                    )}

                    {/* Status Message */}
                    {status && (
                        <Alert
                            severity={
                                status.includes('Error') || status.includes('failed') ? "error" :
                                status.includes('No potholes') ? "info" :
                                status.includes('detected') || status.includes('sent success') ? "success" :
                                status.includes('Processing') || status.includes('Sending') ? "info" :
                                "warning"
                            }
                            sx={{ mt: 3, mb: 2 }}
                            variant="filled"
                        >
                            {status}
                        </Alert>
                    )}

                    {/* Step 3: Reporting Section */}
                    {activeStep === 2 && potholesDetected && (
                        <Box sx={{ mt: 3 }}>
                            <Divider sx={{ mb: 3 }} />
                            
                            <Typography variant="h6" gutterBottom>
                                Submit Complaint
                            </Typography>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Your report will be sent to the municipal corporation of your area.
                            </Typography>
                            
                            <TextField
                                label="Description"
                                multiline
                                rows={4}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                fullWidth
                                variant="outlined"
                                sx={{ mb: 3 }}
                                placeholder="Describe the pothole condition, exact location, road name, or any additional details..."
                            />
                            
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={sendEmail}
                                fullWidth
                                disabled={isLoading || !message}
                                sx={{ 
                                    py: 1,
                                    fontSize: '1rem',
                                    fontWeight: 'medium',
                                    boxShadow: 2,
                                    '&:hover': {
                                        boxShadow: 4
                                    }
                                }}
                                startIcon={<SendIcon />}
                            >
                                {isLoading ? (
                                    <>
                                        <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                                        Sending...
                                    </>
                                ) : 'Submit Report'}
                            </Button>
                        </Box>
                    )}
                </Paper>
                
                {/* Instructions Card */}
                <Paper 
                    elevation={1} 
                    sx={{ 
                        mt: 3, 
                        p: 2, 
                        borderRadius: 2,
                        bgcolor: '#f0f4f8'
                    }}
                >
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        How to Report a Pothole:
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label="1" size="small" color="primary" />
                            <Typography variant="body2">
                                Take a clear photo of the pothole with your camera
                            </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label="2" size="small" color="primary" />
                            <Typography variant="body2">
                                Let the system detect and analyze the pothole
                            </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label="3" size="small" color="primary" />
                            <Typography variant="body2">
                                Add details about the location and pothole condition
                            </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label="4" size="small" color="primary" />
                            <Typography variant="body2">
                                Submit your report to the municipal authorities
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Layout>
    );
};

export default Upload;