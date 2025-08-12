import React from "react";
import { Routes, Route, useParams } from "react-router-dom";
import LoginMicrosoft from "./components/LoginMicrosoft";
import TimesheetHeaderList from "./components/TimesheetHeaderList";
import TimesheetEdit from "./components/TimesheetEdit";
import "react-datepicker/dist/react-datepicker.css";

function TimesheetEditWrapper() {
  const { headerId } = useParams();
  return <TimesheetEdit headerId={headerId} />;
}

function App() {
  return (
    <div style={{ padding: "2rem", fontSize: "1.5rem" }}>
      <LoginMicrosoft />
      <Routes>
        <Route path="/" element={<TimesheetHeaderList />} />
        <Route path="/edit/:headerId" element={<TimesheetEditWrapper />} />
      </Routes>
    </div>
  );
}

export default App;
