/* eslint-disable @typescript-eslint/no-explicit-any */
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Main from "./common/main/Main";
import SignIn from "./features/auth/SignIn";
import SignUp from "./features/auth/SignUp";
import NotFound from "./common/notFound/notFound";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import AuthService from "./utils/auth-service";
import { createContext, useEffect, useState } from "react";
import { UserDetails } from "./model/UserDetails";
import { Navigate } from "react-router-dom";
import { User } from "./model/User";
import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "@socket.io/component-emitter";
//import { useThrowAsyncError } from "./utils/useThrowAsyncError";
import Header from "./common/header/Header";
import axiosInstance from "./utils/axiosInstance";
import { Cookies } from "react-cookie";
import { CircularProgress } from "@mui/material";
import { createTheme, ThemeProvider } from '@mui/material/styles';


interface UserContextProps {
  user: UserDetails | null;
  setUser: React.Dispatch<React.SetStateAction<UserDetails | null>>;
  allPlayers: User[];
  setPlayersList: React.Dispatch<React.SetStateAction<User[]>>;
  friendsList: User[];
  setFriendsList: React.Dispatch<React.SetStateAction<User[]>>;
  blackList: User[];
  setBlackList: React.Dispatch<React.SetStateAction<User[]>>;
  gameSocket: Socket | null;
  setGameSocket: React.Dispatch<React.SetStateAction<Socket<DefaultEventsMap, DefaultEventsMap> | null>>;
  chatSocket: Socket | null;
  setChatSocket: React.Dispatch<React.SetStateAction<Socket<DefaultEventsMap, DefaultEventsMap> | null>>;
}

const initialContext: UserContextProps = {
  user: null,
  setUser: () => {},
  allPlayers: [],
  setPlayersList: () => {},
  friendsList: [],
  setFriendsList: () => {},
  blackList: [],
  setBlackList: () => {},
  gameSocket: null,
  setGameSocket: () => {},
  chatSocket: null,
  setChatSocket: () => {},
};

const theme = createTheme({
  palette: {
    background: {
      default: '#FFFFFF' // Votre couleur de fond personnalisée
    },
  },
  // ... autres personnalisations du thème si nécessaire
});

export const UserContext = createContext<UserContextProps>(initialContext);

function App() {
  //console.log("Debut fonction App");
  const [user, setUser] = useState<UserDetails | null>(null);
  const [allPlayers, setPlayersList] = useState<User[]>([]);
  const [friendsList, setFriendsList] = useState<User[]>([]);
  const [blackList, setBlackList] = useState<User[]>([]);
  const [gameSocket, setGameSocket] = useState<Socket | null>(null);
  const [chatSocket, setChatSocket] = useState<Socket | null>(null);
  const [display2FA, setDisplay2FA] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  //const throwAsyncError = useThrowAsyncError();

  const cookies = new Cookies();


  const initializeUserSession = async () => {
    try {
      if (cookies.get("error")) {
        //console.log('HERE', cookies.get("error"))
        if (cookies.get("jwt")) {
          cookies.remove("error");
        } else {
          alert(cookies.get("error").message);
        }
        return
      }

      if (!cookies.get("jwt")) {
        if (gameSocket) gameSocket.disconnect;
        if (chatSocket) chatSocket.disconnect;

        return;
      }
      // Fetch the user details from the backend
      const fetchedUser = await AuthService.getUserFromBack();
      
      // Check if user is fetched successfully and either 2FA is not enabled or 2FA verification has passed
      if (fetchedUser && (!fetchedUser.is2FAuthEnabled || fetchedUser.is2FAPassed)) {
        setUser(fetchedUser);
        await axiosInstance.post("/user/setOnline", null);
      }
      // If 2FA is enabled but not yet passed, prompt for 2FA verification
      else if(fetchedUser && !fetchedUser.is2FAPassed) {
        setDisplay2FA(true);
      }
    } catch (error) {
      setUser(null);
      //throwAsyncError(error);
    } finally {
      setLoading(false); // Arrêtez le chargement une fois que tout est fini
    }
  };

  useEffect(() => {
    initializeUserSession();
  }, []);

  if (loading) {
    return (
      <div className="centered">
        <CircularProgress size={100}/>
      </div>
    );
  }

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        allPlayers,
        setPlayersList,
        friendsList,
        setFriendsList,
        blackList,
        setBlackList,
        gameSocket,
        setGameSocket,
        chatSocket,
        setChatSocket,
      }}
    >
      <ThemeProvider theme={theme}>
      <Router>
        <Header />
        <div className="container-fluid">
          <Routes>
            <Route path="/signin" element={user ? <Navigate to="/" /> : <SignIn display2FA = {display2FA} setDisplay2FA = {setDisplay2FA}/>} />
            <Route path="/signup" element={user ? <Navigate to="/" /> : <SignUp />} />
            <Route path="/" element={user ? <Main /> : <Navigate to="/signin" />} />
            <Route path="/leaderboard" element={user ? <Main /> : <Navigate to="/signin" />} />
            <Route path="/myprofile" element={user ? <Main /> : <Navigate to="/signin" />} />
            <Route path="/profile/:userId" element={user ? <Main /> : <Navigate to="/signin" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
    </UserContext.Provider>
  );
}

export default App;
