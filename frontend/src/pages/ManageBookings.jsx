import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Stack,
  Divider,
  AppBar,
  Toolbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { listingsAPI, bookingsAPI } from "../utils/api";
import NotificationSnackbar from "../components/NotificationSnackbar";

/**
 * ManageBookings Component
 * Displays booking requests and statistics for a specific listing
 */
const ManageBookings = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  /**
   * Fetch listing details and all bookings
   */
  useEffect(() => {
    fetchListingAndBookings();
  }, [listingId]);

  const fetchListingAndBookings = async () => {
    try {
      // Fetch listing details
      const listingResponse = await listingsAPI.getListingById(listingId);
      setListing(listingResponse.data.listing);

      // Fetch all bookings
      const bookingsResponse = await bookingsAPI.getAllBookings();
      const allBookings = bookingsResponse.data.bookings;

      // Filter bookings for this listing
      const listingBookings = allBookings.filter(
        (booking) => booking.listingId === listingId
      );

      setBookings(listingBookings);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setSnackbar({
        open: true,
        message: "Failed to load booking data",
        severity: "error",
      });
    }
  };

  /**
   * Handle accept booking request
   */
  const handleAcceptBooking = async (bookingId) => {
    try {
      await bookingsAPI.acceptBooking(bookingId);
      setSnackbar({
        open: true,
        message: "Booking accepted successfully!",
        severity: "success",
      });
      // Refresh bookings
      await fetchListingAndBookings();
    } catch (err) {
      console.error("Failed to accept booking:", err);
      setSnackbar({
        open: true,
        message: err.response?.data?.error || "Failed to accept booking",
        severity: "error",
      });
    }
  };

  /**
   * Handle decline booking request
   */
  const handleDeclineBooking = async (bookingId) => {
    try {
      await bookingsAPI.declineBooking(bookingId);
      setSnackbar({
        open: true,
        message: "Booking declined successfully!",
        severity: "success",
      });
      // Refresh bookings
      await fetchListingAndBookings();
    } catch (err) {
      console.error("Failed to decline booking:", err);
      setSnackbar({
        open: true,
        message: err.response?.data?.error || "Failed to decline booking",
        severity: "error",
      });
    }
  };

  /**
   * Calculate how long the listing has been online
   */
  const calculateDaysOnline = () => {
    if (!listing?.postedOn) return 0;
    const postedDate = new Date(listing.postedOn);
    const today = new Date();
    const diffTime = Math.abs(today - postedDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  /**
   * Calculate total days booked this year
   */
  const calculateDaysBookedThisYear = () => {
    const currentYear = new Date().getFullYear();
    let totalDays = 0;

    bookings
      .filter((booking) => booking.status === "accepted")
      .forEach((booking) => {
        const startDate = new Date(booking.dateRange.start);
        const endDate = new Date(booking.dateRange.end);

        // Check if booking overlaps with current year
        if (
          startDate.getFullYear() <= currentYear &&
          endDate.getFullYear() >= currentYear
        ) {
          const yearStart = new Date(currentYear, 0, 1);
          const yearEnd = new Date(currentYear, 11, 31);

          // Get overlap dates
          const overlapStart = startDate > yearStart ? startDate : yearStart;
          const overlapEnd = endDate < yearEnd ? endDate : yearEnd;

          // Calculate days
          const diffTime = overlapEnd - overlapStart;
          const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          totalDays += days;
        }
      });

    return totalDays;
  };

  /**
   * Calculate total profit this year
   */
  const calculateProfitThisYear = () => {
    const currentYear = new Date().getFullYear();
    let totalProfit = 0;

    bookings
      .filter((booking) => booking.status === "accepted")
      .forEach((booking) => {
        const startDate = new Date(booking.dateRange.start);
        const endDate = new Date(booking.dateRange.end);

        // Check if booking overlaps with current year
        if (
          startDate.getFullYear() <= currentYear &&
          endDate.getFullYear() >= currentYear
        ) {
          totalProfit += booking.totalPrice;
        }
      });

    return totalProfit;
  };

  /**
   * Format date range
   */
  const formatDateRange = (dateRange) => {
    const start = new Date(dateRange.start).toLocaleDateString();
    const end = new Date(dateRange.end).toLocaleDateString();
    return `${start} - ${end}`;
  };

  /**
   * Get status chip color
   */
  const getStatusColor = (status) => {
    switch (status) {
      case "accepted":
        return "success";
      case "declined":
        return "error";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  /**
   * Separate pending and history bookings
   */
  const pendingBookings = bookings.filter(
    (booking) => booking.status === "pending"
  );
  const bookingHistory = bookings.filter(
    (booking) => booking.status !== "pending"
  );

  if (!listing) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <>
      {/* App Bar */}
      <AppBar position="static">
        <Toolbar>
          <Button color="inherit" onClick={() => navigate("/dashboard")}>
            ← Back to Dashboard
          </Button>
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 2 }}>
            Manage Bookings: {listing.title}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4, mb: 4 }}>
        {/* Listing Statistics */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Listing Statistics
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="h4" color="primary">
                    {calculateDaysOnline()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Days Online
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="h4" color="primary">
                    {calculateDaysBookedThisYear()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Days Booked This Year
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="h4" color="primary">
                    ${calculateProfitThisYear()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Profit This Year
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="h4" color="primary">
                    {bookings.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Booking Requests
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Pending Booking Requests */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Pending Booking Requests ({pendingBookings.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {pendingBookings.length === 0 ? (
              <Typography color="text.secondary">
                No pending booking requests
              </Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Guest Email</TableCell>
                      <TableCell>Date Range</TableCell>
                      <TableCell align="right">Total Price</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>{booking.owner}</TableCell>
                        <TableCell>
                          {formatDateRange(booking.dateRange)}
                        </TableCell>
                        <TableCell align="right">
                          ${booking.totalPrice}
                        </TableCell>
                        <TableCell align="center">
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="center"
                          >
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={() => handleAcceptBooking(booking.id)}
                            >
                              Accept
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleDeclineBooking(booking.id)}
                            >
                              Decline
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Notification Snackbar */}
      <NotificationSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </>
  );
};

export default ManageBookings;
