codeunit 50419 "PS_MonthlyClosingHelper"
{
    procedure CerrarProyectosMes(var Local_PS_MonthClosing: Record "PS_MonthClosing")
    var
        OrigenRec: Record "Job Planning Line";
        ExpOrigenRec: Record "ARBVRNJobUnitPlanning";
        DestTable: Record "PS_JobPlanningUnified";
        PS_MonthClosing: Record PS_MonthClosing;
        ConfirmClosure: Boolean;
        TotalCost: Decimal;
        TotalPrice: Decimal;
        Helper: Codeunit "PS_PonerRealenPlanificado";

        PS_Job: Record Job;
        LocalMonth: Integer;
        LocalYear: Integer;
        LocalMonthText: Text;
        LocalYearText: Text;
        Probabilidad: Integer;
        Factor: Decimal;
        EntryNo: Integer;
    begin
        if Local_PS_MonthClosing.FINDSET then begin
            if Local_PS_MonthClosing.COUNT > 1 then
                ConfirmClosure := CONFIRM('¿Está seguro de que desea cerrar ' + FORMAT(Local_PS_MonthClosing.COUNT) + ' Proyectos/Mes ?')
            else
                ConfirmClosure := CONFIRM('¿Está seguro de que desea cerrar el proyecto ' + Local_PS_MonthClosing.PS_JobNo + ' Mes ' + Local_PS_MonthClosing.PS_Month + '?');

            if not ConfirmClosure then
                exit;

            repeat
                if Local_PS_MonthClosing.PS_Status = Local_PS_MonthClosing.PS_Status::Close then begin
                    MESSAGE('Ha seleccionado Proyectos/Mes cerrados. Se cancela la operación.');
                    exit;
                end;

                TotalCost := 0;
                TotalPrice := 0;
                evaluate(LocalMonth, Local_PS_MonthClosing.PS_Month);
                evaluate(LocalYear, Local_PS_MonthClosing.PS_Year);

                Helper.PonerRealenPlanificado(Local_PS_MonthClosing.PS_JobNo, LocalMonth, LocalYear);

                // 🧹 Borrar registros anteriores de la tabla unificada
                DestTable.Reset();
                DestTable.SetRange(PS_JobNo, Local_PS_MonthClosing.PS_JobNo);
                DestTable.SetRange(PS_ClosingMonthCode, Local_PS_MonthClosing.PS_ClosingMonthCode);
                if DestTable.FindSet() then
                    repeat
                        DestTable.Delete();
                    until DestTable.Next() = 0;

                // 🔁 Planificación normal (PlanningLine)
                OrigenRec.SetRange("Job No.", Local_PS_MonthClosing.PS_JobNo);
                if OrigenRec.FindSet() then begin
                    repeat
                        DestTable.Init();
                        DestTable.PS_JobNo := OrigenRec."Job No.";
                        DestTable.PS_JobTaskNo := OrigenRec."Job Task No.";
                        DestTable.PS_LineNo := OrigenRec."Line No.";
                        DestTable.PS_PlanningDate := OrigenRec."Planning Date";
                        DestTable.PS_DocumentNo := OrigenRec."Document No.";
                        DestTable.PS_Type := OrigenRec.Type;
                        DestTable.PS_No := OrigenRec."No.";
                        DestTable.PS_Description := OrigenRec.Description;
                        DestTable.PS_Quantity := OrigenRec.Quantity;
                        DestTable."PS_DirectUnitCost(LCY)" := OrigenRec."Direct Unit Cost (LCY)";
                        DestTable."PS_UnitCost(LCY)" := OrigenRec."Unit Cost (LCY)";
                        DestTable."PS_TotalCost(LCY)" := OrigenRec."Total Cost (LCY)";
                        DestTable."PS_UnitPrice(LCY)" := OrigenRec."Unit Price (LCY)";
                        DestTable."PS_TotalPrice(LCY)" := OrigenRec."Total Price (LCY)";
                        DestTable.PS_ResourceGroupNo := OrigenRec."Resource Group No.";
                        DestTable.PS_UnitofMeasureCode := OrigenRec."Unit of Measure Code";
                        DestTable.PS_LastDateModified := OrigenRec."Last Date Modified";
                        DestTable.PS_UserID := OrigenRec."User ID";
                        DestTable.PS_WorkTypeCode := OrigenRec."Work Type Code";
                        DestTable.PS_DocumentDate := OrigenRec."Document Date";
                        DestTable.PS_LineType := OrigenRec."Line Type";
                        DestTable.PS_CurrencyCode := OrigenRec."Currency Code";
                        DestTable.PS_CurrencyDate := OrigenRec."Currency Date";
                        DestTable.PS_Status := OrigenRec.Status;
                        DestTable.PS_ClosingMonthCode := Local_PS_MonthClosing.PS_ClosingMonthCode;
                        DestTable.PS_PlanningType := DestTable.PS_PlanningType::PlanningLine;

                        if PS_Job.Get(OrigenRec."Job No.") then
                            Probabilidad := PS_Job."PS_% Probability"
                        else
                            Probabilidad := 0;

                        DestTable."PS_% Probability" := Probabilidad;

                        case Probabilidad of
                            0:
                                Factor := 1.0;
                            1:
                                Factor := 0.10;
                            2:
                                Factor := 0.30;
                            3:
                                Factor := 0.50;
                            4:
                                Factor := 0.70;
                            5:
                                Factor := 0.90;
                            else
                                Factor := 1.0;
                        end;

                        DestTable."PS_ProbabilizedPrice(LCY)" := Round(DestTable."PS_TotalPrice(LCY)" * Factor, 0.01);
                        DestTable."PS_ProbabilizedCost(LCY)" := Round(DestTable."PS_TotalCost(LCY)" * Factor, 0.01);
                        TotalPrice := TotalPrice + DestTable."PS_ProbabilizedPrice(LCY)";
                        TotalCost := TotalCost + DestTable."PS_ProbabilizedCost(LCY)";
                        DestTable.Insert();
                    until OrigenRec.Next() = 0;
                end;

                // 🔁 Planificación de unidades (UnitPlanning)
                EntryNo := 100000;
                ExpOrigenRec.SetRange("ARBVRNJobNo", Local_PS_MonthClosing.PS_JobNo);
                if ExpOrigenRec.FindSet() then begin
                    repeat
                        DestTable.Init();
                        DestTable.PS_JobNo := ExpOrigenRec.ARBVRNJobNo;
                        DestTable.PS_JobTaskNo := '';
                        DestTable.PS_LineNo := EntryNo;
                        EntryNo += 1;
                        DestTable.PS_PlanningDate := ExpOrigenRec.ARBVRNPlanningDate;
                        DestTable."PS_TotalPrice(LCY)" := ExpOrigenRec.ARBVRNCertificationAmountLCY;
                        DestTable.PS_Description := ExpOrigenRec.ARBVRNDescriptionExtend;
                        DestTable.PS_ClosingMonthCode := Local_PS_MonthClosing.PS_ClosingMonthCode;
                        DestTable.PS_PlanningType := DestTable.PS_PlanningType::UnitPlanning;
                        DestTable.PS_LineType := DestTable.PS_LineType::Billable;
                        DestTable.PS_Type := DestTable.PS_Type::"G/L Account";
                        DestTable.PS_No := '70500000';
                        DestTable.PS_Quantity := 1;

                        if PS_Job.Get(ExpOrigenRec.ARBVRNJobNo) then
                            Probabilidad := PS_Job."PS_% Probability"
                        else
                            Probabilidad := 0;

                        DestTable."PS_% Probability" := Probabilidad;

                        case Probabilidad of
                            0:
                                Factor := 1.0;
                            1:
                                Factor := 0.10;
                            2:
                                Factor := 0.30;
                            3:
                                Factor := 0.50;
                            4:
                                Factor := 0.70;
                            5:
                                Factor := 0.90;
                            else
                                Factor := 1.0;
                        end;

                        DestTable."PS_ProbabilizedPrice(LCY)" := Round(ExpOrigenRec.ARBVRNCertificationAmount * Factor, 0.01);
                        DestTable."PS_ProbabilizedCost(LCY)" := Round(ExpOrigenRec.ARBVRNProductionAmount * Factor, 0.01);
                        TotalPrice := TotalPrice + DestTable."PS_ProbabilizedPrice(LCY)";
                        TotalCost := TotalCost + DestTable."PS_ProbabilizedCost(LCY)";
                        DestTable.Insert();
                    until ExpOrigenRec.Next() = 0;
                end;

                if PS_MonthClosing.Get(Local_PS_MonthClosing.PS_JobNo, Local_PS_MonthClosing.PS_ClosingMonthCode) then begin
                    PS_MonthClosing.PS_Status := Local_PS_MonthClosing.PS_Status::Close;
                    PS_MonthClosing.PS_CostTotal := TotalCost;
                    PS_MonthClosing.PS_BillablePriceTotal := TotalPrice;
                    PS_MonthClosing.Modify();
                end else
                    Error('Error no existe MonthClosing');

                UpdateNextOpenMonth(Local_PS_MonthClosing.PS_JobNo);
            until Local_PS_MonthClosing.Next() = 0;
        end;
    end;

    procedure UpdateNextOpenMonth(JobNo: Code[20])
    var
        PSProjectResourceHoursRec: Record "PSProjectResourceHours";
        NextOpenMonthRec: Record "PS_MonthClosing";
    begin
        NextOpenMonthRec.SetRange(PS_JobNo, JobNo);
        NextOpenMonthRec.SetRange(PS_Status, NextOpenMonthRec.PS_Status::Open);

        if NextOpenMonthRec.FindFirst then begin
            PSProjectResourceHoursRec.SetRange("PS_Job No.", JobNo);
            if PSProjectResourceHoursRec.FindSet then
                repeat
                    PSProjectResourceHoursRec.PS_Month := NextOpenMonthRec.PS_Month;
                    PSProjectResourceHoursRec.PS_Year := NextOpenMonthRec.PS_Year;
                    PSProjectResourceHoursRec.Modify();
                until PSProjectResourceHoursRec.Next() = 0;
        end else begin
            NextOpenMonthRec.SetRange(PS_JobNo, JobNo);
            NextOpenMonthRec.SetRange(PS_Status, NextOpenMonthRec.PS_Status::Close);
            if NextOpenMonthRec.FindLast then begin
                PSProjectResourceHoursRec.SetRange("PS_Job No.", JobNo);
                if PSProjectResourceHoursRec.FindSet then
                    repeat
                        PSProjectResourceHoursRec.PS_Month := NextOpenMonthRec.PS_Month;
                        PSProjectResourceHoursRec.PS_Year := NextOpenMonthRec.PS_Year;
                        PSProjectResourceHoursRec.Modify();
                    until PSProjectResourceHoursRec.Next() = 0;
            end else
                Error('No hay un próximo mes disponible para el proyecto %1.', JobNo);
        end;
    end;
}
