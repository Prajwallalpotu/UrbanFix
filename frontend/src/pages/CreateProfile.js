import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TextField, Button, Typography, Box, Alert, Paper } from "@mui/material";
import axios from "axios";

const backendURL = process.env.REACT_APP_BACKEND_URL;

const CreateProfile = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [emailError, setEmailError] = useState("");
    const navigate = useNavigate();

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");
        setEmailError("");

        if (!name || !email || !password) {
            setErrorMsg("All fields are required.");
            return;
        }

        if (!validateEmail(email)) {
            setEmailError("Please enter a valid email address.");
            return;
        }

        if (password.length < 6) {
            setErrorMsg("Password must be at least 6 characters long.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(`${backendURL}/auth/register`, { 
                name, 
                email, 
                password 
            });
            setSuccessMsg("Profile created successfully! Redirecting to login...");
            setTimeout(() => navigate("/login"), 1500);
        } catch (error) {
            if (error.response?.data?.message?.includes("already registered")) {
                setEmailError("This email is already registered. Please use a different email or login.");
            } else {
                setErrorMsg(error.response?.data?.message || "Error creating profile.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                minWidth: "100vw",
                bgcolor: "#2C3E50",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Paper
                elevation={6}
                sx={{
                    p: 4,
                    width: "100%",
                    maxWidth: 400,
                    textAlign: "center",
                    borderRadius: 3,
                    bgcolor: "#fff",
                }}
            >
                <Typography
                    variant="h4"
                    gutterBottom
                    sx={{
                        fontWeight: "bold",
                        color: "#2C3E50",
                    }}
                >
                    UrbanFix Register
                </Typography>

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
                        error={!!emailError}
                        helperText={emailError}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        type="password"
                        label="Password"
                        variant="outlined"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                        fullWidth
                        variant="contained"
                        type="submit"
                        disabled={isLoading}
                        sx={{
                            mt: 3,
                            py: 1.2,
                            fontWeight: "bold",
                            bgcolor: "#2C3E50",
                            ":hover": {
                                bgcolor: "#1A252F",
                            },
                        }}
                    >
                        {isLoading ? "Creating Profile..." : "Create Profile"}
                    </Button>
                </form>

                <Typography variant="body2" sx={{ mt: 3 }}>
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        style={{ color: "#2C3E50", fontWeight: "bold" }}
                    >
                        Login
                    </Link>
                </Typography>
            </Paper>
        </Box>
    );
};

export default CreateProfile;
