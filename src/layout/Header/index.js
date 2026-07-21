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
  ListItemIcon,
  Menu,
  MenuItem,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Link } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import PostAddIcon from '@mui/icons-material/PostAdd';
import InfoIcon from "@mui/icons-material/Info";
import QrCodeIcon from '@mui/icons-material/QrCode';
import WidgetsIcon from '@mui/icons-material/Widgets';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import PrintIcon from '@mui/icons-material/Print';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import SearchIcon from '@mui/icons-material/Search';
import { generateRandomId } from "../../utilities/helpers";
import qrganizeLogo from "../../assets/QRganize-logo.png";

const logo = qrganizeLogo;
const tongueLogo = qrganizeLogo;

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

const Header = ({ isSmallScreen, mode, onToggleTheme }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [moreAnchor, setMoreAnchor] = useState(null);

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  // Everyday actions stay as icons; the rest fold into an overflow menu so the
  // desktop bar doesn't overflow. (Mobile shows the full labeled drawer.)
  const primaryIcons = [
    { title: "Home", link: "/", icon: <HomeIcon /> },
    { title: "Search", link: "/search", icon: <SearchIcon /> },
    { title: "Containers", link: "/qrcode", icon: <QrCodeIcon /> },
    { title: "Add Item", link: `/item`, icon: <PostAddIcon /> },
    { title: "Scan Receipt", link: "/scan-receipt", icon: <ReceiptLongIcon /> },
  ];
  const moreIcons = [
    { title: "Add Container", link: `/container/${generateRandomId()}`, icon: <WidgetsIcon /> },
    { title: "Areas", link: "/areas", icon: <WarehouseIcon /> },
    { title: "Print Labels", link: "/labels", icon: <PrintIcon /> },
    { title: "Find Duplicates", link: "/duplicates", icon: <MergeTypeIcon /> },
    { title: "About", link: "/about", icon: <InfoIcon /> },
  ];
  const headerIcons = [...primaryIcons, ...moreIcons];

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
              {primaryIcons.map((item, index) => (
                <LargeScreenIcon
                  key={index}
                  title={item.title}
                  link={item.link}
                  icon={item.icon}
                />
              ))}

              <Tooltip title="More">
                <IconButton
                  color="inherit"
                  onClick={(e) => setMoreAnchor(e.currentTarget)}
                  aria-label="more actions"
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={moreAnchor}
                open={Boolean(moreAnchor)}
                onClose={() => setMoreAnchor(null)}
              >
                {moreIcons.map((item, index) => (
                  <MenuItem
                    key={index}
                    component={Link}
                    to={item.link}
                    onClick={() => setMoreAnchor(null)}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.title} />
                  </MenuItem>
                ))}
              </Menu>

              <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
                <IconButton
                  color="inherit"
                  onClick={onToggleTheme}
                  aria-label="toggle light/dark theme"
                >
                  {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
              </Tooltip>
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

            <ListItem
              button
              onClick={() => {
                onToggleTheme();
                handleDrawerClose();
              }}
            >
              <IconButton color="inherit">
                {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
              <ListItemText primary={mode === "dark" ? "Light mode" : "Dark mode"} />
            </ListItem>
          </List>
        </Drawer>
      )}
    </Box>
  );
};

export default Header;
