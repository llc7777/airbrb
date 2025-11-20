import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Stack,
  InputAdornment,
  IconButton,
  Grid,
  Chip,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { listingsAPI } from "../utils/api";
import NavigationBar from "../components/NavigationBar";
import NotificationSnackbar from "../components/NotificationSnackbar";

/**
 * CreateListing Component
 * Form to create a new listing
 */
const CreateListing = () => {
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postcode, setPostcode] = useState("");
  const [country, setCountry] = useState("");
  const [price, setPrice] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [thumbnailType, setThumbnailType] = useState("image"); // "image" or "youtube"
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [bedrooms, setBedrooms] = useState([{ beds: "", type: "" }]);
  const [amenities, setAmenities] = useState([]);
  const [newAmenity, setNewAmenity] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  /**
   * Add a new bedroom field
   */
  const handleAddBedroom = () => {
    setBedrooms([...bedrooms, { beds: "", type: "" }]);
  };

  /**
   * Remove a bedroom field
   */
  const handleRemoveBedroom = (index) => {
    setBedrooms(bedrooms.filter((_, i) => i !== index));
  };

  /**
   * Update bedroom data
   */
  const handleBedroomChange = (index, field, value) => {
    const updated = [...bedrooms];
    updated[index][field] = value;
    setBedrooms(updated);
  };

  /**
   * Add amenity
   */
  const handleAddAmenity = () => {
    if (newAmenity.trim()) {
      setAmenities([...amenities, newAmenity.trim()]);
      setNewAmenity("");
    }
  };

  /**
   * Remove amenity
   */
  const handleRemoveAmenity = (index) => {
    setAmenities(amenities.filter((_, i) => i !== index));
  };

  /**
   * Handle JSON file upload
   */
  const handleJSONFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);

        // Validate JSON structure
        if (
          !jsonData.title ||
          !jsonData.address ||
          !jsonData.price ||
          !jsonData.thumbnail ||
          !jsonData.metadata
        ) {
          setSnackbar({
            open: true,
            message: "Invalid JSON format. Missing required fields.",
            severity: "error",
          });
          return;
        }

        // Populate form fields from JSON
        setTitle(jsonData.title || "");
        setStreet(jsonData.address?.street || "");
        setCity(jsonData.address?.city || "");
        setState(jsonData.address?.state || "");
        setPostcode(jsonData.address?.postcode || "");
        setCountry(jsonData.address?.country || "");
        setPrice(jsonData.price?.toString() || "");

        // Handle thumbnail (image or YouTube)
        if (jsonData.thumbnail?.includes("youtube.com/embed/")) {
          setThumbnailType("youtube");
          setYoutubeUrl(jsonData.thumbnail);
          setThumbnail("");
        } else {
          setThumbnailType("image");
          setThumbnail(jsonData.thumbnail || "");
          setYoutubeUrl("");
        }

        setPropertyType(jsonData.metadata?.propertyType || "");
        setBathrooms(jsonData.metadata?.bathrooms?.toString() || "");

        // Handle bedrooms
        if (
          jsonData.metadata?.bedrooms &&
          Array.isArray(jsonData.metadata.bedrooms)
        ) {
          setBedrooms(
            jsonData.metadata.bedrooms.map((b) => ({
              beds: b.beds?.toString() || "",
              type: b.type || "",
            }))
          );
        }

        // Handle amenities
        if (
          jsonData.metadata?.amenities &&
          Array.isArray(jsonData.metadata.amenities)
        ) {
          setAmenities(jsonData.metadata.amenities);
        }

        setSnackbar({
          open: true,
          message: "Listing data loaded successfully from JSON!",
          severity: "success",
        });
      } catch (err) {
        setSnackbar({
          open: true,
          message: err,
          severity: "error",
        });
      }
    };
    reader.readAsText(file);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Calculate total beds
    const totalBeds = bedrooms.reduce((sum, bedroom) => {
      return sum + (parseInt(bedroom.beds) || 0);
    }, 0);

    try {
      // Prepare address object
      const address = {
        street: street || "",
        city: city || "",
        state: state || "",
        postcode: postcode || "",
        country: country || "",
      };

      // Prepare metadata
      const metadata = {
        propertyType,
        bathrooms: parseInt(bathrooms) || 0,
        beds: totalBeds,
        bedrooms: bedrooms.filter((b) => b.beds && b.type),
        amenities,
      };

      // Determine thumbnail data based on type
      let thumbnailData;
      if (thumbnailType === "youtube" && youtubeUrl) {
        // Validate that the URL is an embedded YouTube URL
        if (!youtubeUrl.includes("youtube.com/embed/")) {
          setSnackbar({
            open: true,
            message:
              "Please provide an embedded YouTube URL. Example: https://www.youtube.com/embed/VIDEO_ID",
            severity: "error",
          });
          return;
        }
        thumbnailData = youtubeUrl;
      } else if (thumbnail) {
        thumbnailData = thumbnail;
      } else {
        // Default placeholder image
        thumbnailData =
          "https://placehold.co/300x300?text=No+Image&font=roboto";
      }

      // Create listing
      await listingsAPI.createListing(
        title,
        address,
        parseFloat(price),
        thumbnailData,
        metadata
      );

      // Navigate back to hosted listings
      navigate("/hosted-listings");
    } catch (err) {
      setSnackbar({
        open: true,
        message:
          err.response?.data?.error ||
          "Failed to create listing. Please try again.",
        severity: "error",
      });
    }
  };

  return (
    <Box>
      <NavigationBar title="Create New Listing" />
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>
              Create New Listing
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {/* JSON File Upload */}
                <Paper elevation={1} sx={{ p: 2, bgcolor: "#f5f5f5" }}>
                  <Typography variant="h6" gutterBottom>
                    📁 Upload Listing Data (Optional)
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    You can upload a JSON file to auto-fill the form
                  </Typography>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<UploadFileIcon />}
                  >
                    Upload JSON File
                    <input
                      type="file"
                      accept=".json"
                      hidden
                      onChange={handleJSONFileUpload}
                    />
                  </Button>
                </Paper>

                {/* Title */}
                <TextField
                  required
                  fullWidth
                  label="Listing Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Cozy Beach House"
                />

                {/* Address */}
                <Typography variant="h6">Address</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Street"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="State"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Postcode"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </Grid>
                </Grid>

                {/* Price */}
                <TextField
                  required
                  fullWidth
                  type="number"
                  label="Price per Night"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                  }}
                />

                {/* Thumbnail */}
                <FormControl component="fieldset">
                  <FormLabel component="legend">Thumbnail Type</FormLabel>
                  <RadioGroup
                    row
                    value={thumbnailType}
                    onChange={(e) => setThumbnailType(e.target.value)}
                  >
                    <FormControlLabel
                      value="image"
                      control={<Radio />}
                      label="Image"
                    />
                    <FormControlLabel
                      value="youtube"
                      control={<Radio />}
                      label="YouTube Video"
                    />
                  </RadioGroup>
                </FormControl>

                {thumbnailType === "image" ? (
                  <TextField
                    fullWidth
                    label="Thumbnail (Base64 or URL)"
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                    placeholder="Leave empty for default image"
                    helperText="Provide a base64 encoded image or image URL"
                  />
                ) : (
                  <TextField
                    fullWidth
                    label="YouTube Embedded URL"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/embed/VIDEO_ID"
                    helperText="Only embedded YouTube URLs are accepted (format: youtube.com/embed/VIDEO_ID)"
                  />
                )}

                {/* Property Type */}
                <TextField
                  required
                  fullWidth
                  label="Property Type"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  placeholder="e.g., House, Apartment, Villa"
                />

                {/* Bathrooms */}
                <TextField
                  fullWidth
                  type="number"
                  label="Number of Bathrooms"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                />

                {/* Bedrooms */}
                <Typography variant="h6">Bedrooms</Typography>
                {bedrooms.map((bedroom, index) => (
                  <Box
                    key={index}
                    sx={{ display: "flex", gap: 2, alignItems: "center" }}
                  >
                    <TextField
                      type="number"
                      label="Number of Beds"
                      value={bedroom.beds}
                      onChange={(e) =>
                        handleBedroomChange(index, "beds", e.target.value)
                      }
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="Bed Type"
                      value={bedroom.type}
                      onChange={(e) =>
                        handleBedroomChange(index, "type", e.target.value)
                      }
                      placeholder="e.g., Queen, King, Single"
                      sx={{ flex: 1 }}
                    />
                    <IconButton
                      onClick={() => handleRemoveBedroom(index)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddBedroom}
                  variant="outlined"
                >
                  Add Bedroom
                </Button>

                {/* Amenities */}
                <Typography variant="h6">Amenities</Typography>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Add Amenity"
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), handleAddAmenity())
                    }
                    placeholder="e.g., WiFi, Pool, Parking"
                  />
                  <Button onClick={handleAddAmenity} variant="outlined">
                    Add
                  </Button>
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {amenities.map((amenity, index) => (
                    <Chip
                      key={index}
                      label={amenity}
                      onDelete={() => handleRemoveAmenity(index)}
                    />
                  ))}
                </Box>
                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{ mt: 3 }}
                >
                  Create Listing
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Box>
      </Container>

      {/* Snackbar for notifications */}
      <NotificationSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </Box>
  );
};

export default CreateListing;
