import React from "react";
import { TextField, Grid } from "@mui/material";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

type FormFieldProps = {
  field: string;
  formik: any;
  type?: string;
  handleShowPassword?: () => void;
  showPassword?: boolean;
};

const FormField: React.FC<FormFieldProps> = ({ field, formik, type, handleShowPassword, showPassword }) => (
  <Grid
    item
    xs={12}
  >
    <TextField
      fullWidth
      required
      id={field}
      name={field}
      label={field.charAt(0).toUpperCase() + field.slice(1)}
      type={type}
      value={formik.values[field]}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
      error={formik.touched[field] && Boolean(formik.errors[field])}
      helperText={formik.touched[field] && formik.errors[field]}
      InputProps={field === "password" && handleShowPassword ? {
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              onClick={handleShowPassword}
              edge="end"
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      } : undefined}
    />
  </Grid>
);

export default FormField;
