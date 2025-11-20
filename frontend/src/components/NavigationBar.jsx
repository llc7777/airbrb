import { useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { authAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

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
  const { logout } = useAuth();

  const handleLogout = async () => {
    await authAPI.logout();
    logout();
    navigate("/");
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
        {showCreateButton && (
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
        {!hideMyHosting && (
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
      </Toolbar>
    </AppBar>
  );
};

export default NavigationBar;
