import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "react-error-boundary";
import axiosInstance from "./utils/axiosInstance";
import SomethingWentWrong from "./common/notFound/SomethingWentWrong";
import { Cookies } from "react-cookie";

// window.addEventListener("beforeunload", async () => {
//   await axiosInstance.get("/user/closingWindow");
// });

window.addEventListener("beforeunload", async () => {
  const cookies = new Cookies();
  if (cookies.get("jwt")){
    await axiosInstance.get("/user/closingWindow").catch((e) => {
      // Handle or log the error
      console.error("Request aborted", e);
    });
  }
});



window.addEventListener("keydown", (e: KeyboardEvent) => {
  const target = e.target as HTMLElement;
  if (e.code === 'ArrowUp' || e.code === 'ArrowDown' || (e.code === "Space" && target.nodeName !== "INPUT" && target.nodeName !== "TEXTAREA")) {
    e.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  //   <React.StrictMode>
  <ErrorBoundary fallback={<SomethingWentWrong></SomethingWentWrong>}>
    <App />
  </ErrorBoundary>
  // </React.StrictMode>
);
