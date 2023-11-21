import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useState, useEffect } from 'react';
import AuthService from '../../../utils/auth-service';
import { Alert } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from "yup";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

interface Display {
  changePassword: boolean;
  setChangePassword: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function PasswordDialod({ changePassword, setChangePassword }: Display) {
	
	const [defineNewPassword, setDefineNewPassword] = useState<boolean>(false);
	const [message, setMessage] = useState<string>('');
	const [currentPassword, setCurrentPassword] = useState<string>('');
	const [showPassword, setShowPassword] = useState(false);

  const validationSchema = Yup.object().shape({
    newPassword: Yup.string()
      .test("is-different", "New password must be different from current password", function (value) {
        return value !== currentPassword;
      })
      .test(
        "len",
        "The password must be between 6 and 40 characters.",
        (val: any) => val && val.toString().length >= 6 && val.toString().length <= 40
      )
      .required("This field is required!"),
    verifyPassword: Yup.string()
      .oneOf([Yup.ref("newPassword"), undefined], "Passwords don't match")
      .required("This field is required!"),
  });

	const validationSchemaFirst = Yup.object().shape({
		enteredPassword: Yup.string()
			.required("This field is required!"),
	});

	const handleSubmit = async (formValue: {newPassword: string}) => {
		const {newPassword} = formValue;
		// console.log('new password', newPassword);
		setMessage("");
		try {
			await AuthService.updatePassword(newPassword)
			handleClose();
		} catch (error) {
			// console.log('Error updating password', error);
			setMessage('Error updating password');
		}
	}

  const formik = useFormik({
    initialValues: {
      newPassword: "",
      verifyPassword: "",
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      handleSubmit(values);
    },
  });

	const formikFirst = useFormik({
		initialValues: {
			enteredPassword: '',
		},
		validationSchema: validationSchemaFirst,
		onSubmit: (value) => {
		handleVerifyPassword(value);
		},
	})


  const handleClose = () => {
    setChangePassword(false);
    setDefineNewPassword(false);
    setMessage("");
  };

  const handleVerifyPassword = async (formValue: {enteredPassword: string}) => {
	setMessage("");
	const {enteredPassword} = formValue;
	let ret: boolean = false;
    try {
		// console.log('current password', enteredPassword);
      	ret = await AuthService.checkCurrentPassword(enteredPassword);
		setMessage("");
		setDefineNewPassword(true);
		setCurrentPassword(enteredPassword);
    } catch (error) {
      setMessage("Wrong password, try again.");
      //ajouter erreur reseau
      console.error("Verification error:", error, ret);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() =>  {
  }, []);

  return (
    <div>
      <Dialog open={changePassword} onClose={handleClose}>
        <DialogTitle>Change my password</DialogTitle>
          {!defineNewPassword ? (
			<div>
			<form onSubmit={formikFirst.handleSubmit}>
			<DialogContent>
				<DialogContentText>
				  Please enter your current password.
				</DialogContentText>
				<TextField
				  autoFocus
				  margin="dense"
				  id="enteredPassword"
				  label="Current password"
				  type={showPassword ? 'text' : 'password'}
					fullWidth
					variant="standard"
					value={formikFirst.values.enteredPassword}
					onChange={formikFirst.handleChange}
					onBlur={formikFirst.handleBlur}
					// error={formikFirst.touched.enteredPassword && Boolean(formik.errors.newPassword)}
					helperText={formikFirst.touched.enteredPassword && formikFirst.errors.enteredPassword}
					InputProps={{
						endAdornment: (
							<InputAdornment position="end">
							<IconButton
								aria-label="toggle password visibility"
								onClick={handleClickShowPassword}
								edge="end"
							>
								{showPassword ? <VisibilityOff /> : <Visibility />}
							</IconButton>
							</InputAdornment>
						),
					}}
				/>
			{ message && <Alert severity="error"> {message} </Alert>}
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose}>Cancel</Button>
				<Button type="submit">Change password</Button>
			</DialogActions>
			</form>
			</div>
		  ) : (
				<form onSubmit={formik.handleSubmit}>
				<DialogContent>
					<DialogContentText>
					Please enter your new password.
					</DialogContentText>
					<TextField
					// autoFocus
					margin="dense"
					id="newPassword"
					label="New password"
					type={showPassword ? 'text' : 'password'}
					fullWidth
					variant="standard"
					value={formik.values.newPassword}
					onChange={formik.handleChange}
					onBlur={formik.handleBlur}
					// error={formik.touched.newPassword && Boolean(formik.errors.newPassword)}
					helperText={formik.touched.newPassword && formik.errors.newPassword}
					InputProps={{
						endAdornment: (
						  <InputAdornment position="end">
							<IconButton
							  aria-label="toggle password visibility"
							  onClick={handleClickShowPassword}
							  edge="end"
							>
							  {showPassword ? <VisibilityOff /> : <Visibility />}
							</IconButton>
						  </InputAdornment>
						),
					}}
					/>
					<TextField
					// autoFocus
					margin="dense"
					id="verifyPassword"
					label="Verify password"
					type={showPassword ? 'text' : 'password'}
					fullWidth
					variant="standard"
					value={formik.values.verifyPassword}
					onChange={formik.handleChange}
					onBlur={formik.handleBlur}
					// error={formik.touched.verifyPassword && Boolean(formik.errors.verifyPassword)}
					helperText={formik.touched.verifyPassword && formik.errors.verifyPassword}
					InputProps={{
						endAdornment: (
						  <InputAdornment position="end">
							<IconButton
							  aria-label="toggle password visibility"
							  onClick={handleClickShowPassword}
							  edge="end"
							>
							  {showPassword ? <VisibilityOff /> : <Visibility />}
							</IconButton>
						  </InputAdornment>
						),
					}}
					/>
				{ message && <Alert severity="error">{message} </Alert> }
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose}>Cancel</Button>
					<Button type="submit">
						Save changes
					</Button>
				</DialogActions>
				</form>
		  )}
      </Dialog>
    </div>
  );
}
