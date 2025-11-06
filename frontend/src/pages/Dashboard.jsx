import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Container,
  Typography,
  Box,
  Paper,
  Stack,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../utils/api";

/**
 * Dashboard Component
 * Main dashboard with navigation options to different sections
 */
const Dashboard = () => {
  // Get auth functions from context
  const { logout, token } = useAuth();
  const navigate = useNavigate();

  /**
   * Check if token exists in localStorage
   * If user manually deletes token, logout and redirect to login
   */
  const checkToken = async () => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken || !token) {
      try {
        await authAPI.logout();
      } catch (err) {
        // Ignore error if logout API fails
        console.error("Logout API failed:", err);
      } finally {
        logout();
        navigate("/login");
      }
    }
  };

  useEffect(() => {
    checkToken();
  }, [token]);

  /**
   * Handle user logout
   * Calls logout API and clears authentication state
   */
  const handleLogout = async () => {
    await authAPI.logout();
    logout();
    navigate("/login");
  };

  /**
   * Navigate to hosted listings page
   */
  const handleViewHostedListings = () => {
    navigate("/hosted-listings");
  };

  /**
   * Navigate to all listings page
   */
  const handleViewAllListings = () => {
    navigate("/all-listings");
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
            Airbrb
          </Typography>

          <Typography
            variant="body1"
            align="center"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Welcome back! Choose an option below
          </Typography>

          <Stack spacing={2}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleViewHostedListings}
              sx={{ mt: 2 }}
            >
              🏡 My Hosted Listings
            </Button>

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleViewAllListings}
            >
              🗂️ Browse All Listings
            </Button>

            <Button
              variant="outlined"
              size="large"
              fullWidth
              onClick={handleLogout}
              sx={{ mt: 1 }}
            >
              🚪 Logout
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
};

export default Dashboard;
