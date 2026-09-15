import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import './index.css';
import { initTheme, watchSystemTheme } from './Utils/theme';
import { Provider } from "react-redux";
import store from "./redux/store";


// Applied before the first paint so a dark user never sees a white flash.
initTheme();
watchSystemTheme();

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
);
