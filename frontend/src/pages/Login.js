import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { TextField, Button, Container, Typography, Box, Alert } from "@mui/material";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const userId = localStorage.getItem("user_id");
    
        if (userId && userId !== "admin") {
            axios.get(`http://localhost:5001/user/profile/${userId}`)
                .then(() => navigate("/profile"))
                .catch(() => {
                    // Invalid user_id, remove and stay on login
                    localStorage.removeItem("user_id");
                });
        } else if (userId === "admin") {
            navigate("/profile");
        }
    }, [navigate]);
    

    const login = async () => {
        if (!email || !password) {
            setErrorMsg("Please fill in all fields.");
            return;
        }

        try {
            const res = await axios.post("http://localhost:5001/auth/login", { email, password });
            localStorage.setItem("user_id", res.data.user_id);
            navigate("/profile");
        } catch (error) {
            setErrorMsg("Invalid email or password.");
        }
    };

    return (
        <Container maxWidth="xs">
            <Box sx={{ p: 4, textAlign: "center", boxShadow: 3, borderRadius: 2, bgcolor: "#fff" }}>
                <Typography variant="h4" gutterBottom>Login</Typography>
                
                {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

                <TextField
                    fullWidth
                    margin="normal"
                    type="email"
                    label="Email"
                    variant="outlined"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    color="primary"
                    onClick={login}
                    sx={{ mt: 2 }}
                >
                    Login
                </Button>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    Don't have an account? <Link to="/create-profile">Create Profile</Link>
                </Typography>
            </Box>
        </Container>
    );
};

export default Login;
