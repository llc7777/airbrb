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
} from "@mui/material";
import { listingsAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

/**
 * Landing Component
 * Displays all published listings (available to all users)
 */
const Landing = () => {
  const [listings, setListings] = useState([]);
  const navigate = useNavigate();
  const { token, userEmail } = useAuth();

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
        const publishedListings = detailedListings.filter(
          (listing) => listing.published === true
        );

        // Sort listings
        const sortedListings = sortListings(publishedListings);
        setListings(sortedListings);
      } catch (err) {
        console.error("Failed to fetch listings:", err);
      }
    };

    fetchPublishedListings();
  }, []);

  /**
   * Sort listings according to requirements:
   * 1. Bookings by logged-in user (accepted/pending) first
   * 2. Remaining listings in alphabetical order by title
   */
  const sortListings = (listingsArray) => {
    // If user is not logged in, just sort alphabetically
    if (!userEmail) {
      return listingsArray.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
      );
    }

    // Separate listings with user's bookings (accepted/pending)
    const withUserBookings = [];
    const withoutUserBookings = [];

    listingsArray.forEach((listing) => {
      const hasUserBooking = listing.bookings?.some(
        (booking) =>
          booking.owner === userEmail &&
          (booking.status === "accepted" || booking.status === "pending")
      );

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
   * Handle view listing details
   */
  const handleViewListing = (listingId) => {
    navigate(`/listings/${listingId}`);
  };

  return (
    <Box>
      {/* Navigation Bar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            AirBrB - Find Your Perfect Stay
          </Typography>
          {token ? (
            <>
              <Button color="inherit" onClick={() => navigate("/dashboard")}>
                My Dashboard
              </Button>
            </>
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
        <Typography variant="h4" gutterBottom>
          Available Listings
        </Typography>

        {listings.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No published listings available at the moment.
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
                      <Typography variant="h6" gutterBottom>
                        {listing.title}
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label={listing.metadata?.propertyType || "N/A"}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          mb: 1,
                        }}
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

                      <Typography variant="body2" color="text.secondary">
                        🛏️ {listing.metadata?.beds || 0} Beds
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        🚿 {listing.metadata?.bathrooms || 0} Bathrooms
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
