// src/App.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";

// Import Shadcn/UI components (paths relative to src/)
import { Button } from "./components/ui/button.jsx";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "./components/ui/card.jsx";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "./components/ui/alert-dialog.jsx";

// Import custom components (paths relative to src/)
import AuthDisplay from "./components/AuthDisplay.jsx";
import CreatePollForm from "./components/CreatePollForm.jsx";
import PollList from "./components/PollList.jsx";
import PollDetailPage from "./components/PollDetailPage.jsx"; // New import for the detail page

function App() {
  const [user, setUser] = useState(null);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [selectedPollId, setSelectedPollId] = useState(null); // State to manage viewing a single poll

  // State for managing the Shadcn AlertDialog (open status and content)
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: null,
    onCancel: null,
    showCancelButton: true,
    confirmButtonText: "Continue",
    cancelButtonText: "Cancel",
  });

  const backendUrl = import.meta.env.VITE_BASE_URL || "http://localhost:5000"; // Hardcoded for Canvas environment
  const googleClientId =
    "847555880822-p8g77l3c2q4n88mmjjnfdf73pi7qssq2.apps.googleusercontent.com"; // Your specific Client ID

  const socketRef = useRef(null);

  const fetchAllPolls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${backendUrl}/api/polls`);
      setPolls(res.data);
    } catch (err) {
      console.error("Failed to fetch polls:", err);
      setError("Failed to fetch polls.");
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  const handleCredentialResponse = useCallback(
    async (response) => {
      if (response.credential) {
        const idToken = response.credential;
        try {
          const res = await axios.post(`${backendUrl}/api/auth/google-login`, {
            idToken,
          });
          setUser(res.data.user);
          localStorage.setItem("googleIdToken", idToken);
          console.log("Login successful:", res.data.user);
          fetchAllPolls(); // Re-fetch polls after login to get potentially new data
        } catch (err) {
          console.error(
            "Backend Google login failed:",
            err.response ? err.response.data : err.message
          );
          setError(
            err.response ? err.response.data.message : "Google login failed"
          );
          setUser(null);
          localStorage.removeItem("googleIdToken");
        }
      }
    },
    [backendUrl, fetchAllPolls]
  );

  // Initialize Socket.io connection and listeners
  useEffect(() => {
    socketRef.current = io(backendUrl);

    socketRef.current.on("connect", () => {
      console.log("Connected to Socket.io server!");
    });

    socketRef.current.on("poll-updated", (updatedPoll) => {
      console.log("Real-time poll update received:", updatedPoll);
      setPolls((prevPolls) =>
        prevPolls.map((poll) =>
          poll._id === updatedPoll._id ? updatedPoll : poll
        )
      );
      // If the currently viewed detail page poll is updated, update its state too
      // Note: PollDetailPage also fetches its own data, so this might cause double updates
      // A more robust solution might involve context or a global state management library.
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from Socket.io server.");
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [backendUrl]); // Removed selectedPollId from dependencies to avoid re-initializing socket

  // Fetch polls on initial load and check for existing session
  useEffect(() => {
    const storedToken = localStorage.getItem("googleIdToken");
    if (storedToken) {
      const checkUserSession = async () => {
        try {
          // Attempt to get user data from backend using stored token
          const res = await axios.post(`${backendUrl}/api/auth/google-login`, {
            idToken: storedToken,
          });
          setUser(res.data.user);
        } catch (err) {
          console.error("Re-authentication failed:", err);
          setUser(null);
          localStorage.removeItem("googleIdToken");
        } finally {
          fetchAllPolls(); // Always fetch polls after session check
        }
      };
      checkUserSession();
    } else {
      fetchAllPolls(); // Fetch polls publicly if no stored token
    }
  }, [backendUrl, fetchAllPolls]);

  const handleVote = async (pollId, optionId) => {
    if (!user) {
      setAlertConfig({
        isOpen: true,
        title: "Not Logged In",
        description: "Please sign in to vote on polls.",
        onConfirm: () => setAlertConfig((prev) => ({ ...prev, isOpen: false })),
        showCancelButton: false,
        confirmButtonText: "OK",
      });
      return;
    }

    setError(null);
    try {
      const token = localStorage.getItem("googleIdToken");
      const res = await axios.put(
        `${backendUrl}/api/polls/${pollId}/vote`,
        { optionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update the specific poll in the main list
      setPolls((prevPolls) =>
        prevPolls.map((poll) => (poll._id === res.data._id ? res.data : poll))
      );
      // Update user's voted polls in local state
      setUser((prevUser) => ({
        ...prevUser,
        votedPolls: [
          ...(prevUser?.votedPolls || []),
          { poll: pollId, optionId },
        ],
      }));
    } catch (err) {
      console.error(
        "Vote failed:",
        err.response ? err.response.data : err.message
      );
      setAlertConfig({
        isOpen: true,
        title: "Voting Error",
        description: err.response
          ? err.response.data.message
          : "An error occurred while voting.",
        onConfirm: () => setAlertConfig((prev) => ({ ...prev, isOpen: false })),
        showCancelButton: false,
        confirmButtonText: "OK",
      });
    }
  };

  // Check if the current user has already voted on a specific poll
  const hasVoted = (pollId) => {
    return user?.votedPolls.some((v) => v.poll === pollId) || false;
  };

  const handleDeletePoll = async (pollId) => {
    console.log("handleDeletePoll triggered for pollId:", pollId);

    setAlertConfig({
      isOpen: true,
      title: "Confirm Deletion",
      description:
        "Are you sure you want to delete this poll? This action cannot be undone.",
      onConfirm: async () => {
        setAlertConfig((prev) => ({ ...prev, isOpen: false })); // Close dialog immediately
        setError(null);
        try {
          const token = localStorage.getItem("googleIdToken");
          await axios.delete(`${backendUrl}/api/polls/${pollId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setPolls((prevPolls) =>
            prevPolls.filter((poll) => poll._id !== pollId)
          ); // Remove from list
          // If the deleted poll was the one being viewed, navigate back to the list view
          if (selectedPollId === pollId) {
            setSelectedPollId(null);
          }
        } catch (err) {
          console.error(
            "Delete failed:",
            err.response ? err.response.data : err.message
          );
          setAlertConfig({
            isOpen: true,
            title: "Deletion Error",
            description: err.response
              ? err.response.data.message
              : "An error occurred while deleting the poll.",
            onConfirm: () =>
              setAlertConfig((prev) => ({ ...prev, isOpen: false })),
            showCancelButton: false,
            confirmButtonText: "OK",
          });
        }
      },
      onCancel: () => setAlertConfig((prev) => ({ ...prev, isOpen: false })), // Handler for cancel button
      showCancelButton: true,
      confirmButtonText: "Delete", // Custom text for confirm button
    });
  };

  const handleCreatePollSubmit = async (question, options) => {
    if (!user) {
      setAlertConfig({
        isOpen: true,
        title: "Not Logged In",
        description: "Please sign in to create polls.",
        onConfirm: () => setAlertConfig((prev) => ({ ...prev, isOpen: false })),
        showCancelButton: false,
        confirmButtonText: "OK",
      });
      return;
    }

    setError(null);
    try {
      const token = localStorage.getItem("googleIdToken");
      const res = await axios.post(
        `${backendUrl}/api/polls`,
        { question, options },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPolls([res.data, ...polls]); // Add new poll to the top of the list
      setShowCreatePoll(false); // Hide the form after successful creation
    } catch (err) {
      console.error(
        "Create poll failed:",
        err.response ? err.response.data : err.message
      );
      setAlertConfig({
        isOpen: true,
        title: "Creation Error",
        description: err.response
          ? err.response.data.message
          : "An error occurred while creating the poll.",
        onConfirm: () => setAlertConfig((prev) => ({ ...prev, isOpen: false })),
        showCancelButton: false,
        confirmButtonText: "OK",
      });
    }
  };

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("googleIdToken");
    if (window.google && user?.email) {
      window.google.accounts.id.revoke(user.email, (done) => {
        console.log("Consent revoked for user:", user.email, done);
      });
    }
    setPolls((prevPolls) =>
      prevPolls.map((poll) => ({ ...poll, votedByUser: false }))
    ); // Clear local vote status
    fetchAllPolls(); // Re-fetch polls in public mode after logout
  }, [user, fetchAllPolls]);

  // Handler to set the selected poll ID for detail view
  const handleViewDetails = useCallback((pollId) => {
    setSelectedPollId(pollId);
  }, []);

  // Handler to clear selected poll ID and go back to list view
  const handleBackToAllPolls = useCallback(() => {
    setSelectedPollId(null);
    fetchAllPolls(); // Re-fetch all polls to ensure latest data on return from detail view
  }, [fetchAllPolls]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8 font-inter">
      <header className="w-full max-w-2xl bg-white p-6 rounded-xl shadow-md flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Polling App</h1>
        <AuthDisplay
          user={user}
          handleLogout={handleLogout}
          handleCredentialResponse={handleCredentialResponse}
          googleClientId={googleClientId}
        />
      </header>

      <main className="w-full max-w-2xl">
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Conditional rendering: show PollDetailPage if a poll is selected, otherwise show main list/create form */}
        {selectedPollId ? (
          <PollDetailPage
            pollId={selectedPollId}
            user={user}
            onBack={handleBackToAllPolls}
            handleVote={handleVote}
            hasVoted={hasVoted}
            handleDeletePoll={handleDeletePoll}
            setAlertDialog={setAlertConfig} // Pass setAlertConfig to detail page
          />
        ) : (
          <>
            {user && (
              <CreatePollForm
                user={user}
                handleCreatePoll={handleCreatePollSubmit}
                setShowCreatePoll={setShowCreatePoll}
                showCreatePoll={showCreatePoll}
                setAlertDialog={setAlertConfig} // Pass setAlertConfig to create form
              />
            )}

            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Available Polls
            </h2>

            {loading ? (
              <p className="text-center text-gray-600">Loading polls...</p>
            ) : (
              <PollList
                polls={polls}
                user={user}
                handleVote={handleVote}
                hasVoted={hasVoted}
                handleDeletePoll={handleDeletePoll}
                onViewDetails={handleViewDetails} // Pass the handler for viewing poll details
              />
            )}
          </>
        )}
      </main>

      {/* Global AlertDialog component rendered outside the main content flow */}
      {/* Control the open state directly with alertConfig.isOpen */}
      <AlertDialog
        open={alertConfig.isOpen}
        onOpenChange={(open) =>
          setAlertConfig((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {alertConfig.showCancelButton && alertConfig.onCancel && (
              <AlertDialogCancel onClick={alertConfig.onCancel}>
                {alertConfig.cancelButtonText}
              </AlertDialogCancel>
            )}
            {alertConfig.onConfirm && (
              <AlertDialogAction onClick={alertConfig.onConfirm}>
                {alertConfig.confirmButtonText}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default App;
