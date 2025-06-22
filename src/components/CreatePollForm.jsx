// src/components/CreatePollForm.jsx
import React, { useState } from "react";
import { Button } from "./ui/button.jsx"; // Correct path: from components/ to components/ui/
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card.jsx"; // Correct path: from components/ to components/ui/
import { Input } from "./ui/input.jsx"; // Correct path: from components/ to components/ui/
import { Label } from "./ui/label.jsx"; // Correct path: from components/ to components/ui/
import { X } from "lucide-react";

const CreatePollForm = ({
  handleCreatePoll,
  setShowCreatePoll,
  showCreatePoll,
  setAlertDialog,
}) => {
  const [newPollQuestion, setNewPollQuestion] = useState("");
  const [newPollOptions, setNewPollOptions] = useState([
    { text: "" },
    { text: "" },
  ]);

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...newPollOptions];
    updatedOptions[index].text = value;
    setNewPollOptions(updatedOptions);
  };

  const addOptionField = () => {
    setNewPollOptions([...newPollOptions, { text: "" }]);
  };

  const removeOptionField = (index) => {
    const updatedOptions = newPollOptions.filter((_, i) => i !== index);
    setNewPollOptions(updatedOptions);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const validOptions = newPollOptions.filter((opt) => opt.text.trim() !== "");
    if (!newPollQuestion.trim() || validOptions.length < 2) {
      setAlertDialog({
        isOpen: true,
        title: "Validation Error",
        description:
          "Please provide a question and at least two non-empty options.",
        onConfirm: () => setAlertDialog((prev) => ({ ...prev, isOpen: false })),
        showCancelButton: false, // Ensure this matches AlertDialog's expected prop
        confirmButtonText: "OK",
      });
      return;
    }
    handleCreatePoll(newPollQuestion, validOptions);
    setNewPollQuestion("");
    setNewPollOptions([{ text: "" }, { text: "" }]);
    setShowCreatePoll(false);
  };

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Create New Poll</CardTitle>
        <Button
          onClick={() => setShowCreatePoll(!showCreatePoll)}
          variant="secondary"
          size="sm"
        >
          {showCreatePoll ? "Cancel" : "Create Poll"}
        </Button>
      </CardHeader>
      {showCreatePoll && (
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Poll Question</Label>
              <Input
                id="question"
                value={newPollQuestion}
                onChange={(e) => setNewPollQuestion(e.target.value)}
                placeholder="e.g., What's your favorite color?"
              />
            </div>
            <div className="space-y-2">
              <Label>Options</Label>
              {newPollOptions.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                  />
                  {newPollOptions.length > 2 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeOptionField(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addOptionField}
                className="w-full"
              >
                + Add Option
              </Button>
            </div>
            <Button type="submit" className="w-full">
              Create Poll
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
};

export default CreatePollForm;
