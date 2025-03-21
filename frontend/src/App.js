import React from 'react';
import { BrowserRouter as Router, Routes , Route } from 'react-router-dom';
import Login from './pages/Login';
import Upload from './pages/Upload';
import Home from './pages/Home';
import NotFound from './pages/404';
import Profile from './pages/Profile';
import CreateProfile from './pages/CreateProfile';
import './App.css';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/upload" element={<Upload/>} />
                <Route path="/login" element={<Login/>} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/create-profile" element={<CreateProfile />} />
                <Route path="/" element={<Home/>} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Router>
    );
}

export default App;
