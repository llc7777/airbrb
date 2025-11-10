import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Stack,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

/**
 * PublishDialog Component
 * Dialog for setting availability ranges before publishing a listing
 */
const PublishDialog = ({ open, onClose, onPublish, listingTitle }) => {
  const [availabilityRanges, setAvailabilityRanges] = useState([
    { start: "", end: "" },
  ]);
  const [error, setError] = useState("");

  /**
   * Add a new availability range
   */
  const handleAddRange = () => {
    setAvailabilityRanges([...availabilityRanges, { start: "", end: "" }]);
  };

  /**
   * Remove an availability range
   */
  const handleRemoveRange = (index) => {
    setAvailabilityRanges(availabilityRanges.filter((_, i) => i !== index));
  };

  /**
   * Update availability range data
   */
  const handleRangeChange = (index, field, value) => {
    const updated = [...availabilityRanges];
    updated[index][field] = value;
    setAvailabilityRanges(updated);
  };

  /**
   * Handle publish button click
   */
  const handlePublish = () => {
    setError("");

    // Validate that at least one range is filled
    const validRanges = availabilityRanges.filter((r) => r.start && r.end);

    if (validRanges.length === 0) {
      setError("Please add at least one availability range.");
      return;
    }

    // Validate that start date is before end date for each range
    for (const range of validRanges) {
      const startDate = new Date(range.start);
      const endDate = new Date(range.end);

      if (startDate >= endDate) {
        setError("Start date must be before end date for all ranges.");
        return;
      }
    }

    // Call the publish callback with valid ranges
    onPublish(validRanges);

    // Reset state
    setAvailabilityRanges([{ start: "", end: "" }]);
    setError("");
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    setAvailabilityRanges([{ start: "", end: "" }]);
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Publish Listing: {listingTitle}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Add at least one availability date range to publish your listing.
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Stack spacing={2}>
          {availabilityRanges.map((range, index) => (
            <Box key={index}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Availability Range {index + 1}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <TextField
                  type="date"
                  label="Start Date"
                  value={range.start}
                  onChange={(e) =>
                    handleRangeChange(index, "start", e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  type="date"
                  label="End Date"
                  value={range.end}
                  onChange={(e) =>
                    handleRangeChange(index, "end", e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: 1 }}
                />
                <IconButton
                  onClick={() => handleRemoveRange(index)}
                  color="error"
                  disabled={availabilityRanges.length === 1}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Stack>

        <Button
          startIcon={<AddIcon />}
          onClick={handleAddRange}
          variant="outlined"
          sx={{ mt: 2 }}
        >
          Add Another Range
        </Button>

        {/* Preview of valid ranges */}
        {availabilityRanges.filter((r) => r.start && r.end).length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Summary:
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {availabilityRanges
                .filter((r) => r.start && r.end)
                .map((range, index) => (
                  <Chip
                    key={index}
                    label={`${range.start} to ${range.end}`}
                    color="primary"
                    variant="outlined"
                  />
                ))}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handlePublish} variant="contained" color="primary">
          Publish Listing
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PublishDialog;
