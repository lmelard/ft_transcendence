import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import { Avatar, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import Tooltip from '@mui/material/Tooltip';

interface NavigationMenuProps {
  isUserLoggedIn: boolean;
  anchorElNav: HTMLElement | null;
  handleOpenNavMenu: (event: React.MouseEvent<HTMLElement>) => void;
  handleCloseNavMenu: () => void;
}

const Logo = () => <Box component="img" sx={{ height: 60 }} alt="Crazy Pong Logo" src={"/CRAZZY_PONG.png"} />;

const NavigationMenu: React.FC<NavigationMenuProps> = ({ isUserLoggedIn, anchorElNav, handleOpenNavMenu, handleCloseNavMenu }) => {
  const menuItems = isUserLoggedIn
    ? [
        { label: "Leaderboard", path: "/leaderboard" },
        { label: "Profile", path: "/myprofile" },
        { label: "Play", path: "/" },
      ]
    : [
        { label: "Signin", path: "/signin" },
        { label: "Signup", path: "/signup" },
      ];

  const renderMenuButton = (label: string, path: string) => (
    <Button key={label} component={Link} to={path} onClick={handleCloseNavMenu} sx={{ my: 2, color: "white", display: "block" }}>
      {label}
    </Button>
  );

  const renderMenuItem = (label: string, path: string) => (
    <MenuItem key={label} component={Link} to={path} onClick={handleCloseNavMenu}>
      <Typography textAlign="center">{label}</Typography>
    </MenuItem>
  );

  return (
    <>
      {/* Mobile Menu */}
      <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
        <IconButton
          size="large"
          aria-label="account of current user"
          aria-controls="menu-appbar"
          aria-haspopup="true"
          onClick={handleOpenNavMenu}
          color="inherit"
        >
          <MenuIcon />
        </IconButton>
        <Menu
          id="menu-appbar"
          anchorEl={anchorElNav}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          keepMounted
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          open={Boolean(anchorElNav)}
          onClose={handleCloseNavMenu}
          sx={{
            display: { xs: "block", md: "none" },
          }}
        >
          {menuItems.map(({ label, path }) => renderMenuItem(label, path))}
        </Menu>
      </Box>

      {/* Desktop Menu */}
      <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>{menuItems.map(({ label, path }) => renderMenuButton(label, path))}</Box>
    </>
  );
};



interface UserMenuProps {
  imageUrl: string;
  anchorElUser: null | HTMLElement;
  handleOpenUserMenu: (event: React.MouseEvent<HTMLElement>) => void;
  handleCloseUserMenu: () => void;
  setOpenSettings: (open: boolean) => void;
  logOut: () => void;
  nickname : string;
}

const UserMenu: React.FC<UserMenuProps> = ({
  imageUrl,
  anchorElUser,
  handleOpenUserMenu,
  handleCloseUserMenu,
  setOpenSettings,
  logOut,
  nickname,
}) => {
  return (
    <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center' }}>
      <Typography variant="subtitle2" sx={{ mr: 1, color: 'white', display: { xs: 'none', md: 'block' } }}>
        {nickname}
      </Typography>
      <Tooltip title="Open settings">
        <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
          <Avatar alt="User Avatar" src={imageUrl} />
        </IconButton>
      </Tooltip>
      <Menu
        sx={{ mt: '45px' }}
        id="menu-appbar"
        anchorEl={anchorElUser}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorElUser)}
        onClose={handleCloseUserMenu}
      >
        <MenuItem onClick={() => { setOpenSettings(true); handleCloseUserMenu(); }}>
          <SettingsIcon sx={{ marginRight: 1, fontSize: 15 }} />
          <Typography textAlign="center">Settings</Typography>
        </MenuItem>
        <MenuItem onClick={() => { logOut(); handleCloseUserMenu(); }}>
          <ExitToAppIcon sx={{ marginRight: 1, fontSize: 20 }} />
          <Typography textAlign="center">Logout</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export { Logo, NavigationMenu, UserMenu };
