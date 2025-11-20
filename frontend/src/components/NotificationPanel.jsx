import { useState, useEffect, useRef } from "react";
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
  const notifiedBookingIdsRef = useRef(new Set());

  const open = Boolean(anchorEl);

  /**
   * Load notified booking IDs and notifications from localStorage on mount
   */
  useEffect(() => {
    if (!userEmail) return;

    // Load notified booking IDs
    const storedIds = localStorage.getItem(`notifiedBookings_${userEmail}`);
    if (storedIds) {
      try {
        const parsed = JSON.parse(storedIds);
        notifiedBookingIdsRef.current = new Set(parsed);
      } catch (err) {
        console.error("Failed to parse stored notification IDs:", err);
      }
    }

    // Load active notifications
    const storedNotifications = localStorage.getItem(
      `notifications_${userEmail}`
    );
    if (storedNotifications) {
      try {
        const parsed = JSON.parse(storedNotifications);
        // Convert timestamp strings back to Date objects
        const notifications = parsed.map((n) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        setNotifications(notifications);
        setUnreadCount(notifications.length);
        if (onUnreadCountChange) {
          onUnreadCountChange(notifications.length);
        }
      } catch (err) {
        console.error("Failed to parse stored notifications:", err);
      }
    }
  }, [userEmail, onUnreadCountChange]);

  /**
   * Save notified booking IDs to localStorage
   */
  const saveNotifiedBookingIds = () => {
    if (!userEmail) return;
    const array = Array.from(notifiedBookingIdsRef.current);
    localStorage.setItem(
      `notifiedBookings_${userEmail}`,
      JSON.stringify(array)
    );
  };

  /**
   * Save notifications to localStorage
   */
  const saveNotifications = (notifs) => {
    if (!userEmail) return;
    localStorage.setItem(`notifications_${userEmail}`, JSON.stringify(notifs));
  };

  /**
   * Get background color based on notification type
   */
  const getNotificationColor = (notification) => {
    if (notification.type === "booking-request") {
      return "rgba(255, 193, 7, 0.15)"; // Yellow for guest requests
    } else if (notification.type === "booking-status") {
      if (notification.status === "accepted") {
        return "rgba(76, 175, 80, 0.15)"; // Green for accepted
      } else if (notification.status === "declined") {
        return "rgba(244, 67, 54, 0.15)"; // Red for declined
      }
    }
  };

  /**
   * Get hover background color based on notification type
   */
  const getNotificationHoverColor = (notification) => {
    if (notification.type === "booking-request") {
      return "rgba(255, 193, 7, 0.25)"; // Yellow hover
    } else if (notification.type === "booking-status") {
      if (notification.status === "accepted") {
        return "rgba(76, 175, 80, 0.25)"; // Green hover
      } else if (notification.status === "declined") {
        return "rgba(244, 67, 54, 0.25)"; // Red hover
      }
    }
  };

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
          const notificationId = `booking-request-${booking.id}`;
          if (
            userListingIds.includes(String(booking.listingId)) &&
            booking.status === "pending" &&
            !notifiedBookingIdsRef.current.has(notificationId)
          ) {
            // Find listing title
            const listing = userListings.find(
              (l) => String(l.id) === String(booking.listingId)
            );
            newNotifications.push({
              id: notificationId,
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
          const notificationId = `booking-status-${booking.id}-${booking.status}`;
          if (
            booking.owner === userEmail &&
            (booking.status === "accepted" || booking.status === "declined") &&
            !notifiedBookingIdsRef.current.has(notificationId)
          ) {
            // Find listing title
            const listingResponse = listingsResponse.data.listings.find(
              (l) => String(l.id) === String(booking.listingId)
            );
            const status =
              booking.status === "accepted" ? "accepted" : "declined";
            newNotifications.push({
              id: notificationId,
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

        // Add new notifications to existing ones (prepend)
        if (newNotifications.length > 0) {
          // Update notified booking IDs
          newNotifications.forEach((notif) => {
            notifiedBookingIdsRef.current.add(notif.id);
          });

          // Save to localStorage
          saveNotifiedBookingIds();

          setNotifications((prev) => {
            const updated = [...newNotifications, ...prev];
            saveNotifications(updated);
            return updated;
          });
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
  }, [userEmail, onUnreadCountChange]);

  /**
   * Handle clicking on individual notification
   */
  const handleNotificationClick = (notificationId) => {
    // Remove the notification
    setNotifications((prev) => {
      const filtered = prev.filter((notif) => notif.id !== notificationId);
      saveNotifications(filtered);
      return filtered;
    });

    // Decrease unread count
    setUnreadCount((prev) => {
      const newCount = Math.max(0, prev - 1);
      if (onUnreadCountChange) {
        onUnreadCountChange(newCount);
      }
      return newCount;
    });
  };

  /**
   * Clear all notifications
   */
  const handleClearAll = () => {
    setNotifications([]);
    saveNotifications([]);
    setUnreadCount(0);
    if (onUnreadCountChange) {
      onUnreadCountChange(0);
    }
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          maxHeight: 400,
          width: 350,
          mt: 1,
        },
      }}
    >
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Notifications
        </Typography>
      </Box>
      <Divider />

      {notifications.length === 0 ? (
        <MenuItem disabled>
          <Typography variant="body2" color="text.secondary">
            No notifications
          </Typography>
        </MenuItem>
      ) : (
        <>
          {notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              sx={{
                whiteSpace: "normal",
                backgroundColor: getNotificationColor(notification),
                "&:hover": {
                  backgroundColor: getNotificationHoverColor(notification),
                },
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleNotificationClick(notification.id);
              }}
            >
              <Box>
                <Typography variant="body2">{notification.message}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {notification.timestamp.toLocaleTimeString()}
                </Typography>
              </Box>
            </MenuItem>
          ))}
          <Divider />
          <Box sx={{ px: 2, py: 1, textAlign: "center" }}>
            <Button
              size="small"
              onClick={handleClearAll}
              sx={{ textTransform: "none" }}
            >
              Clear All
            </Button>
          </Box>
        </>
      )}
    </Menu>
  );
};

export default NotificationPanel;
