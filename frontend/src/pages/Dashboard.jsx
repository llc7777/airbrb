import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Button,
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Grid,
  IconButton,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import HomeIcon from "@mui/icons-material/Home";
import ListIcon from "@mui/icons-material/List";
import { useAuth } from "../context/AuthContext";
import { authAPI, listingsAPI } from "../utils/api";

/**
 * Dashboard Component
 * Main dashboard showing all listings with navigation options
 */
const Dashboard = () => {
  // Component state
  const [listings, setListings] = useState([]);
  const [error, setError] = useState("");

  // Get logout function from auth context
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Fetch listings on component mount
  useEffect(() => {
    fetchListings();
  }, []);

  /**
   * Fetch all listings from API
   */
  const fetchListings = async () => {
    try {
      const response = await listingsAPI.getAllListings();
      setListings(response.data.listings);
    } catch (err) {
      setError("Failed to fetch listings");
      console.error(err);
    }
  };

  /**
   * Handle user logout
   * Calls logout API and clears authentication state
   */
  const handleLogout = async () => {
    try {
      await authAPI.logout();
      logout();
      navigate("/login");
    } catch (err) {
      // Still logout locally even if API call fails
      logout();
      navigate("/login");
    }
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
    <Box>
      {/* Navigation Bar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            AirBrB Dashboard
          </Typography>

          <Button
            color="inherit"
            startIcon={<HomeIcon />}
            onClick={handleViewHostedListings}
            sx={{ mr: 2 }}
          >
            My Hosted Listings
          </Button>

          <Button
            color="inherit"
            startIcon={<ListIcon />}
            onClick={handleViewAllListings}
            sx={{ mr: 2 }}
          >
            All Listings
          </Button>

          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to AirBrB
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {listings.map((listing) => (
            <Grid item xs={12} sm={6} md={4} key={listing.id}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image={listing.thumbnail}
                  alt={listing.title}
                  sx={{ objectFit: "cover" }}
                />
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {listing.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Owner: {listing.owner}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Price: ${listing.price} / night
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reviews: {listing.reviews?.length || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {listings.length === 0 && (
          <Typography sx={{ mt: 4 }}>No listings available</Typography>
        )}
      </Container>
    </Box>
  );
};

export default Dashboard;
