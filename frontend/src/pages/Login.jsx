import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import { useAuth } from "../hooks/useAuth";
import { authAPI } from "../utils/api";
import NotificationSnackbar from "../components/NotificationSnackbar";

/**
 * Login Component
 * Allows users to login with email and password
 */
const Login = () => {
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Get login function from auth context
  const { login } = useAuth();
  const navigate = useNavigate();

  /**
   * Handle form submission
   * Calls login API and stores token on success
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Call login API
      const response = await authAPI.login(email, password);
      const { token } = response.data;
      // Store token and email using auth context
      login(token, email);
      // Navigate to landing page on success
      navigate("/");
    } catch (err) {
      // Display error message on failure
      const errorMessage =
        err.response?.data?.error ||
        "Login failed. Please check your credentials.";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
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
        <Button onClick={() => navigate("/")} sx={{ mb: 2 }}>
          ← Back to Main Page
        </Button>

        <Paper elevation={3} sx={{ padding: 4, width: "100%" }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Login
          </Typography>

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

      {/* Snackbar for notifications */}
      <NotificationSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </Container>
  );
};

export default Login;
