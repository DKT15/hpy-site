import PropTypes from "prop-types";
import "../../styles/AppLoading.css";

export default function AppLoading({ message = "Loading Histopository..." }) {
  return (
    <div className="app-loading" role="status" aria-live="polite">
      <img src="/histopository-logo.png" alt="" className="app-loading-logo" />

      <div className="app-loading-spinner" />

      <p>{message}</p>
    </div>
  );
}

AppLoading.propTypes = {
  message: PropTypes.string,
};
