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
  AppBar,
  Toolbar,
  TextField,
  Paper,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Collapse,
  IconButton,
  Badge,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import FilterListIcon from "@mui/icons-material/FilterList";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { listingsAPI, bookingsAPI, authAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import NotificationPanel from "../components/NotificationPanel";

/**
 * Landing Component
 * Displays all published listings (available to all users)
 */
const Landing = () => {
  const [allListings, setAllListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const navigate = useNavigate();
  const { token, userEmail, logout } = useAuth();

  // Search and filter states
  const [searchText, setSearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [minBedrooms, setMinBedrooms] = useState("");
  const [maxBedrooms, setMaxBedrooms] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortByRating, setSortByRating] = useState(""); // "asc" or "desc"

  // Notification states
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch all published listings
  useEffect(() => {
    const fetchPublishedListings = async () => {
      try {
        const response = await listingsAPI.getAllListings();
        const allListings = response.data.listings;

        // Fetch detailed information for ALL listings first
        const detailedListings = await Promise.all(
          allListings.map(async (listing) => {
            try {
              const detailResponse = await listingsAPI.getListingById(
                listing.id
              );
              return {
                id: listing.id,
                ...detailResponse.data.listing,
              };
            } catch (err) {
              console.error(`Failed to fetch details for ${listing.id}:`, err);
              return listing;
            }
          })
        );

        // Filter only published listings (after fetching details)
        // Also exclude listings owned by the current user
        const publishedListings = detailedListings.filter(
          (listing) => listing.published === true && listing.owner !== userEmail
        );

        setAllListings(publishedListings);
        setFilteredListings(publishedListings);
      } catch (err) {
        console.error("Failed to fetch listings:", err);
      }
    };

    fetchPublishedListings();
  }, []);

  // Fetch user's bookings when token and userEmail are available
  useEffect(() => {
    const fetchUserBookings = async () => {
      if (token && userEmail) {
        try {
          const bookingsResponse = await bookingsAPI.getAllBookings();
          const bookings = bookingsResponse.data.bookings;
          setUserBookings(bookings);
        } catch (err) {
          console.error("Failed to fetch bookings:", err);
        }
      } else {
        setUserBookings([]);
      }
    };

    fetchUserBookings();
  }, []);

  // Re-sort listings when userBookings changes
  useEffect(() => {
    if (allListings.length > 0) {
      const sortedListings = sortListings(allListings, userBookings);
      setFilteredListings(sortedListings);
    }
  }, [userBookings, allListings]);

  /**
   * Sort listings according to requirements:
   * 1. Bookings by logged-in user (accepted/pending) first
   * 2. Remaining listings in alphabetical order by title
   */
  const sortListings = (listingsArray, bookings = []) => {
    // If user is not logged in, just sort alphabetically
    if (!userEmail || bookings.length === 0) {
      return [...listingsArray].sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
      );
    }

    // Separate listings with user's bookings (accepted/pending)
    const withUserBookings = [];
    const withoutUserBookings = [];

    listingsArray.forEach((listing) => {
      const hasUserBooking = bookings.some((booking) => {
        const listingIdMatch = String(booking.listingId) === String(listing.id);
        const ownerMatch = booking.owner === userEmail;
        const statusMatch =
          booking.status === "accepted" || booking.status === "pending";
        return listingIdMatch && ownerMatch && statusMatch;
      });

      if (hasUserBooking) {
        withUserBookings.push(listing);
      } else {
        withoutUserBookings.push(listing);
      }
    });

    // Sort both groups alphabetically by title
    withUserBookings.sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
    );
    withoutUserBookings.sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
    );

    // Combine: user bookings first, then others
    return [...withUserBookings, ...withoutUserBookings];
  };

  /**
   * Get user's booking status for a listing
   */
  const getUserBookingStatus = (listingId) => {
    if (!userEmail) return null;

    const booking = userBookings.find(
      (b) =>
        String(b.listingId) === String(listingId) &&
        b.owner === userEmail &&
        (b.status === "accepted" || b.status === "pending")
    );

    return booking?.status || null;
  };

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
   * Check if a listing is available for the entire date range
   */
  const isAvailableForDateRange = (listing, start, end) => {
    if (!start || !end || !listing.availability) return true;

    const searchStart = new Date(start);
    const searchEnd = new Date(end);

    // Check if any availability range covers the entire search period
    return listing.availability.some((range) => {
      const availStart = new Date(range.start);
      const availEnd = new Date(range.end);
      return availStart <= searchStart && availEnd >= searchEnd;
    });
  };

  /**
   * Apply all filters and search
   */
  const handleSearch = () => {
    let results = [...allListings];

    // Filter by search text (title or city)
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      const searchWords = searchLower.split(" ").filter((w) => w);

      results = results.filter((listing) => {
        const titleLower = listing.title?.toLowerCase() || "";
        const cityLower = listing.address?.city?.toLowerCase() || "";

        // Check if any search word matches title or city
        return searchWords.some(
          (word) => titleLower.includes(word) || cityLower.includes(word)
        );
      });
    }

    // Filter by bedrooms
    if (minBedrooms !== "") {
      results = results.filter(
        (listing) => (listing.metadata?.beds || 0) >= parseInt(minBedrooms)
      );
    }
    if (maxBedrooms !== "") {
      results = results.filter(
        (listing) => (listing.metadata?.beds || 0) <= parseInt(maxBedrooms)
      );
    }

    // Filter by date range
    if (startDate && endDate) {
      results = results.filter((listing) =>
        isAvailableForDateRange(listing, startDate, endDate)
      );
    }

    // Filter by price
    if (minPrice !== "") {
      results = results.filter(
        (listing) => (listing.price || 0) >= parseFloat(minPrice)
      );
    }
    if (maxPrice !== "") {
      results = results.filter(
        (listing) => (listing.price || 0) <= parseFloat(maxPrice)
      );
    }

    // Sort by rating if selected
    if (sortByRating) {
      results.sort((a, b) => {
        const ratingA = calculateAverageRating(a.reviews);
        const ratingB = calculateAverageRating(b.reviews);

        if (sortByRating === "desc") {
          return ratingB - ratingA; // Highest to lowest
        } else {
          return ratingA - ratingB; // Lowest to highest
        }
      });
    }

    setFilteredListings(results);
  };

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    setSearchText("");
    setMinBedrooms("");
    setMaxBedrooms("");
    setStartDate("");
    setEndDate("");
    setMinPrice("");
    setMaxPrice("");
    setSortByRating("");
  };

  /**
   * Handle view listing details
   */
  const handleViewListing = (listingId) => {
    // Pass search dates to ViewListing page if they were used
    const searchDates = startDate && endDate ? { startDate, endDate } : null;

    navigate(`/listings/${listingId}`, {
      state: { searchDates },
    });
  };

  /**
   * Handle user logout
   * Calls logout API and clears authentication state
   */
  const handleLogout = async () => {
    await authAPI.logout();
    logout();
    navigate("/");
  };

  /**
   * Handle notification button click
   */
  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  /**
   * Handle notification panel close
   */
  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  return (
    <Box>
      {/* Navigation Bar */}
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: "bold",
              fontSize: "1.3rem",
              textShadow: "1px 1px 2px rgba(0,0,0,0.2)",
            }}
          >
            AirBrB - Find Your Perfect Stay
          </Typography>
          {token ? (
            <>
              <Button
                variant="contained"
                onClick={() => navigate("/hosted-listings")}
                sx={{
                  backgroundColor: "#9c27b0",
                  color: "white",
                  mr: 2,
                  fontWeight: "bold",
                  "&:hover": {
                    backgroundColor: "#7b1fa2",
                  },
                }}
              >
                🏠 My Hosting
              </Button>
              <Button
                variant="contained"
                onClick={handleNotificationClick}
                sx={{
                  backgroundColor: "#ffc107",
                  color: "white",
                  mr: 2,
                  fontWeight: "bold",
                  minWidth: "auto",
                  padding: "6px 16px",
                  "&:hover": {
                    backgroundColor: "#ffb300",
                  },
                }}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </Button>
              <NotificationPanel
                anchorEl={notificationAnchor}
                onClose={handleNotificationClose}
                onUnreadCountChange={setUnreadCount}
              />
              <Button
                variant="contained"
                onClick={() => {
                  handleLogout();
                }}
                sx={{
                  backgroundColor: "#f44336",
                  color: "white",
                  fontWeight: "bold",
                  "&:hover": {
                    backgroundColor: "#d32f2f",
                  },
                }}
              >
                🚺 Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                onClick={() => navigate("/login")}
                sx={{
                  backgroundColor: "#00bcd4",
                  color: "white",
                  mr: 2,
                  fontWeight: "bold",
                  "&:hover": {
                    backgroundColor: "#0097a7",
                  },
                }}
              >
                🔑 Login
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate("/register")}
                sx={{
                  backgroundColor: "#4caf50",
                  color: "white",
                  fontWeight: "bold",
                  "&:hover": {
                    backgroundColor: "#45a049",
                  },
                }}
              >
                ✍️ Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Available Listings
        </Typography>

        {/* Search and Filter Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography variant="h6">Search & Filter</Typography>
            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              color="primary"
              aria-label="toggle filters"
            >
              <FilterListIcon />
            </IconButton>
          </Box>

          <Stack spacing={3}>
            {/* Search Text - Always visible */}
            <TextField
              fullWidth
              label="Search by title or city"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="e.g., Beach House or Sydney"
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: "action.active" }} />
                ),
              }}
            />

            {/* Advanced Filters - Collapsible */}
            <Collapse in={showFilters}>
              <Stack spacing={3}>
                {/* Bedrooms Filter */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Number of Bedrooms
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Min Bedrooms"
                        value={minBedrooms}
                        onChange={(e) => setMinBedrooms(e.target.value)}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Max Bedrooms"
                        value={maxBedrooms}
                        onChange={(e) => setMaxBedrooms(e.target.value)}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Date Range Filter */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Availability Date Range
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Start Date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="End Date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Price Range Filter */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Price per Night ($)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Min Price"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Max Price"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Sort by Rating */}
                <FormControl fullWidth>
                  <InputLabel>Sort by Review Rating</InputLabel>
                  <Select
                    value={sortByRating}
                    label="Sort by Review Rating"
                    onChange={(e) => setSortByRating(e.target.value)}
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="desc">Highest to Lowest</MenuItem>
                    <MenuItem value="asc">Lowest to Highest</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Collapse>

            {/* Action Buttons */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                fullWidth
              >
                Search
              </Button>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                fullWidth
              >
                Clear Filters
              </Button>
            </Box>
          </Stack>
        </Paper>

        {/* Results Count */}
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {filteredListings.length} listing(s) found
        </Typography>

        {filteredListings.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No listings match your search criteria.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredListings.map((listing) => {
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
                      bgcolor:
                        getUserBookingStatus(listing.id) === "pending"
                          ? "rgba(255, 152, 0, 0.08)"
                          : getUserBookingStatus(listing.id) === "accepted"
                          ? "rgba(76, 175, 80, 0.08)"
                          : "background.paper",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 4,
                        cursor: "pointer",
                      },
                    }}
                    onClick={() => handleViewListing(listing.id)}
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
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 1,
                        }}
                      >
                        <Typography variant="h6" sx={{ flex: 1 }}>
                          {listing.title}
                        </Typography>
                        {getUserBookingStatus(listing.id) && (
                          <Chip
                            label={
                              getUserBookingStatus(listing.id) === "pending"
                                ? "Pending"
                                : "Accepted"
                            }
                            size="small"
                            color={
                              getUserBookingStatus(listing.id) === "pending"
                                ? "warning"
                                : "success"
                            }
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label={listing.metadata?.propertyType || "N/A"}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
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

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        📅{" "}
                        {listing.availability && listing.availability.length > 0
                          ? `${listing.availability
                              .slice(0, 1)
                              .map(
                                (range) =>
                                  `${new Date(range.start).toLocaleDateString(
                                    "en-US",
                                    { month: "numeric", day: "numeric" }
                                  )} ~ ${new Date(range.end).toLocaleDateString(
                                    "en-US",
                                    { month: "numeric", day: "numeric" }
                                  )}`
                              )
                              .join("")}${
                              listing.availability.length > 1
                                ? ` +${listing.availability.length - 1} more`
                                : ""
                            }`
                          : "No dates available"}
                      </Typography>

                      <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                        ${listing.price} / night
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default Landing;
