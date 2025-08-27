import React from "react";
import { Routes, Route, useParams } from "react-router-dom";
import LoginMicrosoft from "./components/LoginMicrosoft";
import TimesheetHeaderList from "./components/TimesheetHeaderList";
import TimesheetEdit from "./components/TimesheetEdit";
import HomeDashboard from "./components/HomeDashboard";
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
        <Route path="/" element={<HomeDashboard />} />
        <Route
          path="/partes/:year?/:month?"
          element={<TimesheetHeaderList />}
        />
        <Route path="/edit/:headerId" element={<TimesheetEditWrapper />} />
        {/* nuevas rutas para editar por periodo o por id */}
        <Route path="/editar-parte" element={<TimesheetEdit />} />
        <Route
          path="/editar-parte/:headerId"
          element={<TimesheetEditWrapper />}
        />
      </Routes>
    </div>
  );
}

export default App;
