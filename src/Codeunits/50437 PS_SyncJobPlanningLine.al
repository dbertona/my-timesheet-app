codeunit 50437 "PS_SyncJobPlanningLine"
{
    trigger OnRun()
    var
        JobPlanningLine: Record "Job Planning Line";
        PS_JobPlanningLine: Record "PS_JobPlanningLine";
        ConfirmSync: Boolean;
        TotalSynced: Integer;
    begin
        ConfirmSync := Confirm('¿Está seguro de que desea sincronizar las líneas de planificación con el histórico?');
        if not ConfirmSync then
            exit;

        TotalSynced := 0;
        if JobPlanningLine.FindSet() then
            repeat
                // Sincronizar cada línea de planificación con el histórico
                if not PS_JobPlanningLine.Get(JobPlanningLine."Line No.") then begin
                    PS_JobPlanningLine.Init();
                    PS_JobPlanningLine."PS_LineNo." := JobPlanningLine."Line No.";
                    PS_JobPlanningLine."PS_JobNo." := JobPlanningLine."Job No.";
                    PS_JobPlanningLine."PS_PlanningDate" := JobPlanningLine."Planning Date";
                    PS_JobPlanningLine."PS_DocumentNo." := JobPlanningLine."Document No.";
                    PS_JobPlanningLine.PS_Type := JobPlanningLine.Type;
                    PS_JobPlanningLine."PS_No." := JobPlanningLine."No.";
                    PS_JobPlanningLine.PS_Description := JobPlanningLine.Description;
                    PS_JobPlanningLine.PS_Quantity := JobPlanningLine.Quantity;
                    PS_JobPlanningLine."PS_DirectUnitCost(LCY)" := JobPlanningLine."Direct Unit Cost (LCY)";
                    PS_JobPlanningLine."PS_UnitCost(LCY)" := JobPlanningLine."Unit Cost (LCY)";
                    PS_JobPlanningLine."PS_TotalCost(LCY)" := JobPlanningLine."Total Cost (LCY)";
                    PS_JobPlanningLine."PS_UnitPrice(LCY)" := JobPlanningLine."Unit Price (LCY)";
                    PS_JobPlanningLine."PS_TotalPrice(LCY)" := JobPlanningLine."Total Price (LCY)";
                    PS_JobPlanningLine.Insert();
                    TotalSynced += 1;
                end;
            until JobPlanningLine.Next() = 0;

        Message('Sincronización completada. Se han sincronizado %1 líneas de planificación.', TotalSynced);
    end;
}
