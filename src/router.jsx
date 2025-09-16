/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { createBrowserRouter, Outlet, useParams } from "react-router-dom";
import AppError from "./components/ui/AppError";
import LoginMicrosoft from "./components/LoginMicrosoft";
import TimesheetHeaderList from "./components/TimesheetHeaderList";
import TimesheetEdit from "./components/TimesheetEdit";
import TimesheetListPage from "./components/TimesheetListPage";
import HomeDashboard from "./components/HomeDashboard";
import ApprovalPage from "./components/ApprovalPage";
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
    errorElement: <AppError />,
    children: [
      { index: true, element: <HomeDashboard />, errorElement: <AppError /> },
      {
        path: "partes/:year?/:month?",
        element: <TimesheetHeaderList />,
        errorElement: <AppError />,
      },
      {
        path: "aprobacion",
        element: <ApprovalPage />,
        errorElement: <AppError />,
      },
      {
        element: <EnsureResource />, // Guard: requiere recurso válido
        errorElement: <AppError />,
        children: [
          {
            path: "mis-partes",
            element: <TimesheetListPage />,
            errorElement: <AppError />,
          },
          {
            path: "edit/:headerId",
            element: <TimesheetEditWrapper />,
            errorElement: <AppError />,
          },
          {
            path: "editar-parte",
            element: <TimesheetEdit />,
            errorElement: <AppError />,
          },
          {
            path: "editar-parte/:headerId",
            element: <TimesheetEditWrapper />,
            errorElement: <AppError />,
          },
          {
            path: "nuevo-parte",
            element: <TimesheetEdit />,
            errorElement: <AppError />,
          },
        ],
      },
    ],
  },
]);
