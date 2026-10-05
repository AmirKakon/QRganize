import React, { forwardRef } from "react";
import { Dialog, Slide, Toolbar, IconButton, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import ItemPage from "../../pages/ItemPage";

const SlideIn = forwardRef((props, ref) => <Slide direction="left" ref={ref} {...props} />);

// Full-screen item view layered over the page it was opened from (see
// useOpenItem). Closing goes Back in history, the same as the device back
// button, so both paths leave the page underneath exactly as it was.
const ItemOverlay = ({ isSmallScreen }) => {
  const navigate = useNavigate();
  const close = () => navigate(-1);

  return (
    <Dialog
      open
      fullScreen
      onClose={close}
      slots={{ transition: SlideIn }}
      slotProps={{ paper: { sx: { backgroundColor: "background.default" } } }}
    >
      <Toolbar sx={{ gap: 1, borderBottom: 1, borderColor: "divider" }}>
        <IconButton edge="start" onClick={close} aria-label="Back">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">Item Details</Typography>
      </Toolbar>
      <ItemPage isSmallScreen={isSmallScreen} inOverlay />
    </Dialog>
  );
};

export default ItemOverlay;
