import React, { useState } from "react";
import { Box, Paper, Typography, TextField, Button } from "@mui/material";

const API_URL = import.meta.env.VITE_API_URL;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => { //funct contacts backend
    setMessage("");
    setError("");

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.message || "Something went wrong.");
      } else {
        setMessage(
          data?.message ||
            "If an account with that email exists, a reset link has been sent."
        );
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        bgcolor: "#f5f5f5",
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "10.6cm",
          maxWidth: "92vw",
          p: 4,
          borderRadius: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 500, mb: 2 }}>
          Forgot password
        </Typography>

        <Typography variant="body2" sx={{ mb: 2 }}>
          Enter the email associated with your account and we&apos;ll send you a
          password reset link.
        </Typography>

        <TextField
          label="Email"
          fullWidth
          variant="outlined"
          sx={{ mb: 2 }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button
          variant="contained"
          fullWidth
          onClick={handleSubmit}
          disabled={isSubmitting}
          sx={{ textTransform: "none" }}
        >
          {isSubmitting ? "Sending..." : "Send reset link"}
        </Button>

        {message && (
          <Typography sx={{ mt: 2, color: "green" }}>{message}</Typography>
        )}
        {error && <Typography sx={{ mt: 2, color: "red" }}>{error}</Typography>}
      </Paper>
    </Box>
  );
}
