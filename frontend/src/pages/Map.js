import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Box, Typography, CircularProgress } from '@mui/material';
import Layout from '../components/Layout';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const backendURL = process.env.REACT_APP_BACKEND_URL;

function PotholeMap() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);

    // Initialize map container
    useEffect(() => {
        if (!mapInstanceRef.current && mapRef.current) {
            mapInstanceRef.current = L.map(mapRef.current).setView([12.9716, 77.5946], 12);
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

                const severityColors = {
                    'Severe': 'red',
                    'Moderate': 'orange',
                    'Minor': 'yellow',
                    'Unknown': 'gray'
                };

                locations.forEach(loc => {
                    const marker = L.circleMarker(
                        [parseFloat(loc.latitude), parseFloat(loc.longitude)],
                        {
                            radius: 8,
                            fillColor: severityColors[loc.severity] || 'gray',
                            color: '#000',
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.8
                        }
                    );

                    marker.bindPopup(`
                        <b>Status:</b> ${loc.status}<br>
                        <b>Severity:</b> ${loc.severity}<br>
                        <b>Message:</b> ${loc.message}<br>
                        <b>Reported:</b> ${new Date(loc.timestamp).toLocaleDateString()}
                    `);

                    marker.addTo(mapInstanceRef.current);
                });

                setLoading(false);
            } catch (err) {
                console.error('Error loading map:', err);
                setError('Failed to load pothole locations');
                setLoading(false);
            }
        };

        loadLocations();
    }, []);

    return (
        <Layout>
            <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
                <Typography variant="h4" sx={{ mb: 3 }}>Pothole Map</Typography>
                
                {error && (
                    <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
                )}

                <Box 
                    ref={mapRef}
                    sx={{ 
                        height: '70vh', 
                        width: '100%',
                        borderRadius: 2,
                        border: '1px solid #ccc',
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

                <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Legend:</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {Object.entries({
                            'Severe': '#ff0000',
                            'Moderate': '#ffa500',
                            'Minor': '#ffff00',
                            'Unknown': '#808080'
                        }).map(([severity, color]) => (
                            <Box key={severity} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box 
                                    sx={{ 
                                        width: 16, 
                                        height: 16, 
                                        borderRadius: '50%', 
                                        bgcolor: color,
                                        border: '1px solid #000'
                                    }} 
                                />
                                <Typography variant="body2">{severity}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>
        </Layout>
    );
}

export default PotholeMap;
