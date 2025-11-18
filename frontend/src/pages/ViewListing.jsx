import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Rating,
  Chip,
  Paper,
  Divider,
  AppBar,
  Toolbar,
  ImageList,
  ImageListItem,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { listingsAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

/**
 * ViewListing Component
 * Displays detailed information about a specific listing
 */
const ViewListing = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, userEmail } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Get search dates from URL state (passed from Landing page)
  const searchDates = location.state?.searchDates || null;

  useEffect(() => {
    const fetchListingDetails = async () => {
      try {
        const response = await listingsAPI.getListingById(listingId);
        setListing(response.data.listing);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch listing details:", err);
        setError("Failed to load listing details");
        setLoading(false);
      }
    };

    fetchListingDetails();
  }, [listingId]);

  /**
   * Calculate average rating from reviews
   */
  const calculateAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    const validReviews = reviews.filter((r) => r.rating);
    if (validReviews.length === 0) return 0;
    const sum = validReviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / validReviews.length;
  };

  /**
   * Calculate price per stay based on date range
   */
  const calculatePricePerStay = () => {
    if (!searchDates || !searchDates.startDate || !searchDates.endDate) {
      return null;
    }

    const start = new Date(searchDates.startDate);
    const end = new Date(searchDates.endDate);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    return {
      nights,
      totalPrice: listing.price * nights,
    };
  };

  /**
   * Get user's bookings for this listing
   */
  const getUserBookings = () => {
    if (!userEmail || !listing?.bookings) return [];

    return listing.bookings.filter((booking) => booking.owner === userEmail);
  };

  /**
   * Get status chip color based on booking status
   */
  const getStatusColor = (status) => {
    switch (status) {
      case "accepted":
        return "success";
      case "pending":
        return "warning";
      case "declined":
        return "error";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (error || !listing) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography color="error">{error || "Listing not found"}</Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/")}
          sx={{ mt: 2 }}
        >
          Back to Listings
        </Button>
      </Container>
    );
  }

  const averageRating = calculateAverageRating(listing.reviews);
  const totalReviews = listing.reviews?.length || 0;
  const priceInfo = calculatePricePerStay();
  const userBookings = getUserBookings();

  // Collect all images (thumbnail + property images)
  const allImages = [
    listing.thumbnail,
    ...(listing.metadata?.propertyImages || []),
  ].filter(Boolean);
};

export default ViewListing;
