import React, { useEffect, useState } from "react";
import { Box, Button } from "@mui/material";
import HomePageTabs from "../../components/HomePageTabs";
import AccessTokenExpiration from "../../components/AccessTokenExpiration";
import Loading from "../../components/Loading";
import ScanReceiptDialog from "../../components/ScanReceiptDialog";

const HomePage = ({ isSmallScreen }) => {
  const [loading, setLoading] = useState(true);
  const [isScanReceiptDialogOpen, setIsScanReceiptDialogOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setLoading(false);
  }, []);

  return loading ? (
    <Loading />
  ) : (
    <Box flex={1} spacing={1} sx={{ backgroundColor: "#e2e2e2", padding: 2 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setIsScanReceiptDialogOpen(true)}
        sx={{ marginBottom: 2 }}
      >
        Scan Receipt
      </Button>
      <HomePageTabs isSmallScreen={isSmallScreen} />
      <AccessTokenExpiration />
      <ScanReceiptDialog
        open={isScanReceiptDialogOpen}
        onClose={() => setIsScanReceiptDialogOpen(false)}
      />
    </Box>
  );
};

export default HomePage;
