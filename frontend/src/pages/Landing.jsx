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
  }, [userEmail]);

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
};

export default Landing;
