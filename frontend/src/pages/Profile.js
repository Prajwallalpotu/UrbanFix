import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const Profile = () => {
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const user_id = localStorage.getItem("user_id");
        if (!user_id) {
            window.location.href = "/login";
        } else {
            axios.get(`http://localhost:5001/user/profile/${user_id}`)
                .then(res => setProfile(res.data))
                .catch(err => console.error("Error fetching profile:", err));
        }
    }, []);

    return (
        <Layout>
            <div className="profile-container">
                {profile ? (
                    <>
                        <h2>Welcome, {profile.name}</h2>
                        <p><strong>User ID:</strong> {profile.user_id}</p>
                        <p><strong>Role:</strong> {profile.role}</p>
                    </>
                ) : (
                    <p>Loading profile...</p>
                )}
            </div>
        </Layout>
    );
};

export default Profile;
