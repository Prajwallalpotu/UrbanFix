import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Container, Typography, Box, Alert } from "@mui/material";
import axios from "axios";

const backendURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

const EditProfile = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const userId = localStorage.getItem("user_id");
        if (!userId) {
            navigate("/login");
        } else {
            axios.get(`${backendURL}/user/profile/${userId}`)
                .then((res) => {
                    setName(res.data.name);
                    setEmail(res.data.email);
                })
                .catch((err) => {
                    console.error("Error fetching profile:", err);
                    setErrorMsg("Failed to load profile.");
                });
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        if (!name || !email) {
            setErrorMsg("All fields are required.");
            return;
        }

        try {
            const userId = localStorage.getItem("user_id");
            await axios.put(`${backendURL}/user/profile/${userId}`, { name, email });
            setSuccessMsg("Profile updated successfully!");
            setTimeout(() => navigate("/profile"), 2000); // Redirect after 2 seconds
        } catch (error) {
            console.error("Error updating profile:", error);
            setErrorMsg("Failed to update profile.");
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ p: 4, textAlign: "center", boxShadow: 3, borderRadius: 2, bgcolor: "#fff" }}>
                <Typography variant="h4" gutterBottom>Edit Profile</Typography>

                {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
                {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Name"
                        variant="outlined"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        type="email"
                        label="Email"
                        variant="outlined"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        type="submit"
                        sx={{ mt: 2 }}
                    >
                        Save Changes
                    </Button>
                </form>
            </Box>
        </Container>
    );
};

export default EditProfile;
