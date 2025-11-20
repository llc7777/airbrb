import { useState, useEffect } from "react";
import {
  Menu,
  MenuItem,
  Typography,
  Divider,
  Box,
  Button,
} from "@mui/material";
import { bookingsAPI, listingsAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

/**
 * NotificationPanel Component
 * Displays live notifications for booking requests and status changes
 */
const NotificationPanel = ({ anchorEl, onClose, onUnreadCountChange }) => {
  const { userEmail } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastCheckedBookings, setLastCheckedBookings] = useState(new Set());

  const open = Boolean(anchorEl);

  /**
   * Poll for new notifications every 5 seconds
   */
  useEffect(() => {
    if (!userEmail) return;

    const pollNotifications = async () => {
      try {
        // Fetch all bookings
        const bookingsResponse = await bookingsAPI.getAllBookings();
        const allBookings = bookingsResponse.data.bookings;

        // Fetch user's listings
        const listingsResponse = await listingsAPI.getAllListings();
        const userListings = listingsResponse.data.listings.filter(
          (listing) => listing.owner === userEmail
        );
        const userListingIds = userListings.map((listing) =>
          String(listing.id)
        );

        const newNotifications = [];

        // Check for new booking requests on host's listings (Host notifications)
        allBookings.forEach((booking) => {
          if (
            userListingIds.includes(String(booking.listingId)) &&
            booking.status === "pending" &&
            !lastCheckedBookings.has(booking.id)
          ) {
            // Find listing title
            const listing = userListings.find(
              (l) => String(l.id) === String(booking.listingId)
            );
            newNotifications.push({
              id: `booking-request-${booking.id}`,
              type: "booking-request",
              message: `New booking request for "${
                listing?.title || "your listing"
              }"`,
              timestamp: new Date(),
              read: false,
              bookingId: booking.id,
            });
          }
        });

        // Check for booking status changes (Guest notifications)
        allBookings.forEach((booking) => {
          if (
            booking.owner === userEmail &&
            (booking.status === "accepted" || booking.status === "declined") &&
            !lastCheckedBookings.has(booking.id)
          ) {
            // Find listing title
            const listingResponse = listingsResponse.data.listings.find(
              (l) => String(l.id) === String(booking.listingId)
            );
            const status =
              booking.status === "accepted" ? "accepted" : "declined";
            newNotifications.push({
              id: `booking-status-${booking.id}`,
              type: "booking-status",
              message: `Your booking request for "${
                listingResponse?.title || "a listing"
              }" was ${status}`,
              timestamp: new Date(),
              read: false,
              bookingId: booking.id,
              status: booking.status,
            });
          }
        });

        // Update last checked bookings
        const currentBookingIds = new Set(allBookings.map((b) => b.id));
        setLastCheckedBookings(currentBookingIds);

        // Add new notifications to existing ones (prepend)
        if (newNotifications.length > 0) {
          setNotifications((prev) => [...newNotifications, ...prev]);
          setUnreadCount((prev) => {
            const newCount = prev + newNotifications.length;
            if (onUnreadCountChange) {
              onUnreadCountChange(newCount);
            }
            return newCount;
          });
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    // Initial poll
    pollNotifications();

    // Set up polling interval (every 5 seconds)
    const interval = setInterval(pollNotifications, 5000);

    return () => clearInterval(interval);
  }, [userEmail, lastCheckedBookings, onUnreadCountChange]);

  /**
   * Handle opening notification menu
   */
  useEffect(() => {
    if (open) {
      // Mark all as read when opening
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
      if (onUnreadCountChange) {
        onUnreadCountChange(0);
      }
    }
  }, [open, onUnreadCountChange]);

  /**
   * Clear all notifications
   */
  const handleClearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    if (onUnreadCountChange) {
      onUnreadCountChange(0);
    }
  };
};

export default NotificationPanel;
