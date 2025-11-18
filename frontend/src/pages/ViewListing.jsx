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

  return (
    <Box>
      {/* Navigation Bar */}
      <AppBar position="static">
        <Toolbar>
          <Button
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/")}
          >
            Back to Listings
          </Button>
          <Typography variant="h6" sx={{ flexGrow: 1, textAlign: "center" }}>
            {listing.title}
          </Typography>
          {token ? (
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => navigate("/dashboard")}
              sx={{
                borderColor: "rgba(255, 255, 255, 0.5)",
                "&:hover": {
                  borderColor: "white",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              My Dashboard
            </Button>
          ) : (
            <>
              <Button color="inherit" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button color="inherit" onClick={() => navigate("/register")}>
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container sx={{ mt: 4, mb: 4 }}>
        {/* Images Section */}
        {allImages.length > 0 && (
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <ImageList cols={2} gap={8} sx={{ maxHeight: 600 }}>
              {allImages.map((image, index) => (
                <ImageListItem key={index}>
                  {image.includes("youtube.com/embed/") ? (
                    <Box sx={{ height: 200, width: "100%" }}>
                      <iframe
                        width="100%"
                        height="100%"
                        src={image}
                        title={`${listing.title} - Image ${index + 1}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ border: 0 }}
                      />
                    </Box>
                  ) : (
                    <img
                      src={image}
                      alt={`${listing.title} - Image ${index + 1}`}
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: 200,
                        objectFit: "cover",
                        borderRadius: 4,
                      }}
                    />
                  )}
                </ImageListItem>
              ))}
            </ImageList>
          </Paper>
        )}

        {/* Listing Details Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            {listing.title}
          </Typography>

          <Typography variant="body1" color="text.secondary" gutterBottom>
            📍{" "}
            {listing.address
              ? `${listing.address.street || ""}, ${
                  listing.address.city || ""
                }, ${listing.address.state || ""} ${
                  listing.address.postcode || ""
                }`.trim()
              : "Address not available"}
          </Typography>

          <Box sx={{ my: 2 }}>
            <Chip
              label={listing.metadata?.propertyType || "N/A"}
              color="primary"
              sx={{ mr: 1 }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Price */}
          <Box sx={{ mb: 2 }}>
            {priceInfo ? (
              <>
                <Typography variant="h5" color="primary">
                  ${priceInfo.totalPrice} total
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ${listing.price} × {priceInfo.nights} night(s)
                </Typography>
              </>
            ) : (
              <Typography variant="h5" color="primary">
                ${listing.price} / night
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Property Details */}
          <Typography variant="h6" gutterBottom>
            Property Details
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="body1">
              🛏️ {listing.metadata?.beds || 0} Bed(s)
            </Typography>
            <Typography variant="body1">
              🚪 {listing.metadata?.bedrooms?.length || 0} Bedroom(s)
            </Typography>
            <Typography variant="body1">
              🚿 {listing.metadata?.bathrooms || 0} Bathroom(s)
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Amenities */}
          {listing.metadata?.amenities &&
            listing.metadata.amenities.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom>
                  Amenities
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {listing.metadata.amenities.map((amenity, index) => (
                    <Chip key={index} label={amenity} variant="outlined" />
                  ))}
                </Box>
                <Divider sx={{ my: 2 }} />
              </>
            )}
        </Paper>
      </Container>
    </Box>
  );
};

export default ViewListing;
