codeunit 50438 "PS_CargarUnificacionPlanning"
{
    trigger OnRun()
    var
        JobPlanningLine: Record "Job Planning Line";
        PS_JobPlanningUnified: Record "PS_JobPlanningUnified";
        ConfirmLoad: Boolean;
        TotalLoaded: Integer;
    begin
        ConfirmLoad := Confirm('¿Está seguro de que desea cargar la planificación unificada?');
        if not ConfirmLoad then
            exit;

        // Limpiar tabla unificada
        PS_JobPlanningUnified.DeleteAll();

        TotalLoaded := 0;
        if JobPlanningLine.FindSet() then
            repeat
                // Cargar cada línea de planificación en la tabla unificada
                PS_JobPlanningUnified.Init();
                PS_JobPlanningUnified."PS_LineNo." := JobPlanningLine."Line No.";
                PS_JobPlanningUnified."PS_JobNo." := JobPlanningLine."Job No.";
                PS_JobPlanningUnified."PS_PlanningDate" := JobPlanningLine."Planning Date";
                PS_JobPlanningUnified."PS_DocumentNo." := JobPlanningLine."Document No.";
                PS_JobPlanningUnified.PS_Type := JobPlanningLine.Type;
                PS_JobPlanningUnified."PS_No." := JobPlanningLine."No.";
                PS_JobPlanningUnified.PS_Description := JobPlanningLine.Description;
                PS_JobPlanningUnified.PS_Quantity := JobPlanningLine.Quantity;
                PS_JobPlanningUnified."PS_DirectUnitCost(LCY)" := JobPlanningLine."Direct Unit Cost (LCY)";
                PS_JobPlanningUnified."PS_UnitCost(LCY)" := JobPlanningLine."Unit Cost (LCY)";
                PS_JobPlanningUnified."PS_TotalCost(LCY)" := JobPlanningLine."Total Cost (LCY)";
                PS_JobPlanningUnified."PS_UnitPrice(LCY)" := JobPlanningLine."Unit Price (LCY)";
                PS_JobPlanningUnified."PS_TotalPrice(LCY)" := JobPlanningLine."Total Price (LCY)";
                PS_JobPlanningUnified.Insert();
                TotalLoaded += 1;
            until JobPlanningLine.Next() = 0;

        Message('Carga completada. Se han cargado %1 líneas en la planificación unificada.', TotalLoaded);
    end;
}
