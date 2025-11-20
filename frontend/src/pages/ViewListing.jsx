import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Rating,
  Chip,
  Paper,
  Divider,
  ImageList,
  ImageListItem,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { listingsAPI, bookingsAPI } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import BookingDialog from "../components/BookingDialog";
import ReviewDialog from "../components/ReviewDialog";
import NotificationSnackbar from "../components/NotificationSnackbar";
import RatingFilterDialog from "../components/RatingFilterDialog";
import NavigationBar from "../components/NavigationBar";

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
  const [userBookings, setUserBookings] = useState([]);
  const [ratingFilterOpen, setRatingFilterOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(null);

  // Booking states
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
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

  // Fetch user bookings if logged in
  useEffect(() => {
    const fetchUserBookings = async () => {
      if (!token || !userEmail) {
        setUserBookings([]);
        return;
      }

      try {
        const response = await bookingsAPI.getAllBookings();
        setUserBookings(response.data.bookings || []);
      } catch (err) {
        console.error("Failed to fetch user bookings:", err);
        setUserBookings([]);
      }
    };

    fetchUserBookings();
  }, [token, userEmail]);

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
   * Calculate rating breakdown (count and percentage for each star rating)
   */
  const calculateRatingBreakdown = (reviews) => {
    if (!reviews || reviews.length === 0) {
      return [0, 0, 0, 0, 0];
    }

    const breakdown = [0, 0, 0, 0, 0]; // Index 0 = 5 stars, Index 4 = 1 star
    reviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        breakdown[5 - review.rating]++;
      }
    });

    return breakdown;
  };

  /**
   * Generate tooltip content for rating breakdown
   */
  const getRatingTooltipContent = () => {
    if (!listing?.reviews || listing.reviews.length === 0) {
      return "No reviews yet";
    }

    const breakdown = calculateRatingBreakdown(listing.reviews);
    const total = listing.reviews.length;

    return (
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
          Rating Breakdown
        </Typography>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = breakdown[5 - star];
          const percentage = ((count / total) * 100).toFixed(1);
          return (
            <Box
              key={star}
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 0.5,
                fontSize: "0.875rem",
              }}
            >
              <Typography variant="body2" sx={{ minWidth: 50 }}>
                {star} ★
              </Typography>
              <Typography variant="body2" sx={{ ml: 1 }}>
                {count} ({percentage}%)
              </Typography>
            </Box>
          );
        })}
      </Box>
    );
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
    if (!userEmail || !userBookings || userBookings.length === 0) return [];

    const filteredBookings = userBookings.filter(
      (booking) =>
        String(booking.listingId) === String(listingId) &&
        booking.owner === userEmail
    );

    // Sort by start date (earliest first)
    return filteredBookings.sort((a, b) => {
      const dateA = new Date(a.dateRange?.start || 0);
      const dateB = new Date(b.dateRange?.start || 0);
      return dateA - dateB;
    });
  };

  /**
   * Get accepted booking ID for leaving a review
   */
  const getAcceptedBookingId = () => {
    if (!userEmail || !userBookings || userBookings.length === 0) return null;

    const acceptedBooking = userBookings.find(
      (booking) =>
        String(booking.listingId) === String(listingId) &&
        booking.owner === userEmail &&
        booking.status === "accepted"
    );

    return acceptedBooking?.id || null;
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
   * Submit review
   */
  const handleSubmitReview = async (rating, comment) => {
    const bookingId = getAcceptedBookingId();

    if (!bookingId) {
      setSnackbar({
        open: true,
        message: "You need an accepted booking to leave a review",
        severity: "error",
      });
      return;
    }

    try {
      await listingsAPI.leaveReview(listingId, bookingId, {
        rating,
        comment,
        owner: userEmail,
      });

      setSnackbar({
        open: true,
        message: "Review submitted successfully!",
        severity: "success",
      });

      // Refresh listing to show new review
      const refreshResponse = await listingsAPI.getListingById(listingId);
      setListing(refreshResponse.data.listing);
    } catch (err) {
      console.error("Failed to submit review:", err);
      setSnackbar({
        open: true,
        message:
          err.response?.data?.error ||
          "Failed to submit review. Please try again.",
        severity: "error",
      });
    }
  };

  /**
   * Open cancel booking dialog
   */
  const handleCancelBooking = (booking) => {
    setBookingToCancel(booking);
    setCancelDialogOpen(true);
  };

  /**
   * Close cancel booking dialog
   */
  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
    setBookingToCancel(null);
  };

  /**
   * Confirm cancel booking
   */
  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;

    try {
      await bookingsAPI.deleteBooking(bookingToCancel.id);

      handleCloseCancelDialog();

      setSnackbar({
        open: true,
        message: "Booking cancelled successfully",
        severity: "success",
      });

      // Refresh user bookings to update Your Booking(s) section
      const response = await bookingsAPI.getAllBookings();
      setUserBookings(response.data.bookings || []);
    } catch (err) {
      console.error("Failed to cancel booking:", err);
      setSnackbar({
        open: true,
        message:
          err.response?.data?.error ||
          "Failed to cancel booking. Please try again.",
        severity: "error",
      });
    }
  };

  /**
   * Submit booking
   */
  const handleConfirmBooking = async (startDate, endDate, totalPrice) => {
    if (!startDate || !endDate) {
      setSnackbar({
        open: true,
        message: "Please select both start and end dates",
        severity: "error",
      });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

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
        start: startDate,
        end: endDate,
      };

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

      setBookingDialogOpen(false);

      // Refresh listing to show new booking
      const refreshResponse = await listingsAPI.getListingById(listingId);
      setListing(refreshResponse.data.listing);

      // Refresh user bookings to update Your Booking(s) section
      const bookingsResponse = await bookingsAPI.getAllBookings();
      setUserBookings(bookingsResponse.data.bookings || []);
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
  const myBookings = getUserBookings();

  // Collect all images (thumbnail + property images)
  const allImages = [
    listing.thumbnail,
    ...(listing.metadata?.propertyImages || []),
  ].filter(Boolean);

  return (
    <Box>
      {/* Navigation Bar */}
      {token ? (
        <NavigationBar title={listing?.title || "Listing Details"} />
      ) : (
        <NavigationBar title={listing?.title || "Listing Details"} />
      )}

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
          {token && myBookings.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom>
                Your Booking(s)
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {myBookings.map((booking, index) => (
                  <Card key={booking.id} variant="outlined">
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
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          fullWidth
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelBooking(booking);
                          }}
                        >
                          Cancel
                        </Button>
                      </Box>
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
              onClick={() => setBookingDialogOpen(true)}
            >
              Book Now
            </Button>
          )}
        </Paper>

        {/* Reviews Section */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">Reviews ({totalReviews})</Typography>
            {token && getAcceptedBookingId() && (
              <Button
                variant="contained"
                onClick={() => setReviewDialogOpen(true)}
              >
                Leave a Review
              </Button>
            )}
          </Box>
          <Tooltip
            title={getRatingTooltipContent()}
            arrow
            placement="right"
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: "white",
                  color: "text.primary",
                  boxShadow: 3,
                  border: "1px solid #ddd",
                  maxWidth: 300,
                },
              },
            }}
          >
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                mb: 2,
                cursor: listing?.reviews?.length > 0 ? "pointer" : "default",
                "&:hover": {
                  opacity: listing?.reviews?.length > 0 ? 0.8 : 1,
                },
              }}
              onClick={() => {
                if (listing?.reviews?.length > 0) {
                  // Open dialog showing all ratings breakdown
                  setSelectedRating(null); // null means show all ratings
                  setRatingFilterOpen(true);
                }
              }}
            >
              <Rating value={averageRating} precision={0.5} readOnly />
              <Typography variant="body1" sx={{ ml: 1 }}>
                {averageRating.toFixed(1)} average rating
              </Typography>
            </Box>
          </Tooltip>

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
      <BookingDialog
        open={bookingDialogOpen}
        onClose={() => setBookingDialogOpen(false)}
        onConfirm={handleConfirmBooking}
        minDate={getMinAvailableDate()}
        maxDate={getMaxAvailableDate()}
        pricePerNight={listing.price}
      />

      {/* Review Dialog */}
      <ReviewDialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        onSubmit={handleSubmitReview}
        listingTitle={listing.title}
      />

      {/* Cancel Booking Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onClose={handleCloseCancelDialog}>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this booking? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog}>Cancel</Button>
          <Button onClick={handleConfirmCancel} color="error" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rating Filter Dialog */}
      <RatingFilterDialog
        open={ratingFilterOpen}
        onClose={() => setRatingFilterOpen(false)}
        selectedRating={selectedRating}
        onSelectRating={setSelectedRating}
        reviews={listing?.reviews}
        userEmail={userEmail}
      />

      {/* Snackbar for notifications */}
      <NotificationSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </Box>
  );
};

export default ViewListing;
