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
          "data:image/png;base64,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";
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
