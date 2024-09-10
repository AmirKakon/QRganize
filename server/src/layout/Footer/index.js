import React, { useState, useEffect } from "react";
import { Box, Typography, Grid, Link } from "@mui/material";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import EmailIcon from "@mui/icons-material/Email";
import GitHubIcon from "@mui/icons-material/GitHub";

const FooterContactInformation = ({ isSmallScreen }) => {
  const items = [
    {
      href: "mailto:amir.kakon@gmail.com",
      text: "amir.kakon@gmail.com",
      icon: (
        <EmailIcon
          color="action"
          style={{ marginRight: isSmallScreen ? "1px" : "5px" }}
        />
      ),
    },
    {
      href: "https://www.linkedin.com/in/amir-kakon",
      text: "Amir-Kakon",
      icon: (
        <LinkedInIcon
          color="action"
          style={{ marginRight: isSmallScreen ? "1px" : "5px" }}
        />
      ),
    },

    {
      href: "https://github.com/AmirKakon",
      text: "AmirKakon",
      icon: (
        <GitHubIcon
          color="action"
          style={{ marginRight: isSmallScreen ? "1px" : "5px" }}
        />
      ),
    },
  ];

  return (
    <Grid item>
      <Box display="flex" alignItems="center">
        {items.map((item, index) => (
          <Box key={index} display="flex" alignItems="center" marginRight={2}>
            <Link
              href={item.href}
              color="textPrimary"
              style={{ textDecoration: "none" }}
              target="_blank"
            >
              {item.icon}
            </Link>
            <Typography>
              <Link
                href={item.href}
                color="textPrimary"
                style={{ textDecoration: "none" }}
                target="_blank"
              >
                {!isSmallScreen && item.text}
              </Link>
            </Typography>
          </Box>
        ))}
      </Box>
    </Grid>
  );
};

const FooterCopyright = ({ version }) => {
  return (
    <Grid item>
      <Box display="flex" alignItems="center">
        <Typography color="textPrimary" fontFamily="serif">
          Version {version}
        </Typography>
      </Box>
    </Grid>
  );
};

const Footer = ({ isSmallScreen }) => {
  const [version, setVersion] = useState("Loading...");

  useEffect(() => {
    // Fetch the content of version.txt
    fetch("/version.txt")
      .then((response) => response.text())
      .then((text) => {
        setVersion(text.trim()); // Update state with fetched version
      })
      .catch(() => {
        setVersion("Error loading version"); // Handle any error during fetching
      });
  }, []);

  return (
    <footer>
      <Box sx={{ bgcolor: "#eeeeee", padding: "10px 0" }}>
        <Grid
          container
          direction={"row"}
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
          px={2}
        >
          <FooterContactInformation isSmallScreen={isSmallScreen} />

          <FooterCopyright version={version} />
        </Grid>
      </Box>
    </footer>
  );
};

export default Footer;
