import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Grid, 
  Paper, 
  Card, 
  CardContent, 
  Divider,
  Chip,
  Stack,
  Tooltip
} from '@mui/material';
import Layout from '../components/Layout';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';

const backendURL = process.env.REACT_APP_BACKEND_URL;

function PotholeMap() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        severe: 0,
        moderate: 0,
        minor: 0,
        unknown: 0,
        fixed: 0,
        pending: 0
    });
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);

    // Initialize map container
    useEffect(() => {
        if (!mapInstanceRef.current && mapRef.current) {
            mapInstanceRef.current = L.map(mapRef.current).setView([17.9716, 73.5946], 8);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(mapInstanceRef.current);
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Load and display markers
    useEffect(() => {
        const loadLocations = async () => {
            if (!mapInstanceRef.current) return;

            try {
                const response = await axios.get(`${backendURL}/locations`);
                const locations = response.data.locations;

                // Calculate statistics
                const newStats = {
                    total: locations.length,
                    severe: 0,
                    moderate: 0,
                    minor: 0,
                    unknown: 0,
                    fixed: 0,
                    pending: 0
                };

                const severityColors = {
                    'Severe': '#ff0000',
                    'Moderate': '#ffa500',
                    'Minor': '#ffff00',
                    'Unknown': '#808080'
                };

                locations.forEach(loc => {
                    // Update counts
                    if (loc.severity) {
                        newStats[loc.severity.toLowerCase()]++;
                    } else {
                        newStats.unknown++;
                    }

                    if (loc.status === 'Fixed') {
                        newStats.fixed++;
                    } else {
                        newStats.pending++;
                    }

                    // Create marker
                    const marker = L.circleMarker(
                        [parseFloat(loc.latitude), parseFloat(loc.longitude)],
                        {
                            radius: 8,
                            fillColor: severityColors[loc.severity] || '#808080',
                            color: '#000',
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.8
                        }
                    );

                    marker.bindPopup(`
                        <div style="font-family: Arial, sans-serif; padding: 5px;">
                            <h3 style="margin: 0 0 8px 0; border-bottom: 1px solid #eee; padding-bottom: 5px;">Pothole Details</h3>
                            <p><strong>Status:</strong> ${loc.status}</p>
                            <p><strong>Severity:</strong> ${loc.severity || 'Unknown'}</p>
                            <p><strong>Reported:</strong> ${new Date(loc.timestamp).toLocaleDateString()}</p>
                        </div>
                    `);

                    marker.addTo(mapInstanceRef.current);
                });

                setStats(newStats);
                setLoading(false);
            } catch (err) {
                console.error('Error loading map:', err);
                setError('Failed to load pothole locations');
                setLoading(false);
            }
        };

        loadLocations();
    }, []);

    const StatCard = ({ title, value, icon, color }) => (
        <Card sx={{ height: '100%', borderLeft: `4px solid ${color}` }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" color="text.secondary">
                        {title}
                    </Typography>
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        bgcolor: `${color}15`, 
                        p: 1, 
                        borderRadius: '50%' 
                    }}>
                        {icon}
                    </Box>
                </Box>
                <Typography variant="h4" component="div" sx={{ mt: 2, fontWeight: 'bold' }}>
                    {value}
                </Typography>
            </CardContent>
        </Card>
    );

    return (
        <Layout>
            <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3, mb: 10 }}>
                <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
                    Pothole Management Dashboard
                </Typography>
                
                {error && (
                    <Paper elevation={0} sx={{ mb: 3, p: 2, bgcolor: '#fdeded', borderRadius: 2 }}>
                        <Typography color="error">{error}</Typography>
                    </Paper>
                )}

                {/* Stats Section */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard 
                            title="Total Potholes" 
                            value={stats.total} 
                            icon={<DonutLargeIcon sx={{ color: '#3f51b5' }} />}
                            color="#3f51b5"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard 
                            title="Severe Issues" 
                            value={stats.severe} 
                            icon={<WarningIcon sx={{ color: '#f44336' }} />}
                            color="#f44336"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard 
                            title="Fixed Potholes" 
                            value={stats.fixed} 
                            icon={<CheckCircleIcon sx={{ color: '#4caf50' }} />}
                            color="#4caf50"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard 
                            title="Pending Repairs" 
                            value={stats.pending} 
                            icon={<PendingIcon sx={{ color: '#ff9800' }} />}
                            color="#ff9800"
                        />
                    </Grid>
                </Grid>

                {/* Map and Severity Breakdown */}
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Paper 
                            elevation={2} 
                            sx={{ 
                                borderRadius: 2,
                                overflow: 'hidden'
                            }}
                        >
                            <Box sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                                <Typography variant="h6">Pothole Map</Typography>
                            </Box>
                            <Divider />
                            <Box 
                                ref={mapRef}
                                sx={{ 
                                    height: '60vh', 
                                    width: '100%',
                                    position: 'relative'
                                }} 
                            >
                                {loading && (
                                    <Box 
                                        sx={{ 
                                            position: 'absolute', 
                                            top: 0, 
                                            left: 0, 
                                            right: 0, 
                                            bottom: 0, 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            bgcolor: 'rgba(255,255,255,0.7)',
                                            zIndex: 1000
                                        }}
                                    >
                                        <CircularProgress />
                                    </Box>
                                )}
                            </Box>
                        </Paper>
                    </Grid>
                    
                    {/* Severity Breakdown */}
                    <Grid item xs={12} md={4}>
                        <Paper elevation={2} sx={{ p: 3, height: '100%', borderRadius: 2 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>Severity Breakdown</Typography>
                            
                            <Stack spacing={2}>
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{ width: 12, height: 12, bgcolor: '#ff0000', borderRadius: '50%', mr: 1 }} />
                                            <Typography>Severe</Typography>
                                        </Box>
                                        <Typography fontWeight="bold">{stats.severe}</Typography>
                                    </Box>
                                    <Box sx={{ width: '100%', bgcolor: '#f0f0f0', height: 8, borderRadius: 1 }}>
                                        <Box 
                                            sx={{ 
                                                width: `${stats.total ? (stats.severe / stats.total * 100) : 0}%`, 
                                                bgcolor: '#ff0000', 
                                                height: '100%',
                                                borderRadius: 1,
                                                transition: 'width 1s ease-in-out'
                                            }} 
                                        />
                                    </Box>
                                </Box>
                                
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{ width: 12, height: 12, bgcolor: '#ffa500', borderRadius: '50%', mr: 1 }} />
                                            <Typography>Moderate</Typography>
                                        </Box>
                                        <Typography fontWeight="bold">{stats.moderate}</Typography>
                                    </Box>
                                    <Box sx={{ width: '100%', bgcolor: '#f0f0f0', height: 8, borderRadius: 1 }}>
                                        <Box 
                                            sx={{ 
                                                width: `${stats.total ? (stats.moderate / stats.total * 100) : 0}%`, 
                                                bgcolor: '#ffa500', 
                                                height: '100%',
                                                borderRadius: 1,
                                                transition: 'width 1s ease-in-out'
                                            }} 
                                        />
                                    </Box>
                                </Box>
                                
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{ width: 12, height: 12, bgcolor: '#ffff00', borderRadius: '50%', mr: 1 }} />
                                            <Typography>Minor</Typography>
                                        </Box>
                                        <Typography fontWeight="bold">{stats.minor}</Typography>
                                    </Box>
                                    <Box sx={{ width: '100%', bgcolor: '#f0f0f0', height: 8, borderRadius: 1 }}>
                                        <Box 
                                            sx={{ 
                                                width: `${stats.total ? (stats.minor / stats.total * 100) : 0}%`, 
                                                bgcolor: '#ffff00', 
                                                height: '100%',
                                                borderRadius: 1,
                                                transition: 'width 1s ease-in-out'
                                            }} 
                                        />
                                    </Box>
                                </Box>
                                
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{ width: 12, height: 12, bgcolor: '#808080', borderRadius: '50%', mr: 1 }} />
                                            <Typography>Unknown</Typography>
                                        </Box>
                                        <Typography fontWeight="bold">{stats.unknown}</Typography>
                                    </Box>
                                    <Box sx={{ width: '100%', bgcolor: '#f0f0f0', height: 8, borderRadius: 1 }}>
                                        <Box 
                                            sx={{ 
                                                width: `${stats.total ? (stats.unknown / stats.total * 100) : 0}%`, 
                                                bgcolor: '#808080', 
                                                height: '100%',
                                                borderRadius: 1,
                                                transition: 'width 1s ease-in-out'
                                            }} 
                                        />
                                    </Box>
                                </Box>
                            </Stack>
                            
                            <Box sx={{ mt: 4 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>Repair Status</Typography>
                                
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <Tooltip title="Potholes that have been repaired">
                                        <Chip 
                                            icon={<CheckCircleIcon />} 
                                            label={`Fixed: ${stats.fixed}`} 
                                            color="success" 
                                            variant="outlined"
                                            sx={{ pl: 1 }}
                                        />
                                    </Tooltip>
                                    
                                    <Tooltip title="Potholes awaiting repair">
                                        <Chip 
                                            icon={<PendingIcon />} 
                                            label={`Pending: ${stats.pending}`} 
                                            color="warning" 
                                            variant="outlined"
                                            sx={{ pl: 1 }}
                                        />
                                    </Tooltip>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Layout>
    );
}

export default PotholeMap;