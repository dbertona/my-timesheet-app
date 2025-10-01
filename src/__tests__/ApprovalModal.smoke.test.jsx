import '@testing-library/jest-dom';
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import ApprovalModal from "../components/ui/ApprovalModal";

describe("ApprovalModal smoke", () => {
  const sampleDays = [
    { date: "2025-08-10", imputedHours: 8, requiredHours: 8 },
    { date: "2025-08-11", imputedHours: 8, requiredHours: 8 },
  ];

  it("abre, selecciona y confirma", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ApprovalModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        availableDays={sampleDays}
      />
    );

    // Debe mostrar botón de enviar con contador
    const sendBtn = screen.getByRole('button', { name: /Enviar Aprobación/i });
    expect(sendBtn).toBeEnabled();

    // Desmarcar todos con el checkbox global (etiqueta "Seleccionar todos")
    const selectAll = screen.getByLabelText(/Seleccionar todos/i);
    fireEvent.click(selectAll);
    expect(sendBtn).toBeDisabled();

    // Volver a marcar todos
    fireEvent.click(selectAll);
    expect(sendBtn).toBeEnabled();

    // Confirmar
    fireEvent.click(sendBtn);
    expect(onConfirm).toBeCalled();
    expect(onClose).toBeCalled();
  });
});


