import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import AuthService from "../../../utils/auth-service";
import { useContext, useState } from "react";
import { UserContext } from "../../../App";
import axiosInstance from "../../../utils/axiosInstance";

interface Display {
  display2FA: boolean;
  setDisplay2FA: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function FormDialog({ display2FA, setDisplay2FA }: Display) {
  const { setUser } = useContext(UserContext);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [verification2FAError, setVerification2FAError] = useState<string>("");

  const handleClose = () => {
    setDisplay2FA(false);
    setUser(null);
  };

  const handleVerifyCode = async () => {
    try {
      const response = await axiosInstance.post("/user/verify2FA", { token: verificationCode });
      if (response.data.ok) {
        setDisplay2FA(false);
        const user = await AuthService.getUserFromBack();
        await axiosInstance.post("/user/setOnline", null);
        setUser(user);
      }
    } catch (error) {
      if (typeof error === "object" && error !== null && "response" in error) {
        const axiosError = error as { response: { data: { error: string; message: string } } };

        if (axiosError.response && axiosError.response.data) {
          setVerification2FAError(`${axiosError.response.data.error} : ${axiosError.response.data.message}`);
        } else {
          // Handle case where error response is not in the expected format
          setVerification2FAError("An unknown error occurred");
        }
      } else {
        // Handle non-Axios errors
        setVerification2FAError("An unknown error occurred");
      }
    }
  };

  const handleVerificationCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVerificationCode(event.target.value);
  };

  return (
    <div>
      <Dialog open={display2FA} onClose={handleClose}>
        <DialogTitle>Two Factors Authentication</DialogTitle>
        <DialogContent>
          {verification2FAError && <div style={{ color: "red" }}>{verification2FAError}</div>}
          <DialogContentText>Please enter your authentication code to login.</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="verificationCode"
            label="Auth Code"
            type="text"
            fullWidth
            variant="standard"
            value={verificationCode}
            onChange={handleVerificationCodeChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleVerifyCode}>Login</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
