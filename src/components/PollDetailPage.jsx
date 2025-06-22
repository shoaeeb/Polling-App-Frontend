// src/components/PollDetailPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Button } from "./ui/button.jsx"; // Correct path: from components/ to components/ui/
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card.jsx"; // Correct path: from components/ to components/ui/
import { Progress } from "./ui/progress.jsx"; // Correct path: from components/ to components/ui/

const PollDetailPage = ({
  pollId,
  user,
  onBack,
  handleVote,
  hasVoted,
  handleDeletePoll,
}) => {
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const backendUrl = import.meta.env.VITE_BASE_URL; // Consistent with App.jsx and backend .env

  const fetchPollDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${backendUrl}/api/polls/${pollId}`);
      setPoll(res.data);
    } catch (err) {
      console.error("Failed to fetch poll details:", err);
      setError(
        "Failed to fetch poll details. Poll might not exist or network issue."
      );
    } finally {
      setLoading(false);
    }
  }, [pollId, backendUrl]);

  useEffect(() => {
    if (pollId) {
      fetchPollDetails();
    }
  }, [pollId, fetchPollDetails]);

  // Handle real-time updates for this specific poll:
  // In a full application, you would set up a Socket.io listener here
  // to update `poll` state directly if a 'poll-updated' event for `pollId` arrives.
  // For now, we rely on the parent `App.jsx` handling global updates and the `pollId` prop.

  if (loading) {
    return <p className="text-center text-gray-600">Loading poll details...</p>;
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        <p>{error}</p>
        <Button onClick={onBack} className="mt-4">
          Back to All Polls
        </Button>
      </div>
    );
  }

  if (!poll) {
    // This case should ideally be caught by error, but as a fallback
    return (
      <div className="text-center text-gray-600">
        <p>Poll data not available.</p>
        <Button onClick={onBack} className="mt-4">
          Back to All Polls
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button onClick={onBack} variant="outline" className="mb-4">
        ← Back to All Polls
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{poll.question}</CardTitle>
          <CardDescription>
            Created by {poll.createdBy?.displayName || "Unknown"} on{" "}
            {new Date(poll.createdAt).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {poll.options.map((option) => {
              const totalVotes = poll.options.reduce(
                (sum, opt) => sum + opt.votes,
                0
              );
              const percentage =
                totalVotes === 0 ? 0 : (option.votes / totalVotes) * 100;
              const votedForThisOption =
                user &&
                user.votedPolls.some(
                  (v) => v.poll === poll._id && v.optionId === option._id
                );

              return (
                <div key={option._id} className="flex flex-col space-y-1">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span>{option.text}</span>
                    <span className="text-gray-600">
                      {option.votes} votes ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="w-full" />
                  <Button
                    onClick={() => handleVote(poll._id, option._id)}
                    disabled={!user || hasVoted(poll._id)}
                    variant={votedForThisOption ? "secondary" : "outline"}
                    className="w-full mt-2"
                  >
                    {votedForThisOption ? "Voted" : "Vote"}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
        {user && poll.createdBy?._id === user._id && (
          <CardFooter className="justify-end">
            <Button
              onClick={() => handleDeletePoll(poll._id)}
              variant="destructive"
              size="sm"
            >
              Delete Poll
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default PollDetailPage;
