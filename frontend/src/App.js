import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes , Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Upload from './pages/Upload';
import Home from './pages/Home';
import NotFound from './pages/404';
import Profile from './pages/Profile';
import CreateProfile from './pages/CreateProfile';
import EditProfile from './pages/EditProfile';
import axios from 'axios';
import './App.css';
import Track from './pages/Track';

const PrivateRoute = ({ children }) => {
    const userId = localStorage.getItem("user_id");

    const [valid, setValid] = useState(null);
    useEffect(() => {
        if (!userId) {
            setValid(false);
        } else {
            axios.get(`http://localhost:5001/user/profile/${userId}`)
                .then(() => setValid(true))
                .catch(() => {
                    localStorage.removeItem("user_id");
                    setValid(false);
                });
        }
    }, []);

    if (valid === null) return <div>Loading...</div>;
    return valid ? children : <Navigate to="/login" />;
};


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/upload" element={<Upload/>} />
                <Route path="/login" element={<Login/>} />
                <Route
                    path="/profile"
                    element={
                        <PrivateRoute>
                            <Profile />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/create-profile" element={<CreateProfile />}
                />
                <Route
                    path="/edit-profile"
                    element={
                        <PrivateRoute>
                            <EditProfile />
                        </PrivateRoute>
                    }
                />
                <Route 
                    path="/track"
                    element={
                        <PrivateRoute>
                            <Track />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/"
                    element={
                        <PrivateRoute>
                            <Home />
                        </PrivateRoute>
                    }
                />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Router>
    );
}

export default App;
