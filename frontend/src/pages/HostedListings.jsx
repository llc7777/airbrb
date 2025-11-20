import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Button,
  Grid,
  Rating,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper,
} from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { listingsAPI, bookingsAPI } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import PublishDialog from "../components/PublishDialog";
import NotificationSnackbar from "../components/NotificationSnackbar";
import NavigationBar from "../components/NavigationBar";

/**
 * HostedListings Component
 * Displays all listings created by the current user
 */
const HostedListings = () => {
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [listingToPublish, setListingToPublish] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const navigate = useNavigate();
  const { userEmail } = useAuth();

  /**
   * Fetch all listings owned by the current user
   */
  const fetchHostedListings = async () => {
    if (!userEmail) return;

    try {
      const response = await listingsAPI.getAllListings();
      const allListings = response.data.listings;

      // Filter listings owned by current user
      const myListings = allListings.filter(
        (listing) => listing.owner === userEmail
      );

      // Fetch detailed information for each hosted listing using listing ID
      const detailedListings = await Promise.all(
        myListings.map(async (listing) => {
          try {
            // Call /listings/{listingid} API to get detailed info
            const detailResponse = await listingsAPI.getListingById(listing.id);
            return {
              id: listing.id,
              ...detailResponse.data.listing,
            };
          } catch (err) {
            console.error(`Failed to fetch details for ${listing.id}:`, err);
            // Return basic info if detail fetch fails
            return listing;
          }
        })
      );

      setListings(detailedListings);
    } catch (err) {
      console.error("Failed to fetch listings:", err);
    }
  };

  /**
   * Fetch all bookings
   */
  const fetchBookings = async () => {
    try {
      const response = await bookingsAPI.getAllBookings();
      setBookings(response.data.bookings || []);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
      setBookings([]);
    }
  };

  // Fetch all listings and bookings
  useEffect(() => {
    fetchHostedListings();
    fetchBookings();
  }, []);

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
   * Calculate profit data for the past 30 days
   */
  const calculateProfitData = () => {
    const today = new Date();
    const profitByDay = new Array(31).fill(0); // Index 0 = today, 30 = 30 days ago

    // Get listing IDs owned by current user
    const myListingIds = listings.map((listing) => String(listing.id));

    // Filter bookings for my listings that are accepted
    const acceptedBookings = bookings.filter(
      (booking) =>
        myListingIds.includes(String(booking.listingId)) &&
        booking.status === "accepted"
    );

    // Calculate profit for each day
    acceptedBookings.forEach((booking) => {
      const startDate = new Date(booking.dateRange.start);
      const endDate = new Date(booking.dateRange.end);
      const totalPrice = booking.totalPrice;
      console.log(totalPrice);

      // Calculate number of nights
      const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const pricePerNight = nights > 0 ? totalPrice / nights : 0;

      // For each night in the booking, add profit to the corresponding day
      for (
        let date = new Date(startDate);
        date <= endDate;
        date.setDate(date.getDate() + 1)
      ) {
        const daysAgo = Math.floor((today - date) / (1000 * 60 * 60 * 24));

        // Only count if within the last 30 days
        if (daysAgo >= 0 && daysAgo <= 30) {
          profitByDay[daysAgo] += pricePerNight;
        }
      }
    });

    return profitByDay;
  };

  /**
   * Get chart data for profit graph
   */
  const getChartData = () => {
    const profitData = calculateProfitData();

    // X-axis: days ago (30, 29, 28, ..., 1, 0)
    const xAxisData = Array.from({ length: 31 }, (_, i) => 30 - i);

    // Y-axis: profit for each day (reverse to match x-axis order)
    const yAxisData = profitData.slice().reverse();

    return { xAxisData, yAxisData };
  };

  /**
   * Handle edit listing - navigate to edit page
   */
  const handleEditListing = (listingId) => {
    navigate(`/listings/${listingId}/edit`);
  };

  /**
   * Open delete confirmation dialog
   */
  const handleDeleteClick = (listing) => {
    setListingToDelete(listing);
    setDeleteDialogOpen(true);
  };

  /**
   * Close delete confirmation dialog
   */
  const handleCloseDialog = () => {
    setDeleteDialogOpen(false);
    setListingToDelete(null);
  };

  /**
   * Confirm delete listing
   */
  const handleConfirmDelete = async () => {
    if (!listingToDelete) return;

    try {
      await listingsAPI.deleteListing(listingToDelete.id);
      // Remove from local state
      setListings(listings.filter((l) => l.id !== listingToDelete.id));
      handleCloseDialog();
      setSnackbar({
        open: true,
        message: "Listing deleted successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error("Failed to delete listing:", err);
      alert("Failed to delete listing. Please try again.");
    }
  };

  /**
   * Open publish dialog
   */
  const handlePublishClick = (listing) => {
    setListingToPublish(listing);
    setPublishDialogOpen(true);
  };

  /**
   * Close publish dialog
   */
  const handleClosePublishDialog = () => {
    setPublishDialogOpen(false);
    setListingToPublish(null);
  };

  /**
   * Confirm publish listing with availability ranges
   */
  const handleConfirmPublish = async (availability) => {
    if (!listingToPublish) return;

    try {
      await listingsAPI.publishListing(listingToPublish.id, availability);

      handleClosePublishDialog();

      // Refetch listings to get updated published status
      await fetchHostedListings();

      setSnackbar({
        open: true,
        message: "Listing published successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error("Failed to publish listing:", err);
      alert(
        err.response?.data?.error ||
          "Failed to publish listing. Please try again."
      );
    }
  };

  /**
   * Handle unpublish listing
   */
  const handleUnpublish = async (listingId) => {
    try {
      await listingsAPI.unpublishListing(listingId);

      // Refetch listings to get updated published status
      await fetchHostedListings();

      setSnackbar({
        open: true,
        message: "Listing unpublished successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error("Failed to unpublish listing:", err);
      setSnackbar({
        open: true,
        message:
          err.response?.data?.error ||
          "Failed to unpublish listing. Please try again.",
        severity: "error",
      });
    }
  };

  return (
    <Box>
      {/* Navigation Bar */}
      <NavigationBar
        title="My Hosted Listings"
        showCreateButton={true}
        hideMyHosting={true}
      />

      {/* Main Content */}
      <Container sx={{ mt: 4, mb: 4 }}>
        {/* Profit Graph Section */}
        {listings.length > 0 && (
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Profit Over Last 30 Days
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Total profit from all your listings for each day
            </Typography>
            <Box sx={{ width: "100%", height: 400 }}>
              {(() => {
                const chartData = getChartData();
                return (
                  <LineChart
                    xAxis={[
                      {
                        data: chartData.xAxisData,
                        label: "Days Ago (0 = Today)",
                        scaleType: "linear",
                        reverse: true,
                      },
                    ]}
                    yAxis={[{}]}
                    series={[
                      {
                        data: chartData.yAxisData,
                        label: "Profit ($)",
                        showMark: true,
                      },
                    ]}
                    height={350}
                  />
                );
              })()}
            </Box>
          </Paper>
        )}

        {listings.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <Typography variant="h6" color="text.secondary">
              You don't have any hosted listings yet.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {listings.map((listing) => {
              const averageRating = calculateAverageRating(listing.reviews);
              const totalReviews = listing.reviews?.length || 0;

              return (
                <Grid item xs={12} sm={6} md={4} key={listing.id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition: "transform 0.2s",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 4,
                      },
                    }}
                  >
                    {listing.thumbnail?.includes("youtube.com/embed/") ? (
                      <Box sx={{ height: 200, width: "100%" }}>
                        <iframe
                          width="100%"
                          height="100%"
                          src={listing.thumbnail}
                          title={listing.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ border: 0 }}
                        />
                      </Box>
                    ) : (
                      <CardMedia
                        component="img"
                        height="200"
                        image={listing.thumbnail}
                        alt={listing.title}
                        sx={{ objectFit: "cover" }}
                      />
                    )}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {listing.title}
                      </Typography>

                      <Stack spacing={1} sx={{ mb: 2 }}>
                        <Chip
                          label={listing.metadata?.propertyType || "N/A"}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />

                        <Typography variant="body2" color="text.secondary">
                          🛏️ {listing.metadata?.beds || 0} Beds
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          🚿 {listing.metadata?.bathrooms || 0} Bathrooms
                        </Typography>

                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Rating
                            value={averageRating}
                            precision={0.5}
                            readOnly
                            size="small"
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ ml: 1 }}
                          >
                            ({totalReviews} reviews)
                          </Typography>
                        </Box>

                        <Typography variant="h6" color="primary">
                          ${listing.price} / night
                        </Typography>
                      </Stack>

                      <Stack spacing={1}>
                        {listing.published ? (
                          <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => handleUnpublish(listing.id)}
                          >
                            Unpublish
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            color="success"
                            fullWidth
                            onClick={() => handlePublishClick(listing)}
                          >
                            Publish
                          </Button>
                        )}

                        <Button
                          variant="contained"
                          color="info"
                          fullWidth
                          onClick={() =>
                            navigate(`/listings/${listing.id}/bookings`)
                          }
                        >
                          Manage Bookings
                        </Button>

                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => handleEditListing(listing.id)}
                        >
                          Edit Listing
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          fullWidth
                          onClick={() => handleDeleteClick(listing)}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Delete Listing</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{listingToDelete?.title}"? This
            action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Publish Dialog */}
      <PublishDialog
        open={publishDialogOpen}
        onClose={handleClosePublishDialog}
        onPublish={handleConfirmPublish}
        listingTitle={listingToPublish?.title || ""}
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

export default HostedListings;
