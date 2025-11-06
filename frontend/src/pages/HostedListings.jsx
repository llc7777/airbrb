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
  AppBar,
  Toolbar,
} from "@mui/material";
import { listingsAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

/**
 * HostedListings Component
 * Displays all listings created by the current user
 */
const HostedListings = () => {
  const [listings, setListings] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState(null);
  const navigate = useNavigate();
  const { userEmail } = useAuth();

  // Fetch all listings and filter by owner
  useEffect(() => {
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
              const detailResponse = await listingsAPI.getListingById(
                listing.id
              );
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

    fetchHostedListings();
  }, [userEmail]);

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
    } catch (err) {
      console.error("Failed to delete listing:", err);
      alert("Failed to delete listing. Please try again.");
    }
  };



export default HostedListings;
