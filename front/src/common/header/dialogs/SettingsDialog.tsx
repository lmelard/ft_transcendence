import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import AuthService from "../../../utils/auth-service";
import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../../../App";
import { Alert, Avatar, Box, Container, CssBaseline, Grid, Switch, TextField, ThemeProvider, Typography, createTheme, styled } from "@mui/material";
import TwoFaDialog from "./TwoFaDialog";
import { useThrowAsyncError } from "../../../utils/useThrowAsyncError";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Cloudinary } from "@cloudinary/url-gen";
import "./SettingsDialog.css";
import EditIcon from "@mui/icons-material/Create";
import PasswordDialod from "./PasswordDialog";
import axiosInstance from "../../../utils/axiosInstance";
import { IconButton } from "@mui/material";

interface Display {
  display: boolean;
  setDisplay: React.Dispatch<React.SetStateAction<boolean>>;
}

const theme = createTheme({
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

export default function SettingsDialog({ display, setDisplay }: Display) {
  const { user, setUser } = useContext(UserContext);
  new Cloudinary({ cloud: { cloudName: "dcmkar183" } });

  const [twoFAEnabled, setTwoFAEnabled] = useState<boolean>(user!.is2FAuthEnabled as boolean);
  const [changeQRCode, setChangeQRCode] = useState<boolean>(user!.is2FAuthEnabled ? false : true);
  const [changePassword, setChangePassword] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [successful, setSuccessful] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(user!.imageUrl)
  const throwAsyncError = useThrowAsyncError();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTwoFAEnabled(event.target.checked);
  };

  async function getFirstCon() {
    await axiosInstance.get("/user/updateFirstCon");
  }
  
  async function getUserFromBack() {
    const userTmp = await AuthService.getUserFromBack();
    if (userTmp) {
      setUser(userTmp);
    }
  }
  
  const handleSaveChanges = () => {
    async function updateAvatarInBack() {
      if (user?.imageUrl !== imageUrl) {
        await AuthService.updateAvatar(imageUrl)
      }
    }
    if (user?.firstCon) {
      getFirstCon()
        .then(() => {
          updateAvatarInBack().then(() => {
            getUserFromBack();
            setDisplay(false);
          })
        })
        .catch((error) => throwAsyncError(error));
    } else  {
      updateAvatarInBack().then(() => {
        getUserFromBack().then (() => {
          setDisplay(false);
        })
      })
      .catch((error) => throwAsyncError(error));
    }
  };

  const handleClose = () => {
    if (user?.firstCon) {
      // console.log('first connection');
      getFirstCon().then(() => {
        getUserFromBack();
        setDisplay(false);
      })
    } else {
      setDisplay(false);
    }
  }

  const validationSchema = Yup.object().shape({
    fullname: Yup.string().required("This field is required"),
    nickname: Yup.string()
      .test(
        "len",
        "The nickname must be between 3 and 8 characters.",
        (val: any) => val && val.toString().length >= 3 && val.toString().length <= 8
      )
      .required("This field is required"),
    email: Yup.string().email("This is not a valid email.").required("This field is required!"),
  });

  const formik = useFormik({
    initialValues: {
      fullname: user!.fullName,
      nickname: user!.nickname,
      email: user!.email,
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      handleSubmit(values);
    },
  });

  const handleSubmit = async (formValue: { fullname: string; nickname: string; email: string }) => {
    // console.log("ENTER HANDLE SUBMIT");

    const { fullname, nickname, email } = formValue;

    setMessage("");
    setSuccessful(false);

    try {
      await AuthService.changeSettings(fullname, nickname, email);
      // console.log("fullname", fullname);
      // console.log("nickname", nickname);
      // console.log("email", email);
      handleSaveChanges();
    } catch (error) {
      // console.log("catching error in handle login", error);
      setMessage("Changing settings failed. Email or nickname already taken.");
      //handleError(error);
      // GESTION DES ERREURS TO DOOO
    }
  };

  useEffect(() => {
    if (twoFAEnabled === false && changeQRCode === false) {
      try {
        AuthService.turnOffTwoFA();
        setChangeQRCode(true);
      } catch (error) {
        throwAsyncError(error);
      }
    }
  }, [twoFAEnabled]);

  const updateUser = async (newImageUrl: string) => {
    try {
      if (user?.imageUrl !== newImageUrl) {
        setImageUrl(newImageUrl);
      }
      // const usertmp = await AuthService.updateAvatar(newImageUrl);
      // if (usertmp) {
      //   setUser(usertmp);
      // }
    } catch (error) {
      // console.log("error updating user avatar", error);
    }
  };

  const handleFileChange = async (event: any) => {
    // console.log("event", event);
    const file: File = event.target.files[0];
    // console.log("file", file);
    if (file) {
      // console.log("enter if");
      try {
        await uploadImage(file).then((imageUrl) => {
          // console.log("image url", imageUrl);
          updateUser(imageUrl);
        });
      } catch (error) {
        // console.log("error", error);
      }
    }
  };

  const uploadImage = async (file: File) => {
    let updatedUrl: string = "";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "uorbr6p8");
    // console.log("formdata", formData);
    await fetch("https://api.cloudinary.com/v1_1/dcmkar183/image/upload", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        // console.log("data", data);
        // console.log("data.secure_url", data.secure_url);
        updatedUrl = data.secure_url;
      })
      .catch((error) => {
        // console.log("Error get user from back", error);
        throw error;
      });
    return updatedUrl;
  };

  const defaultTheme = createTheme();

  /* Permet de declencher le clic choix de fichier pour l'avatar lorsqu'on clique sur l'avatar  */
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const StyledAvatar = styled(Avatar)(({ theme }) => ({
    position: 'relative',
    cursor: 'pointer',
    '&:after': {
      content: '""',
      display: 'block',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      border: `4px solid ${theme.palette.background.paper}`, // Border color to match avatar's border
      boxSizing: 'border-box',
    }
  }));
  
  const EditOverlay = styled(IconButton)(({ theme }) => ({
    position: 'absolute',
    right: '0.25em', // Adjust this value as needed
    bottom: '0.20em', // Adjust this value as needed
    backgroundColor: theme.palette.background.paper, // Match with the theme's background color
    '&:hover': {
      backgroundColor: theme.palette.grey[200], // Slightly darker color on hover
    },
    borderRadius: '50%',
    padding: '0.10em', // Adjust padding to reduce the size of the icon
    border: '2px solid white', // Border around the edit icon to make it stand out
    '.MuiSvgIcon-root': { // This targets the icon itself inside the IconButton
      fontSize: '1rem', // Adjust icon size. Use 'em' to scale with the IconButton's padding
    }
  }));
  

  return (
    <ThemeProvider theme={theme}>
    <Dialog open={display} onClose={handleClose}>
      <ThemeProvider theme={defaultTheme}>
        <Container component="main" maxWidth="xs" sx={{mx: 1.75}}>
          <CssBaseline />
          <Box
            sx={{
              marginTop: 6,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <Typography component="h1" variant="h5" sx={{ mb: 0.5 }}>
                Settings
              </Typography>
            </div>
          <div style={{ position: "relative" }}>
          <input type="file" onChange={handleFileChange} className="file-input" ref={fileInputRef} style={{ display: "none" }} />
            <StyledAvatar
              sx={{ width: 100, height: 100 }} // Adjust avatar size if needed
              alt="User Avatar"
              src={imageUrl}
              // src={user?.imageUrl}
              onClick={handleAvatarClick}
            />
            <EditOverlay onClick={handleAvatarClick}>
              <EditIcon />
            </EditOverlay>
          </div>
            {!successful && (
              <form onSubmit={formik.handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography sx={{ mb: 1 }}>Informations</Typography>
                    <TextField
                      autoComplete="given-name"
                      name="fullname"
                      fullWidth
                      id="fullname"
                      label="Fullname"
                      value={formik.values.fullname}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.fullname && Boolean(formik.errors.fullname)}
                      helperText={formik.touched.fullname && formik.errors.fullname}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="nickname"
                      label="Nickname"
                      name="nickname"
                      autoComplete="nickname"
                      value={formik.values.nickname}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.nickname && Boolean(formik.errors.nickname)}
                      helperText={formik.touched.nickname && formik.errors.nickname}
                      disabled={true}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="email"
                      name="email"
                      label="Email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.email && Boolean(formik.errors.email)}
                      helperText={formik.touched.email && formik.errors.email}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography>Security</Typography>
                    <Grid container item xs={12} justifyContent="space-between" alignItems="center">
                      {/* <div style={{ display: 'flex', alignItems: 'center' }}> */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <span className="twofa-label">2FA </span>
                        <Switch checked={twoFAEnabled} onChange={handleChange} inputProps={{ "aria-label": "controlled" }} />
                      </div>
                      {!user?.login42 && (
                        <div>
                          {/* <Divider orientation="vertical" flexItem /> */}
                          <Button onClick={() => setChangePassword(true)} variant="contained"  sx={{ fontWeight: "bold", backgroundColor: '#366873' }}>
                            Change Password
                          </Button>
                        </div>
                      )}
                      {twoFAEnabled && changeQRCode && (
                        <TwoFaDialog
                          twoFAEnabled={twoFAEnabled}
                          setTwoFAEnabled={setTwoFAEnabled}
                          display={changeQRCode}
                          setDisplay={setChangeQRCode}
                        />
                      )}
                      {changePassword && <PasswordDialod changePassword={changePassword} setChangePassword={setChangePassword}></PasswordDialod>}
                    </Grid>
                  </Grid>
                </Grid>
                <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 0.5, fontWeight: "bold", backgroundColor: '#366873'}}>
                  Save changes
                </Button>
              </form>
            )}
            {message && !successful && <Alert severity="error">{message}</Alert>}
          </Box>
          <DialogActions>
            <Button onClick={handleClose} sx={{ mt:1, mb: 3, color: '#366873' }}>
              Cancel
            </Button>
          </DialogActions>
        </Container>
      </ThemeProvider>
    </Dialog>
    </ThemeProvider>
  );
}
