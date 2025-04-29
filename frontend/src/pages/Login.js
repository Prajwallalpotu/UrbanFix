import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
TextField,
Button,
Container,
Typography,
Box,
Alert,
Paper,
} from "@mui/material";

const backendURL = process.env.REACT_APP_BACKEND_URL;

const Login = () => {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [errorMsg, setErrorMsg] = useState("");
const [isLoading, setIsLoading] = useState(false);
const navigate = useNavigate();

useEffect(() => {
    const userId = localStorage.getItem("user_id");

    if (userId && userId !== "admin") {
    axios
        .get(`${backendURL}/user/profile/${userId}`)
        .then(() => navigate("/profile"))
        .catch(() => localStorage.removeItem("user_id"));
    } else if (userId === "67dc64eddf25608bb0abdf49") {
    navigate("/profile");
    }
}, [navigate]);

const login = async () => {
    if (!email || !password) {
    setErrorMsg("Please fill in all fields.");
    return;
    }

    setIsLoading(true);
    try {
    const res = await axios.post(`${backendURL}/auth/login`, {
        email,
        password,
    });
    localStorage.setItem("user_id", res.data.user_id);
    navigate("/profile");
    } catch (error) {
    setErrorMsg(error.response?.data?.message || "Invalid email or password.");
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
        // p: 2,
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
        UrbanFix Login
        </Typography>

        {errorMsg && (
        <Alert severity="error" sx={{ mb: 2 }}>
            {errorMsg}
        </Alert>
        )}

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
        onClick={login}
        >
        {isLoading ? "Logging in..." : "Login"}
        </Button>

        <Typography variant="body2" sx={{ mt: 3 }}>
        Don’t have an account?{" "}
        <Link
            to="/create-profile"
            style={{ color: "#2C3E50", fontWeight: "bold" }}
        >
            Create Profile
        </Link>
        </Typography>
    </Paper>
    </Box>
);
};

export default Login;
