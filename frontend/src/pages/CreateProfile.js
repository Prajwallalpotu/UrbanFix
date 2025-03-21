import React, { useState } from "react";
import { Link } from "react-router-dom";
import { TextField, Button, Container, Typography, Box } from "@mui/material";

const CreateProfile = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle profile creation logic here
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ p: 4, textAlign: "center", boxShadow: 3, borderRadius: 2, bgcolor: "#fff" }}>
                <Typography variant="h4" gutterBottom>Create Profile</Typography>

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
                        type="submit"
                        sx={{ mt: 2 }}
                    >
                        Create Profile
                    </Button>
                </form>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    Already have an account? <Link to="/login">Login</Link>
                </Typography>
            </Box>
        </Container>
    );
};

export default CreateProfile;
