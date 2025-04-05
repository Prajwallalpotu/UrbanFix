import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, Paper, Stepper, Step, StepLabel, CircularProgress } from '@mui/material';
import Layout from '../components/Layout';

const backendURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

function Track() {
    const [complaints, setComplaints] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchComplaints = async () => {
            const userId = localStorage.getItem("user_id");
            if (!userId) {
                alert("User not logged in. Please log in to view complaints.");
                return;
            }

            try {
                const response = await axios.get(`${backendURL}/user/complaints/${userId}`);
                setComplaints(response.data.complaints || []);
            } catch (error) {
                console.error("Error fetching complaints:", error);
                alert("Failed to fetch complaints.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchComplaints();
    }, []);

    const getTrackingSteps = (status) => {
        const steps = [
            "Complaint Sent to Municipal Corporation",
            "Received by Municipal Corporation",
            "In Process",
            "Pothole Buried"
        ];
        const activeStep = steps.indexOf(status) !== -1 ? steps.indexOf(status) : 0;
        return { steps, activeStep };
    };

    return (
        <Layout>
            <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
                <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>
                    Track Complaints
                </Typography>
                {isLoading ? (
                    <Box sx={{ textAlign: 'center' }}>
                        <CircularProgress />
                        <Typography sx={{ mt: 2 }}>Loading complaints...</Typography>
                    </Box>
                ) : complaints.length === 0 ? (
                    <Typography>No complaints found.</Typography>
                ) : (
                    complaints.map((complaint, index) => {
                        const { steps, activeStep } = getTrackingSteps(complaint.status || "Complaint Sent to Municipal Corporation");
                        return (
                            <Paper key={index} sx={{ p: 3, mb: 3, boxShadow: 3 }}>
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    Complaint ID: {complaint.complaint_id}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Latitude:</strong> {complaint.latitude}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Longitude:</strong> {complaint.longitude}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    <strong>Message:</strong> {complaint.message}
                                </Typography>
                                <Stepper activeStep={activeStep} alternativeLabel>
                                    {steps.map((label, stepIndex) => (
                                        <Step key={stepIndex}>
                                            <StepLabel>{label}</StepLabel>
                                        </Step>
                                    ))}
                                </Stepper>
                            </Paper>
                        );
                    })
                )}
            </Box>
        </Layout>
    );
}

export default Track;