// src/components/AuthDisplay.jsx
import React, { useEffect, useRef } from "react";
import { Button } from "./ui/button.jsx"; // Corrected import path

const AuthDisplay = ({
  user,
  handleLogout,
  handleCredentialResponse,
  googleClientId,
}) => {
  // Ref to the div where Google Sign-In button will be rendered
  const googleButtonContainerRef = useRef(null);

  // Effect to initialize Google Identity Services
  // This runs once on mount or when googleClientId/handleCredentialResponse changes.
  useEffect(() => {
    if (window.google && googleClientId) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
        auto_prompt: false,
        ux_mode: "popup",
        // IMPORTANT: Ensure this login_uri matches your Google Cloud Console's Authorized Redirect URIs EXACTLY.
        // It should be the URL where your index.html is actually served.
        login_uri: `${window.location.origin}/index.html`,
      });
    } else {
      console.error(
        "Google Client ID is missing or GSI client not loaded in AuthDisplay."
      );
    }
  }, [googleClientId, handleCredentialResponse]); // Dependencies for initialization

  // Effect to render/hide the Google Sign-In button dynamically
  // This runs whenever the 'user' state changes.
  useEffect(() => {
    if (googleButtonContainerRef.current) {
      if (!user) {
        // If no user is logged in, ensure the container is visible
        googleButtonContainerRef.current.style.display = ""; // Reset display to default (block)
        // Render the Google Sign-In button into the referenced div
        window.google.accounts.id.renderButton(
          googleButtonContainerRef.current, // Render into this specific ref'd div
          {
            type: "standard",
            size: "large",
            theme: "outline",
            text: "sign_in_with",
            shape: "rectangular",
            logo_alignment: "left",
          }
        );
      } else {
        // If user is logged in, explicitly hide the button container
        googleButtonContainerRef.current.style.display = "none";
      }
    }
  }, [user]); // Dependency on 'user' state to trigger visibility change

  return (
    <div className="flex items-center space-x-4">
      {user ? (
        <>
          {/* User is logged in, show profile picture, display name, and logout button */}
          <div className="flex items-center space-x-2">
            {user.profilePicture && (
              <img
                src={user.profilePicture}
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-gray-700 font-medium hidden sm:block">
              {user.displayName}
            </span>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            Logout
          </Button>
        </>
      ) : null}{" "}
      {/* This area is null if user is not logged in, but the GSI button is managed below */}
      {/*
                This div acts as the container for the Google Sign-In button.
                Its visibility is explicitly controlled by the useEffect hook based on 'user' state.
                GSI will render into this div.
            */}
      <div ref={googleButtonContainerRef}></div>
    </div>
  );
};

export default AuthDisplay;
