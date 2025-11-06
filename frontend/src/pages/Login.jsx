import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  Paper,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../utils/api";

/**
 * Login Component
 * Allows users to login with email and password
 */
const Login = () => {
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Get login function from auth context
  const { login } = useAuth();
  const navigate = useNavigate();

  /**
   * Handle form submission
   * Calls login API and stores token on success
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Call login API
      const response = await authAPI.login(email, password);
      const { token } = response.data;
      // Store token and email using auth context
      login(token, email);
      // Navigate to dashboard on success
      navigate("/dashboard");
    } catch (err) {
      // Display error message on failure
      const errorMessage =
        err.response?.data?.error ||
        "Login failed. Please check your credentials.";
      setError(errorMessage);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: "100%" }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Login
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Login
            </Button>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2">
                Don't have an account?{" "}
                <Button
                  variant="text"
                  onClick={() => navigate("/register")}
                  sx={{
                    textTransform: "none",
                    "&:hover": {
                      textDecoration: "underline",
                      backgroundColor: "transparent",
                      boxShadow: "none",
                    },
                  }}
                >
                  Register here
                </Button>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
