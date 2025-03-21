import React from 'react';
import { BrowserRouter as Router, Routes , Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Upload from './pages/Upload';
import Home from './pages/Home';
import NotFound from './pages/404';
import Profile from './pages/Profile';
import CreateProfile from './pages/CreateProfile';
import './App.css';

const PrivateRoute = ({ children }) => {
    const userId = localStorage.getItem("user_id");
    return userId ? children : <Navigate to="/login" />;
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
                    path="/create-profile"
                    element={
                        <PrivateRoute>
                            <CreateProfile />
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
