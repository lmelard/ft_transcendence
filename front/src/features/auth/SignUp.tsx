/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import AuthService from "../../utils/auth-service";
import { Alert, Button, Container, Grid, ThemeProvider, createTheme } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import FormField from "./utils/FormField";
import AuthFormLayout from "./utils/AuthFormLayout";

type FormFields = "firstname" | "lastname" | "nickname" | "email" | "password";
const theme = createTheme({
  palette: {
    background: {
      default: '#FFFFFF' // Votre couleur de fond personnalisée
    },
  },
  components: {
    // Style des boutons MUI
    MuiButton: {
      styleOverrides: {
        // Appliquez ce style aux boutons avec la variante "contained"
        contained: {
          backgroundColor: '#366873', // votre couleur personnalisée
          color: '#fff', // texte blanc
          '&:hover': {
            backgroundColor: '#2d5559', // une teinte légèrement plus foncée pour l'effet hover
          },
          // Ajoutez d'autres styles si nécessaire
        },
      },
    },
  },
});

const SignUp: React.FC = () => {
  const [status, setStatus] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (formValue: { firstname: string; lastname: string; nickname: string; email: string; password: string }) => {
    const { firstname, lastname, nickname, email, password } = formValue;
    setStatus({ message: "", type: "" });
    setLoading(true);

    try {
      await AuthService.register(firstname, lastname, nickname, email, password).then(() => {
        setStatus({ message: "User successfully registered!", type: "success" });
        navigate("/signin");
      });
    } catch (error) {
      if (typeof error === "object" && error !== null && "response" in error) {
        // Assuming error is in the structure { response: { data: { message: string } } }
        const message = (error as { response: { data: { message: string } } }).response.data.message;
        setStatus({ message: message, type: "error" });
      } else {
        // Handle unexpected error types
        setStatus({ message: "An unexpected error occurred", type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  const validationSchema = Yup.object().shape({
    firstname: Yup.string().required("This field is required"),
    lastname: Yup.string().required("This field is required"),
    nickname: Yup.string()
      .required("This field is required")
      .min(3, "Nickname must be at least 3 characters.")
      .max(8, "Nickname must not exceed 8 characters."),
    email: Yup.string().email("This is not a valid email.").required("This field is required!"),
    password: Yup.string()
      .required("This field is required")
      .min(6, "Password must be at least 6 characters.")
      .max(40, "Password must not exceed 40 characters."),
  });

  const formik = useFormik({
    initialValues: {
      firstname: "",
      lastname: "",
      nickname: "",
      email: "",
      password: "",
    },
    validationSchema: validationSchema,
    onSubmit: handleSubmit,
  });

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <ThemeProvider theme={theme}>
    <Container component="main" maxWidth="xs" sx={{ bgcolor: 'background.default', maxHeight: '100vh - 120px', display: 'flex', flexDirection: 'column' }}>
      <AuthFormLayout title="Sign Up">
        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={2}>
            {(["firstname", "lastname", "nickname", "email"] as FormFields[]).map((field) => (
              <FormField field={field} formik={formik} type={field === "password" ? "password" : "text"} key={field} />
            ))}
            <FormField field="password" formik={formik} 
              type={showPassword ? 'text' : 'password'} 
              handleShowPassword={handleClickShowPassword}
              showPassword={showPassword}
            />
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              mb: 2,
              fontWeight: "bold",
              
            }}
          >
            {loading && <span className="spinner-border spinner-border-sm"></span>}
            Sign up
          </Button>
        </form>
        <Grid container>
        <Grid item>
        <RouterLink to="/signin" style={{ fontSize: "0.9rem", fontWeight: "normal", color: "#366873" }}>
          Already have an account? Sign in
        </RouterLink>
        </Grid>
        </Grid>
        {status.message && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {status.message}
          </Alert>
        )}
      </AuthFormLayout>
    </Container>
    </ThemeProvider>
  );
};

export default SignUp;
