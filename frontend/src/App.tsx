import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { configureAxiosInterceptors } from "./services/axios"; 
import UserRouter from "./router/UserRouter";

const App = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    configureAxiosInterceptors(dispatch, navigate);
  }, [dispatch, navigate]);

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/*" element={<UserRouter />} />
      </Routes>
    </>
  );
};

export default App;




