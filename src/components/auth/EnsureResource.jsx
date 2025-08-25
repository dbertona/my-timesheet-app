import React, { useCallback, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { supabaseClient } from "../../supabaseClient";
import BcModal from "../ui/BcModal";

export default function EnsureResource() {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(false);
  const [email, setEmail] = useState("");
  const [showModal, setShowModal] = useState(false);

  const check = useCallback(async () => {
    setLoading(true);
    try {
      let userEmail = "";
      try {
        const acct = instance.getActiveAccount() || accounts[0];
        userEmail = acct?.username || acct?.email || "";
      } catch {}
      setEmail(userEmail || "");
      if (!userEmail) {
        setExists(false);
        setShowModal(true);
        return;
      }
      const { data, error } = await supabaseClient
        .from("resource")
        .select("code")
        .eq("email", userEmail)
        .maybeSingle();
      if (error || !data) {
        setExists(false);
        setShowModal(true);
        return;
      }
      setExists(true);
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  }, [instance, accounts]);

  useEffect(() => {
    check();
  }, [check]);

  if (loading) return null;
  if (!exists) {
    return (
      <BcModal
        isOpen={true}
        onClose={() => navigate("/")}
        title="Recurso no encontrado"
        confirmText="Reintentar"
        cancelText="Volver"
        onConfirm={() => {
          setShowModal(false);
          check();
        }}
        onCancel={() => navigate("/")}
      >
        <p>No se encontró un recurso asociado al email {email || "(desconocido)"}. Por favor, verifica la tabla 'resource'.</p>
      </BcModal>
    );
  }
  return <Outlet />;
}
