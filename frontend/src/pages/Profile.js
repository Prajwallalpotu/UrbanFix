import React, { useEffect, useState } from "react";
import {
Container,
Paper,
Typography,
Box,
Avatar,
CircularProgress,
Button,
Grid,
Divider,
Alert,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import LogoutIcon from "@mui/icons-material/Logout";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";

const backendURL = process.env.REACT_APP_BACKEND_URL;

// Your imports remain unchanged

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
    const fetchProfile = async () => {
        const userId = localStorage.getItem("user_id");
        if (!userId) {
        window.location.href = "/login";
        return;
        }

        try {
        setIsLoading(true);
        const response = await fetch(`${backendURL}/user/profile/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch profile data");
        const data = await response.json();
        setProfile(data);
        } catch (err) {
        console.error("Error fetching profile:", err);
        setError(err.message);
        } finally {
        setIsLoading(false);
        }
    };

    fetchProfile();
    }, []);

    const handleLogout = () => {
    localStorage.removeItem("user_id");
    window.location.href = "/login";
    };

    const navigateToEditProfile = () => {
    window.location.href = "/edit-profile";
    };

    if (isLoading) {
    return (
        <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
            Loading your profile...
        </Typography>
        </Box>
    );
    }

    if (error) {
    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={() => window.location.reload()} fullWidth>
            Try Again
        </Button>
        </Container>
    );
    }

    return (
    <Layout>
        <Container maxWidth="md">
        <Paper elevation={6} sx={{ borderRadius: 4, overflow: "hidden" }}>
            {/* Header Banner */}
            <Box sx={{ bgcolor: "#2C3E50", height: 180, position: "relative" }} />

            {/* Avatar & Name */}
            <Box
            sx={{
                position: "relative",
                mt: -10,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                px: 3,
            }}
            >
            <Avatar
                sx={{
                width: 120,
                height: 120,
                border: "4px solid #2980B9",
                fontSize: "3rem",
                color: "#2C3E50",
                bgcolor: "#ECF0F1",
                }}
            >
                {profile?.name?.charAt(0).toUpperCase() || "U"}
            </Avatar>
            <Typography variant="h4" sx={{ mt: 2, fontWeight: "bold", color: "#2C3E50" }}>
                {profile?.name}
            </Typography>
            <Typography variant="subtitle1" sx={{ color: "#7F8C8D" }}>
                {profile?.role}
            </Typography>
            </Box>

            {/* Profile Info */}
            <Box sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "medium", color: "#2C3E50" }}>
                Profile Details
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
                {[
                { label: "Full Name", value: profile?.name },
                { label: "Email", value: profile?.email },
                { label: "User ID", value: profile?.user_id },
                { label: "Role", value: profile?.role },
                ].map((item) => (
                <Grid item xs={12} sm={6} key={item.label}>
                    <Box
                    sx={{
                        p: 2,
                        border: "1px solid #dfe6e9",
                        borderRadius: 2,
                        bgcolor: "#F9F9F9",
                    }}
                    >
                    <Typography variant="subtitle2" color="text.secondary">
                        {item.label}
                    </Typography>
                    <Typography variant="body1">{item.value}</Typography>
                    </Box>
                </Grid>
                ))}
            </Grid>
            </Box>

            {/* Action Buttons */}
            <Box
            sx={{
                p: 3,
                bgcolor: "#F4F6F7",
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
                borderTop: "1px solid #e0e0e0",
            }}
            >
            <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={navigateToEditProfile}
                sx={{
                textTransform: "none",
                px: 3,
                bgcolor: "#2980B9",
                py: 1,
                fontWeight: "bold",
                boxShadow: 2,
                ":hover": {
                    boxShadow: 4,
                    bgcolor: "#2471A3",
                },
                }}
            >
                Edit Profile
            </Button>
            <Button
                variant="outlined"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{
                textTransform: "none",
                borderColor: "#E74C3C",
                color: "#E74C3C",
                ":hover": { bgcolor: "#E74C3C", color: "white" },
                borderWidth: 2,
                px: 3,
                py: 1,
                fontWeight: "bold",
                }}
            >
                Logout
            </Button>
            </Box>
        </Paper>
        </Container>
    </Layout>
    );
};

export default Profile;
