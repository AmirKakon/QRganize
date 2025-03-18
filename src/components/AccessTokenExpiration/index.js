import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { getTokenExpiration } from "../../utilities/auth";
import { Typography, Alert } from "@mui/material";

const AccessTokenExpiration = () => {
  const [aTExpiration, setATExpiration] = useState(null);
  const [rTExpiration, setRTExpiration] = useState(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const accessTokenExpiration = getTokenExpiration("accessToken");
      setATExpiration(accessTokenExpiration ? accessTokenExpiration.diff(dayjs(), "minute") : null);
      const refreshTokenExpiration = getTokenExpiration("refreshToken");
      setRTExpiration(refreshTokenExpiration ? refreshTokenExpiration.diff(dayjs(), "day") : null);
    }, 1000); // Update every second

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Alert variant="outlined" severity="info" sx={{ margin: 1 }}>
      <Typography variant="body1">
        This website uses a JWT access token to authenticate your requests to
        the server and a refresh token to refresh the expired access token. The
        access token has a 15 minute lifespan and will automatically refresh 2
        minutes before it expires. The refresh token has a 30 day lifespan and
        will automatically refresh 1 day before it expires.
      </Typography>

      {aTExpiration && aTExpiration > 0 && rTExpiration && rTExpiration > 0 && (
        <Typography variant="body1">
          The access token expires in <b>{aTExpiration}</b> minutes. But don't
          worry we got you covered with a refresh token thats valid for another{" "}
          <b>{rTExpiration}</b> days!
        </Typography>
      )}
    </Alert>
  );
};

export default AccessTokenExpiration;
