import React, { useState } from "react";
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { Link } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import PostAddIcon from '@mui/icons-material/PostAdd';
import InfoIcon from "@mui/icons-material/Info";
import { generateRandomId } from "../../utilities/helpers";

const logo =
  "https://firebasestorage.googleapis.com/v0/b/amir-portfolio-9fe8a.appspot.com/o/assets%2Famir-icon.png?alt=media&token=076c331b-7332-4ff6-b299-78e2d71a52ad";
const tongueLogo =
  "https://firebasestorage.googleapis.com/v0/b/amir-portfolio-9fe8a.appspot.com/o/assets%2Famir-tongue-icon.png?alt=media&token=d44e04e1-ec1a-416c-84c4-0e917e4046ae";

const HeaderLogo = ({ isSmallScreen }) => {
  const [isHovered, setHovered] = useState(false);

  return (
    <>
      {!isSmallScreen && (
        <Link
          to="/"
          style={{
            textDecoration: "none",
            display: "flex",
            color: "inherit",
            marginLeft: -10,
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <img
            src={isHovered ? tongueLogo : logo}
            alt="QRganize"
            height={55}
          />
        </Link>
      )}

      <Typography
        variant="h5"
        sx={{
          flexGrow: 1,
          textAlign: isSmallScreen ? "center" : "left",
          ml: isSmallScreen ? -5 : 1,
        }}
      >
        QRganize
      </Typography>
    </>
  );
};

const LargeScreenIcon = ({ title, link, icon }) => {
  return (
    <Tooltip title={title}>
      <Link to={link} style={{ textDecoration: "none", color: "inherit" }}>
        <IconButton color="inherit">{icon}</IconButton>
      </Link>
    </Tooltip>
  );
};

const SmallScreenIcon = ({ title, link, icon, handleDrawerClose }) => {
  return (
    <Link to={link} style={{ textDecoration: "none", color: "inherit" }}>
      <ListItem button onClick={handleDrawerClose}>
        {icon && <IconButton color="inherit">{icon}</IconButton>}
        <ListItemText primary={title} />
      </ListItem>
    </Link>
  );
};

const Header = ({ isSmallScreen }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const headerIcons = [
    { title: "Home", link: "/", icon: <HomeIcon /> },
    { title: "Add Item", link: `/item/${generateRandomId()}`, icon: <PostAddIcon /> },
    { title: "About", link: "/about", icon: <InfoIcon /> },
  ];

  return (
    <Box sx={{ flexGrow: 1, marginBottom: 7 }}>
      <AppBar position="fixed">
        <Toolbar>
          {isSmallScreen && (
            <IconButton
              size="medium"
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleDrawerOpen}
            >
              <img
                src={isDrawerOpen ? tongueLogo : logo}
                alt="QRganize"
                height={50}
              />
            </IconButton>
          )}

          <HeaderLogo isSmallScreen={isSmallScreen} />

          {!isSmallScreen && (
            <>
              {headerIcons.map((item, index) => (
                <LargeScreenIcon
                  key={index}
                  title={item.title}
                  link={item.link}
                  icon={item.icon}
                />
              ))}
            </>
          )}
        </Toolbar>
      </AppBar>

      {isSmallScreen && (
        <Drawer anchor="left" open={isDrawerOpen} onClose={handleDrawerClose}>
          <List>
            {headerIcons.map((item, index) => (
              <SmallScreenIcon
                key={index}
                title={item.title}
                link={item.link}
                icon={item.icon}
                handleDrawerClose={handleDrawerClose}
              />
            ))}
          </List>
        </Drawer>
      )}
    </Box>
  );
};

export default Header;
