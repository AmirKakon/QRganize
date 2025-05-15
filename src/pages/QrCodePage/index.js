import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import QrCodeTabs from "../../components/QrCodeTabs";
import AccessTokenExpiration from "../../components/AccessTokenExpiration";
import Loading from "../../components/Loading";

const QrCode = ({ isSmallScreen }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setLoading(false);
  }, []);

  return loading ? (
    <Loading />
  ) : (
    <Box flex={1} spacing={1} sx={{ backgroundColor: "#e2e2e2", padding: 2 }}>
      <QrCodeTabs isSmallScreen={isSmallScreen} />
      <AccessTokenExpiration />
    </Box>
  );
};

export default QrCode;
