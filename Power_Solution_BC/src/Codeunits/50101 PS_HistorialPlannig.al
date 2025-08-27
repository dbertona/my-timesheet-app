codeunit 50101 "PS_HistorialPlannig"
{
    procedure RenumberLineNo()
    var
        JobPlanningLine: Record "Job Planning Line";
        TempJobPlanningLine: Record "Job Planning Line" temporary;
        NewLineNo: Integer;
    begin
        NewLineNo := 10000; // Valor inicial para el primer número de línea

        // Ordena los registros por SystemCreatedAt y los copia en una tabla temporal
        JobPlanningLine.SETCURRENTKEY(SystemCreatedAt);
        if JobPlanningLine.FINDSET then begin
            repeat
                // Copiar el registro a la tabla temporal
                TempJobPlanningLine := JobPlanningLine;
                TempJobPlanningLine."Line No." := NewLineNo; // Asigna el nuevo número de línea
                TempJobPlanningLine.INSERT; // Inserta en la tabla temporal
                NewLineNo += 10000; // Incrementa el número de línea para el siguiente registro
            until JobPlanningLine.NEXT = 0;
        end;

        // Elimina los registros originales
        JobPlanningLine.DELETEALL;

        // Inserta los registros renumerados de la tabla temporal
        if TempJobPlanningLine.FINDSET then begin
            repeat
                JobPlanningLine := TempJobPlanningLine;
                JobPlanningLine.INSERT; // Inserta en la tabla original
            until TempJobPlanningLine.NEXT = 0;
        end;
    end;

    procedure HistoricoPlanificacion()
    var
        MesesCerrados: Record "PS_MonthClosing";
        JobPlanningLine: Record "Job Planning Line";
        OrigenRec: Record "Job Planning Line";
        DestTable: Record "PS_JobPlanningLine";
        ExpOrigenRec: Record "ARBVRNJobUnitPlanning";
        ExpDestTable: Record "PS_JobUnitPlanning";
        ConfirmClosure: Boolean;
        TotalCost: Decimal;
        TotalPrice: Decimal;
    begin
        // Recorre todos los registros en "PS_MonthClosing"
        MesesCerrados.SETRANGE(PS_Status, MesesCerrados.PS_Status::Close);
        if MesesCerrados.FINDSET then begin
            ConfirmClosure := CONFIRM('¿Está seguro de que desea cerrar todos los Proyectos/Mes?');
            if not ConfirmClosure then
                exit;
            DestTable.DeleteAll();
            REPEAT

                TotalCost := 0;
                TotalPrice := 0;
                OrigenRec.SETRANGE("Job No.", MesesCerrados.PS_JobNo);
                if OrigenRec.FINDSET then begin
                    REPEAT
                        DestTable."PS_LineNo." := OrigenRec."Line No.";
                        DestTable."PS_JobNo." := OrigenRec."Job No.";
                        DestTable."PS_PlanningDate" := OrigenRec."Planning Date";
                        DestTable."PS_DocumentNo." := OrigenRec."Document No.";
                        DestTable.PS_Type := OrigenRec.Type;
                        DestTable."PS_No." := OrigenRec."No.";
                        DestTable.PS_Description := OrigenRec.Description;
                        DestTable.PS_Quantity := OrigenRec.Quantity;
                        DestTable."PS_DirectUnitCost(LCY)" := OrigenRec."Direct Unit Cost (LCY)";
                        DestTable."PS_UnitCost(LCY)" := OrigenRec."Unit Cost (LCY)";
                        DestTable."PS_TotalCost(LCY)" := OrigenRec."Total Cost (LCY)";
                        DestTable."PS_UnitPrice(LCY)" := OrigenRec."Unit Price (LCY)";
                        DestTable."PS_TotalPrice(LCY)" := OrigenRec."Total Price (LCY)";
                        DestTable."PS_ResourceGroupNo." := OrigenRec."Resource Group No.";
                        DestTable."PS_UnitofMeasureCode" := OrigenRec."Unit of Measure Code";
                        DestTable."PS_LastDateModified" := OrigenRec."Last Date Modified";
                        DestTable."PS_UserID" := OrigenRec."User ID";
                        DestTable."PS_WorkTypeCode" := OrigenRec."Work Type Code";
                        DestTable."PS_DocumentDate" := OrigenRec."Document Date";
                        DestTable."PS_JobTaskNo." := OrigenRec."Job Task No.";
                        DestTable."PS_LineType" := OrigenRec."Line Type";
                        DestTable."PS_CurrencyCode" := OrigenRec."Currency Code";
                        DestTable."PS_CurrencyDate" := OrigenRec."Currency Date";
                        DestTable.PS_Status := OrigenRec.Status;
                        DestTable."PS_ClosingMonthCode" := MesesCerrados.PS_ClosingMonthCode;
                        TotalCost := TotalCost + DestTable."PS_TotalCost(LCY)";
                        TotalPrice := TotalPrice + DestTable."PS_TotalPrice(LCY)";
                        DestTable.INSERT;
                    UNTIL OrigenRec.NEXT = 0;
                end;

                ExpOrigenRec.SETRANGE("ARBVRNJobNo", MesesCerrados.PS_JobNo);
                if ExpOrigenRec.FINDSET then begin
                    REPEAT
                        ExpDestTable.PS_EntryNo := ExpOrigenRec.ARBVRNEntryNo;
                        ExpDestTable.PS_JobNo := ExpOrigenRec.ARBVRNJobNo;
                        ExpDestTable.PS_JobUnitNo := ExpOrigenRec.ARBVRNJobUnitNo;
                        ExpDestTable.PS_PlanningDate := ExpOrigenRec.ARBVRNPlanningDate;
                        ExpDestTable.PS_CertificationQuantity := ExpOrigenRec.ARBVRNCertificationQuantity;
                        ExpDestTable.PS_ProductionQuantity := ExpOrigenRec.ARBVRNProductionQuantity;
                        ExpDestTable.PS_CertificationAmount := ExpOrigenRec.ARBVRNCertificationAmount;
                        ExpDestTable.PS_CertificationAmountLCY := ExpOrigenRec.ARBVRNCertificationAmountLCY;
                        ExpDestTable.PS_ProductionAmount := ExpOrigenRec.ARBVRNProductionAmount;
                        ExpDestTable.PS_ProductionAmountLCY := ExpOrigenRec.ARBVRNProductionAmountLCY;
                        ExpDestTable.PS_UniqueKey := ExpOrigenRec.ARBVRNUniqueKey;
                        ExpDestTable.PS_CertificationPorc := ExpOrigenRec.ARBVRNCertificationPorc;
                        ExpDestTable.PS_ProductionPorc := ExpOrigenRec.ARBVRNProductionPorc;
                        ExpDestTable.PS_PlanningType := ExpOrigenRec.ARBVRNPlanningType;
                        ExpDestTable.PS_Real := ExpOrigenRec.ARBVRNReal;
                        ExpDestTable.PS_JobPlanningVersionCode := ExpOrigenRec.ARBVRNJobPlanningVersionCode;
                        ExpDestTable.PS_VersionName := ExpOrigenRec.ARBVRNVersionName;
                        ExpDestTable.PS_ActivePlanningVersion := ExpOrigenRec.ARBVRNActivePlanningVersion;
                        ExpDestTable.PS_DescriptionExtend := ExpOrigenRec.ARBVRNDescriptionExtend;
                        ExpDestTable.PS_ClosingMonthCode := MesesCerrados.PS_ClosingMonthCode;
                        TotalPrice := TotalPrice + ExpDestTable.PS_CertificationAmount;
                        ExpDestTable.INSERT;

                    UNTIL ExpOrigenRec.NEXT = 0;
                end;
            UNTIL MesesCerrados.NEXT = 0;
        end;
    end;

    procedure RenumerarLineasPlanificacion()
    begin

    end;
}
