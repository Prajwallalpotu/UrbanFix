import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
Box, 
Typography, 
Paper, 
Stepper, 
Step, 
StepLabel, 
CircularProgress, 
Divider, 
Grid, 
Card, 
CardContent, 
Chip, 
Badge,
Container,
Alert,
IconButton,
Tooltip
} from '@mui/material';
import Layout from '../components/Layout';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MessageIcon from '@mui/icons-material/Message';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import MapIcon from '@mui/icons-material/Map';
import WarningIcon from '@mui/icons-material/Warning';
import CancelIcon from '@mui/icons-material/Cancel';

const backendURL = process.env.REACT_APP_BACKEND_URL;

function Track() {
    const [complaints, setComplaints] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        pending: 0,
        rejected: 0
    });

    useEffect(() => {
        const fetchComplaints = async () => {
            const userId = localStorage.getItem("user_id");
            if (!userId) {
                setError("User not logged in. Please log in to view complaints.");
                setIsLoading(false);
                return;
            }

            try {
                const response = await axios.get(`${backendURL}/user/complaints/${userId}`);
                const fetchedComplaints = response.data.complaints || [];
                setComplaints(fetchedComplaints);
                
                // Calculate statistics
                const completedCount = fetchedComplaints.filter(c => c.status === "Pothole Buried").length;
                const rejectedCount = fetchedComplaints.filter(c => c.status === "Rejected").length;
                
                setStats({
                    total: fetchedComplaints.length,
                    completed: completedCount,
                    pending: fetchedComplaints.length - completedCount - rejectedCount,
                    rejected: rejectedCount
                });
            } catch (error) {
                console.error("Error fetching complaints:", error);
                setError("Failed to fetch complaints. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchComplaints();
    }, []);

    const getTrackingSteps = (status) => {
        const steps = [
            "Complaint Sent",
            "Received by Municipal",
            "In Process",
            "Pothole Repaired"
        ];
        
        let activeStep = 0;
        if (status === "Received by Municipal Corporation") activeStep = 1;
        else if (status === "In Process") activeStep = 2;
        else if (status === "Pothole Buried") activeStep = 3;
        else if (status === "Rejected") return { steps: [...steps], activeStep: -1, rejected: true };
        
        return { steps, activeStep, rejected: false };
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const getStatusColor = (status) => {
        switch(status) {
            case "Pothole Buried": return "success";
            case "In Process": return "info";
            case "Received by Municipal Corporation": return "primary";
            case "Rejected": return "error";
            default: return "warning";
        }
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case "Pothole Buried": return <CheckCircleIcon />;
            case "In Process": return <PendingIcon />;
            case "Received by Municipal Corporation": return <ReportProblemIcon />;
            case "Rejected": return <CancelIcon />;
            default: return <WarningIcon />;
        }
    };

    return (
        <Layout>
            <Container maxWidth="lg" sx={{ py: 1 }}>
                <Paper 
                    elevation={0} 
                    sx={{ 
                        p: { xs: 2, sm: 4 }, 
                        borderRadius: 2,
                        bgcolor: 'transparent'
                    }}
                >
                    <Typography 
                        variant="h4" 
                        sx={{ 
                            mb: 4, 
                            fontWeight: 'bold',
                            color: '#1a237e',
                            textAlign: 'center'
                        }}
                    >
                        Your Complaint Tracking
                    </Typography>

                    {error && (
                        <Alert 
                            severity="error" 
                            sx={{ mb: 4 }}
                            action={
                                <IconButton
                                    color="inherit"
                                    size="small"
                                    onClick={() => setError(null)}
                                >
                                    <CancelIcon fontSize="inherit" />
                                </IconButton>
                            }
                        >
                            {error}
                        </Alert>
                    )}

                    {/* Dashboard Stats Cards */}
                    {!isLoading && !error && complaints.length > 0 && (
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ height: '100%', borderLeft: '4px solid #3f51b5' }}>
                                    <CardContent>
                                        <Typography variant="h6" color="text.secondary">
                                            Total Complaints
                                        </Typography>
                                        <Typography variant="h3" component="div" sx={{ mt: 2, fontWeight: 'bold' }}>
                                            {stats.total}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ height: '100%', borderLeft: '4px solid #4caf50' }}>
                                    <CardContent>
                                        <Typography variant="h6" color="text.secondary">
                                            Completed
                                        </Typography>
                                        <Typography variant="h3" component="div" sx={{ mt: 2, fontWeight: 'bold', color: '#4caf50' }}>
                                            {stats.completed}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ height: '100%', borderLeft: '4px solid #ff9800' }}>
                                    <CardContent>
                                        <Typography variant="h6" color="text.secondary">
                                            In Progress
                                        </Typography>
                                        <Typography variant="h3" component="div" sx={{ mt: 2, fontWeight: 'bold', color: '#ff9800' }}>
                                            {stats.pending}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ height: '100%', borderLeft: '4px solid #f44336' }}>
                                    <CardContent>
                                        <Typography variant="h6" color="text.secondary">
                                            Rejected
                                        </Typography>
                                        <Typography variant="h3" component="div" sx={{ mt: 2, fontWeight: 'bold', color: '#f44336' }}>
                                            {stats.rejected}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    )}

                    {isLoading ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                            <CircularProgress size={60} thickness={4} />
                            <Typography variant="h6" sx={{ mt: 3, fontWeight: 'medium', color: 'text.secondary' }}>
                                Loading your complaints...
                            </Typography>
                        </Box>
                    ) : complaints.length === 0 && !error ? (
                        <Paper 
                            elevation={2} 
                            sx={{ 
                                p: 6, 
                                textAlign: 'center',
                                borderRadius: 2,
                                bgcolor: '#f5f7fa'
                            }}
                        >
                            <Box sx={{ mb: 3 }}>
                                <ReportProblemIcon sx={{ fontSize: 60, color: '#9e9e9e' }} />
                            </Box>
                            <Typography variant="h5" sx={{ mb: 2, fontWeight: 'medium' }}>
                                No Complaints Found
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                You haven't submitted any pothole complaints yet.
                            </Typography>
                        </Paper>
                    ) : (
                        <Box sx={{ mt: 2 }}>
                            {complaints.map((complaint, index) => {
                                const { steps, activeStep, rejected } = getTrackingSteps(complaint.status || "Complaint Sent");
                                return (
                                    <Paper 
                                        key={index} 
                                        elevation={2} 
                                        sx={{ 
                                            p: { xs: 2, sm: 3 }, 
                                            mb: 4, 
                                            borderRadius: 2,
                                            borderLeft: rejected 
                                                ? '4px solid #f44336' 
                                                : activeStep === 3 
                                                    ? '4px solid #4caf50' 
                                                    : '4px solid #ff9800'
                                        }}
                                    >
                                        <Grid container spacing={2}>
                                            <Grid item xs={12}>
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'center',
                                                    flexWrap: 'wrap',
                                                    gap: 1
                                                }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                        Complaint #{complaint.complaint_id || index + 1}
                                                    </Typography>
                                                    
                                                    <Chip 
                                                        label={complaint.status || "Complaint Sent"}
                                                        color={getStatusColor(complaint.status)}
                                                        icon={getStatusIcon(complaint.status)}
                                                        variant="filled"
                                                        sx={{ fontWeight: 'medium' }}
                                                    />
                                                </Box>
                                                <Divider sx={{ my: 2 }} />
                                            </Grid>
                                            
                                            <Grid item xs={12} md={8}>
                                                <Box sx={{ mb: 3 }}>
                                                    <Typography variant="body2" sx={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center',
                                                        gap: 1,
                                                        mb: 1.5,
                                                        color: 'text.secondary'
                                                    }}>
                                                        <LocationOnIcon fontSize="small" />
                                                        <span>Location: </span>
                                                        <strong>
                                                            {complaint.latitude}, {complaint.longitude}
                                                        </strong>
                                                    </Typography>
                                                    
                                                    <Typography variant="body2" sx={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center',
                                                        gap: 1,
                                                        mb: 1.5,
                                                        color: 'text.secondary'
                                                    }}>
                                                        <CalendarTodayIcon fontSize="small" />
                                                        <span>Submitted: </span>
                                                        <strong>
                                                            {formatDate(complaint.timestamp)}
                                                        </strong>
                                                    </Typography>
                                                    
                                                    {complaint.severity && (
                                                        <Typography variant="body2" sx={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center',
                                                            gap: 1,
                                                            mb: 1.5,
                                                            color: 'text.secondary'
                                                        }}>
                                                            <WarningIcon fontSize="small" />
                                                            <span>Severity: </span>
                                                            <Chip 
                                                                label={complaint.severity} 
                                                                size="small"
                                                                color={
                                                                    complaint.severity === "Severe" ? "error" :
                                                                    complaint.severity === "Moderate" ? "warning" :
                                                                    "success"
                                                                }
                                                            />
                                                        </Typography>
                                                    )}
                                                </Box>
                                                
                                                <Box sx={{
                                                    bgcolor: '#f5f5f5', 
                                                    p: 2, 
                                                    borderRadius: 1,
                                                    display: 'flex',
                                                    gap: 1
                                                }}>
                                                    <MessageIcon sx={{ color: '#757575', mt: 0.5 }} />
                                                    <Typography variant="body2">
                                                        <strong>Description:</strong><br />
                                                        {complaint.message || "No description provided."}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            
                                            <Grid item xs={12} md={4}>
                                                <Box 
                                                    sx={{ 
                                                        height: '100%', 
                                                        display: 'flex', 
                                                        flexDirection: 'column',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                                        Complaint Status
                                                    </Typography>
                                                    
                                                    {rejected ? (
                                                        <Alert 
                                                            severity="error" 
                                                            variant="outlined"
                                                            icon={<CancelIcon />}
                                                            sx={{ mb: 2 }}
                                                        >
                                                            This complaint was rejected by municipal authorities.
                                                        </Alert>
                                                    ) : null}
                                                    
                                                    <Stepper 
                                                        activeStep={activeStep} 
                                                        orientation="vertical" 
                                                        sx={{ 
                                                            '& .MuiStepLabel-label': { fontSize: '0.85rem' },
                                                            opacity: rejected ? 0.5 : 1 
                                                        }}
                                                    >
                                                        {steps.map((label, stepIndex) => (
                                                            <Step key={stepIndex}>
                                                                <StepLabel>{label}</StepLabel>
                                                            </Step>
                                                        ))}
                                                    </Stepper>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                        
                                        {complaint.image_url && (
                                            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
                                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                                    Reported Image:
                                                </Typography>
                                                <Box sx={{ maxWidth: 150, borderRadius: 1, overflow: 'hidden' }}>
                                                    <img 
                                                        src={complaint.image_url} 
                                                        alt="Pothole" 
                                                        style={{ maxWidth: '100%' }} 
                                                    />
                                                </Box>
                                            </Box>
                                        )}
                                    </Paper>
                                );
                            })}
                        </Box>
                    )}
                </Paper>
            </Container>
        </Layout>
    );
}

export default Track;