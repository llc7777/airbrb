import { useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { authAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

/**
 * NavigationBar Component
 * Common navigation bar for authenticated pages
 */
const NavigationBar = ({ title, showCreateButton = false, hideMyHosting = false }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await authAPI.logout();
    logout();
    navigate("/");
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        {showCreateButton && (
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => navigate("/listings/new")}
            sx={{
              borderColor: "rgba(255, 255, 255, 0.5)",
              mr: 2,
              "&:hover": {
                borderColor: "white",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
          Create Your Listing
        </Button>
        )}
        {!hideMyHosting && (
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => navigate("/hosted-listings")}
          sx={{
            borderColor: "rgba(255, 255, 255, 0.5)",
            mr: 2,
            "&:hover": {
              borderColor: "white",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
          }}
        >
          My Hosting
        </Button>
        )}
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => navigate("/")}
          sx={{
            borderColor: "rgba(255, 255, 255, 0.5)",
            mr: 2,
            "&:hover": {
              borderColor: "white",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
          }}
        >
          All Listings
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => {
            handleLogout();
          }}
          sx={{
            borderColor: "rgba(255, 255, 255, 0.5)",
            "&:hover": {
              borderColor: "white",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
          }}
        >
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default NavigationBar;
