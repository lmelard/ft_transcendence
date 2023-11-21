import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useState, useEffect } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import { Alert } from "@mui/material";

interface Display {
  twoFAEnabled: boolean;
  setTwoFAEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  display: boolean;
  setDisplay: React.Dispatch<React.SetStateAction<boolean>>;
}

// props state open et setopen a envoyer
export default function TwoFaDialog({ twoFAEnabled, setTwoFAEnabled, display, setDisplay }: Display) {
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [verification2FAError, setVerification2FAError] = useState<string>("");

  const fetchQrCode = async () => {
    try {
      const response = await axiosInstance.get("/user/generate2FA");
      if (response.data) {
        const qrCodeUrl = response.data; // .text()" will give you the result in string format, and ".json()" will parse it from JSON and convert it into an object
        setOtpauthUrl(qrCodeUrl);
      } else {
        console.error("Error fetching QR code:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching QR code:", error);
    }
  };

  const handleClose = async () => {
    await axiosInstance.post("/user/turnOff2FA", null);
    setDisplay(true);
    setTwoFAEnabled(false);
  };

  const handleVerifyCode = async () => {
    try {
      const response = await axiosInstance.post("/user/verify2FA", { token: verificationCode });
      if (response.data.ok) {
        setDisplay(false);
        setTwoFAEnabled(true);
      }
    } catch (error) {
      if (typeof error === "object" && error !== null && 'response' in error) {
        const axiosError = error as { response: { data: { error: string; message: string; }; }; };
        
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

  useEffect(() => {
    if (twoFAEnabled === true && display === true) {
      fetchQrCode();
    }
  }, []);

  return (
    <div>
      <Dialog open={display} onClose={handleVerificationCodeChange}>
        <DialogTitle>Two Factors Authentication</DialogTitle>
        <DialogContent>
          <img className="twofa-qrc" src={otpauthUrl} alt="QR Code" />
          <DialogContentText>Please enter your authentication code to activate 2FA.</DialogContentText>
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
          {verification2FAError && 
          <Alert severity="error" sx={{ mt: 2 }}>
            {verification2FAError}
          </Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleVerifyCode}>Activate</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
