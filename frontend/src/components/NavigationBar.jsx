import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Box,
  useMediaQuery,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MenuIcon from "@mui/icons-material/Menu";
import { authAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import NotificationPanel from "./NotificationPanel";

/**
 * NavigationBar Component
 * Common navigation bar for authenticated pages
 */
const NavigationBar = ({
  title,
  showCreateButton = false,
  hideMyHosting = false,
}) => {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const isMobile = useMediaQuery("(max-width:800px)");

  const handleLogout = async () => {
    await authAPI.logout();
    logout();
    navigate("/");
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleMenuItemClick = (path) => {
    navigate(path);
    handleMenuClose();
  };

  return (
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
          {title}
        </Typography>

        {isMobile ? (
          <>
            <IconButton color="inherit" onClick={handleMenuOpen} edge="end">
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={handleMenuClose}
            >
              {token && showCreateButton && (
                <MenuItem onClick={() => handleMenuItemClick("/listings/new")}>
                  ➥ Create Listing
                </MenuItem>
              )}
              {token && !hideMyHosting && (
                <MenuItem
                  onClick={() => handleMenuItemClick("/hosted-listings")}
                >
                  🏠 My Hosting
                </MenuItem>
              )}
              <MenuItem onClick={() => handleMenuItemClick("/")}>
                🔍 All Listings
              </MenuItem>
              {token && (
                <MenuItem onClick={handleNotificationClick}>
                  🔔 Notifications {unreadCount > 0 && `(${unreadCount})`}
                </MenuItem>
              )}
              {token && (
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    handleLogout();
                  }}
                >
                  🚺 Logout
                </MenuItem>
              )}
            </Menu>
          </>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {token && showCreateButton && (
              <Button
                variant="contained"
                onClick={() => navigate("/listings/new")}
                sx={{
                  backgroundColor: "#4caf50",
                  color: "white",
                  mr: 2,
                  fontWeight: "bold",
                  "&:hover": {
                    backgroundColor: "#45a049",
                  },
                }}
              >
                ➥ Create Listing
              </Button>
            )}
            {token && !hideMyHosting && (
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
            )}
            <Button
              variant="contained"
              onClick={() => navigate("/")}
              sx={{
                backgroundColor: "#ff9800",
                color: "white",
                mr: 2,
                fontWeight: "bold",
                "&:hover": {
                  backgroundColor: "#e68900",
                },
              }}
            >
              🔍 All Listings
            </Button>
            {token && (
              <>
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
            )}
          </Box>
        )}

        {token && (
          <NotificationPanel
            anchorEl={notificationAnchor}
            onClose={handleNotificationClose}
            onUnreadCountChange={setUnreadCount}
          />
        )}
      </Toolbar>
    </AppBar>
  );
};

export default NavigationBar;
