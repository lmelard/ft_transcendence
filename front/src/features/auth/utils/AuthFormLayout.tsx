import React from 'react';
import { Box, Typography } from '@mui/material';

type AuthFormLayoutProps = {
  title: string;
  children: React.ReactNode;
};

const AuthFormLayout: React.FC<AuthFormLayoutProps> = ({ title, children }) => (
  <Box sx={{ marginTop: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
    <Typography component="h1" variant="h5" textAlign="center" sx={{ mb: 3 }}>
      {title}
    </Typography>
    {children}
  </Box>
);

export default AuthFormLayout;