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
} from "@mui/material";

/**
 * BookingDialog Component
 * Reusable dialog for making bookings with date selection
 */
const BookingDialog = ({
  open,
  onClose,
  onConfirm,
  minDate,
  maxDate,
  pricePerNight,
}) => {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  const calculateNights = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  const calculateTotalPrice = () => {
    return pricePerNight * calculateNights();
  };

  const handleConfirm = () => {
    onConfirm(startDate, endDate, calculateTotalPrice());
  };

  const handleClose = () => {
    setStartDate("");
    setEndDate("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Make a Booking</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
          <TextField
            label="Check-in Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: minDate,
              max: maxDate,
            }}
            fullWidth
          />
          <TextField
            label="Check-out Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: startDate || minDate,
              max: maxDate,
            }}
            fullWidth
          />
          {startDate && endDate && (
            <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Nights: {calculateNights()}
              </Typography>
              <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                Total: ${calculateTotalPrice()}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained">
          Confirm Booking
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookingDialog;
