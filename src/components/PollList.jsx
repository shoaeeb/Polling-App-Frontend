// src/components/PollList.jsx
import React from "react";
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

// Added onViewDetails prop to enable navigation to detail page
const PollList = ({
  polls,
  user,
  handleVote,
  hasVoted,
  handleDeletePoll,
  onViewDetails,
}) => {
  if (polls.length === 0) {
    return (
      <p className="text-center text-gray-600">
        No polls available. Create one!
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {polls.map((poll) => (
        <Card key={poll._id}>
          <CardHeader>
            <CardTitle>{poll.question}</CardTitle>
            <CardDescription>
              Created by {poll.createdBy?.displayName || "Unknown"} at{" "}
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
          <CardFooter className="justify-between items-center">
            {/* New "View Details" button */}
            <Button
              onClick={() => onViewDetails(poll._id)}
              variant="ghost"
              size="sm"
            >
              View Details
            </Button>
            {user && poll.createdBy?._id === user._id && (
              <Button
                onClick={() => handleDeletePoll(poll._id)}
                variant="destructive"
                size="sm"
              >
                Delete Poll
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default PollList;
