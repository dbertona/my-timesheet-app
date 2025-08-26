/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { createBrowserRouter, Outlet, useParams } from "react-router-dom";
import LoginMicrosoft from "./components/LoginMicrosoft";
import TimesheetHeaderList from "./components/TimesheetHeaderList";
import TimesheetEdit from "./components/TimesheetEdit";
import HomeDashboard from "./components/HomeDashboard";
import RequireMsalAuth from "./components/auth/RequireMsalAuth";
import EnsureResource from "./components/auth/EnsureResource";

function TimesheetEditWrapper() {
  const { headerId } = useParams();
  return <TimesheetEdit headerId={headerId} />;
}

function AppWrapper() {
  return (
    <RequireMsalAuth>
      <div style={{ padding: "2rem", fontSize: "1.5rem" }}>
        <LoginMicrosoft />
        <Outlet />
      </div>
    </RequireMsalAuth>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppWrapper />,
    children: [
      { index: true, element: <HomeDashboard /> },
      { path: "partes/:year?/:month?", element: <TimesheetHeaderList /> },
      {
        element: <EnsureResource />, // Guard: requiere recurso válido
        children: [
          { path: "edit/:headerId", element: <TimesheetEditWrapper /> },
          { path: "editar-parte", element: <TimesheetEdit /> },
          { path: "editar-parte/:headerId", element: <TimesheetEditWrapper /> },
          { path: "nuevo-parte", element: <TimesheetEdit /> }
        ]
      }
    ]
  }
]);
