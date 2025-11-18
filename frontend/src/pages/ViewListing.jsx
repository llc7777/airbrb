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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { listingsAPI, bookingsAPI } from "../utils/api";
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

  // Booking states
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingStartDate, setBookingStartDate] = useState("");
  const [bookingEndDate, setBookingEndDate] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

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

  /**
   * Get earliest available date
   */
  const getMinAvailableDate = () => {
    if (!listing?.availability || listing.availability.length === 0) {
      return new Date().toISOString().split("T")[0];
    }

    const allStartDates = listing.availability.map(
      (range) => new Date(range.start)
    );
    const minDate = new Date(Math.min(...allStartDates));

    return minDate.toISOString().split("T")[0];
  };

  /**
   * Get latest available date
   */
  const getMaxAvailableDate = () => {
    if (!listing?.availability || listing.availability.length === 0) {
      return undefined;
    }

    const allEndDates = listing.availability.map(
      (range) => new Date(range.end)
    );
    const maxDate = new Date(Math.max(...allEndDates));

    return maxDate.toISOString().split("T")[0];
  };

  /**
   * Open booking dialog
   */
  const handleOpenBookingDialog = () => {
    // Pre-fill dates if they came from search
    if (searchDates) {
      setBookingStartDate(searchDates.startDate || "");
      setBookingEndDate(searchDates.endDate || "");
    }
    setBookingDialogOpen(true);
  };

  /**
   * Close booking dialog
   */
  const handleCloseBookingDialog = () => {
    setBookingDialogOpen(false);
    setBookingStartDate("");
    setBookingEndDate("");
  };

  /**
   * Calculate total price for booking
   */
  const calculateBookingPrice = () => {
    if (!bookingStartDate || !bookingEndDate) return 0;

    const start = new Date(bookingStartDate);
    const end = new Date(bookingEndDate);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    return listing.price * nights;
  };

  /**
   * Submit booking
   */
  const handleConfirmBooking = async () => {
    if (!bookingStartDate || !bookingEndDate) {
      setSnackbar({
        open: true,
        message: "Please select both start and end dates",
        severity: "error",
      });
      return;
    }

    const start = new Date(bookingStartDate);
    const end = new Date(bookingEndDate);

    if (start >= end) {
      setSnackbar({
        open: true,
        message: "End date must be after start date",
        severity: "error",
      });
      return;
    }

    try {
      const dateRange = {
        start: bookingStartDate,
        end: bookingEndDate,
      };
      const totalPrice = calculateBookingPrice();

      const response = await bookingsAPI.createBooking(
        listingId,
        dateRange,
        totalPrice
      );

      setSnackbar({
        open: true,
        message: `Booking confirmed! Booking ID: ${response.data.bookingId}`,
        severity: "success",
      });

      handleCloseBookingDialog();

      // Refresh listing to show new booking
      const refreshResponse = await listingsAPI.getListingById(listingId);
      setListing(refreshResponse.data.listing);
    } catch (err) {
      console.error("Failed to create booking:", err);
      setSnackbar({
        open: true,
        message:
          err.response?.data?.error ||
          "Failed to create booking. Please try again.",
        severity: "error",
      });
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
                  ${listing.price} × {priceInfo.nights} nights
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

          {/* User's Bookings */}
          {token && userBookings.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom>
                Your Booking(s)
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {userBookings.map((booking, index) => (
                  <Card key={index} variant="outlined">
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                        }}
                      >
                        <Typography variant="subtitle2">
                          Booking {index + 1}
                        </Typography>
                        <Chip
                          label={booking.status}
                          color={getStatusColor(booking.status)}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {booking.dateRange?.start} to {booking.dateRange?.end}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total: ${booking.totalPrice}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
              <Divider sx={{ my: 2 }} />
            </>
          )}

          {/* Book Now Button */}
          {token && (
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleOpenBookingDialog}
            >
              Book Now
            </Button>
          )}
        </Paper>

        {/* Reviews Section */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Reviews ({totalReviews})
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Rating value={averageRating} precision={0.5} readOnly />
            <Typography variant="body1" sx={{ ml: 1 }}>
              {averageRating.toFixed(1)} average rating
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {listing.reviews && listing.reviews.length > 0 ? (
            <>
              <Box>
                {(showAllReviews
                  ? listing.reviews
                  : listing.reviews.slice(0, 3)
                ).map((review, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Rating value={review.rating} size="small" readOnly />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ ml: 1 }}
                      >
                        by {review.owner}
                      </Typography>
                    </Box>
                    {review.comment && (
                      <Typography variant="body2">{review.comment}</Typography>
                    )}
                    <Divider sx={{ mt: 2 }} />
                  </Box>
                ))}
              </Box>
              {listing.reviews.length > 3 && (
                <Button
                  variant="text"
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  sx={{ mt: 1 }}
                >
                  {showAllReviews
                    ? "Show Less"
                    : `Show All ${listing.reviews.length} Reviews`}
                </Button>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No reviews yet
            </Typography>
          )}
        </Paper>
      </Container>

      {/* Booking Dialog */}
      <Dialog
        open={bookingDialogOpen}
        onClose={handleCloseBookingDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Make a Booking</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="Check-in Date"
              type="date"
              value={bookingStartDate}
              onChange={(e) => setBookingStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: getMinAvailableDate(),
                max: getMaxAvailableDate(),
              }}
              fullWidth
            />
            <TextField
              label="Check-out Date"
              type="date"
              value={bookingEndDate}
              onChange={(e) => setBookingEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: getMinAvailableDate(),
                max: getMaxAvailableDate(),
              }}
              fullWidth
            />
            {bookingStartDate && bookingEndDate && (
              <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Nights:{" "}
                  {Math.ceil(
                    (new Date(bookingEndDate) - new Date(bookingStartDate)) /
                      (1000 * 60 * 60 * 24)
                  )}
                </Typography>
                <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                  Total: ${calculateBookingPrice()}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBookingDialog}>Cancel</Button>
          <Button onClick={handleConfirmBooking} variant="contained">
            Confirm Booking
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ViewListing;
