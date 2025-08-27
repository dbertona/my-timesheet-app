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
codeunit 50102 "PopulateProjectResourceHours"
{
    Subtype = Normal;

    trigger OnRun()
    var
        JobLedgerEntry: Record "Job Ledger Entry";
        ProjectResourceHours: Record "PSProjectResourceHours";
        PSProjectTaskResourceHours: Record "PS_ProjectTaskResourceHours";
        MonthClosing: Record "PS_MonthClosing";
        OpenMonth: Code[2];
        OpenYear: Code[4];
    begin
        // Elimina todos los registros existentes en Project Resource Hours
        ProjectResourceHours.DeleteAll();

        // Filtrar para obtener solo registros de tipo recurso que serán utilizados en Project Resource Hours
        JobLedgerEntry.SetRange("Entry Type", JobLedgerEntry."Type"::Resource);
        JobLedgerEntry.SetRange("Entry Type", JobLedgerEntry."Entry Type"::Usage);
        JobLedgerEntry.SetRange("ARBVRNComputedForHours", true);

        // Recorre los registros de Job Ledger Entry
        if JobLedgerEntry.FindSet() then
            repeat
                // Buscar el primer mes abierto para el proyecto actual
                MonthClosing.SetRange(PS_JobNo, JobLedgerEntry."Job No.");
                MonthClosing.SetRange(PS_Status, MonthClosing.PS_Status::Open);

                if MonthClosing.FindSet() then begin
                    // Configurar el rango para ver si el proyecto y recurso ya existen en Project Resource Hours
                    ProjectResourceHours.SetRange("PS_Job No.", JobLedgerEntry."Job No.");
                    ProjectResourceHours.SetRange("PS_Resource No.", JobLedgerEntry."No.");

                    if not ProjectResourceHours.FindFirst() then begin
                        // Si no existe, crear un nuevo registro
                        ProjectResourceHours.Init();
                        ProjectResourceHours."PS_Job No." := JobLedgerEntry."Job No.";
                        ProjectResourceHours."PS_Resource No." := JobLedgerEntry."No.";
                        ProjectResourceHours."PS_Month" := MonthClosing.PS_Month;
                        ProjectResourceHours."PS_Year" := MonthClosing.PS_Year;
                        ProjectResourceHours.Insert();
                    end;
                end
                else
                    MonthClosing.SetRange(PS_JobNo, JobLedgerEntry."Job No.");
                MonthClosing.SetRange(PS_Status, MonthClosing.PS_Status::Close);

                if MonthClosing.FindLast() then begin
                    // Configurar el rango para ver si el proyecto y recurso ya existen en Project Resource Hours
                    ProjectResourceHours.SetRange("PS_Job No.", JobLedgerEntry."Job No.");
                    ProjectResourceHours.SetRange("PS_Resource No.", JobLedgerEntry."No.");

                    if not ProjectResourceHours.FindFirst() then begin
                        // Si no existe, crear un nuevo registro
                        ProjectResourceHours.Init();
                        ProjectResourceHours."PS_Job No." := JobLedgerEntry."Job No.";
                        ProjectResourceHours."PS_Resource No." := JobLedgerEntry."No.";
                        ProjectResourceHours."PS_Month" := MonthClosing.PS_Month;
                        ProjectResourceHours."PS_Year" := MonthClosing.PS_Year;
                        ProjectResourceHours.Insert();
                    end;
                end;
                ProjectResourceHours.Reset(); // Restablecer el rango para el siguiente registro
            until JobLedgerEntry.Next() = 0;
        PSProjectTaskResourceHours.DeleteAll();

        // Filtrar para obtener solo registros de tipo recurso que serán utilizados en Project Resource Hours
        JobLedgerEntry.SetRange("Entry Type", JobLedgerEntry."Type"::Resource);
        JobLedgerEntry.SetRange("Entry Type", JobLedgerEntry."Entry Type"::Usage);
        JobLedgerEntry.SetRange("ARBVRNComputedForHours", true);

        // Recorre los registros de Job Ledger Entry
        if JobLedgerEntry.FindSet() then
            repeat
                // Buscar el primer mes abierto para el proyecto actual
                MonthClosing.SetRange(PS_JobNo, JobLedgerEntry."Job No.");
                MonthClosing.SetRange(PS_Status, MonthClosing.PS_Status::Open);

                if MonthClosing.FindSet() then begin
                    // Configurar el rango para ver si el proyecto y recurso ya existen en Project Resource Hours
                    PSProjectTaskResourceHours.SetRange("PS_JobNo.", JobLedgerEntry."Job No.");
                    PSProjectTaskResourceHours.SetRange("PS_ResourceNo.", JobLedgerEntry."No.");
                    PSProjectTaskResourceHours.SetRange("PS_JobTaskNo.", JobLedgerEntry."Job Task No.");
                    if not PSProjectTaskResourceHours.FindFirst() then begin
                        // Si no existe, crear un nuevo registro
                        PSProjectTaskResourceHours.Init();
                        PSProjectTaskResourceHours."PS_JobNo." := JobLedgerEntry."Job No.";
                        PSProjectTaskResourceHours."PS_ResourceNo." := JobLedgerEntry."No.";
                        PSProjectTaskResourceHours."PS_Month" := MonthClosing.PS_Month;
                        PSProjectTaskResourceHours."PS_Year" := MonthClosing.PS_Year;
                        PSProjectTaskResourceHours."PS_JobTaskNo." := JobLedgerEntry."Job Task No.";
                        PSProjectTaskResourceHours.Insert();
                    end;

                    PSProjectTaskResourceHours.Reset(); // Restablecer el rango para el siguiente registro
                end;
            until JobLedgerEntry.Next() = 0;


        // Mensaje de confirmación
        Message('La tabla Project Resource Hours se ha poblado con los registros de Job Ledger Entry y sus respectivos meses abiertos.');
    end;
}
codeunit 50103 "MigrateMonthandYear"
{
    trigger OnRun()
    var
        JobLedgerRec: Record "PS_JobLedgerEntryMonthYear";
    begin
        if JobLedgerRec.FindSet() then begin
            repeat
                // Mover PS_Month a PS_Month2
                if JobLedgerRec."PS_Month" <> '' then
                    JobLedgerRec."PS_Month" := FORMAT(JobLedgerRec."PS_Month");

                // Mover PS_Year a PS_Year2
                if JobLedgerRec."PS_Year" <> '' then
                    JobLedgerRec."PS_Year" := FORMAT(JobLedgerRec."PS_Year");

                JobLedgerRec.Modify();
            until JobLedgerRec.Next() = 0;

            Message('Migración completada. Los datos han sido transferidos de PS_Month/PS_Year a PS_Month2/PS_Year2.');
        end else
            Message('No se encontraron registros para migrar.');
    end;
}

codeunit 50104 "ProceJobLedgerEntryMonthYear"
{

    var
        JobLedgerEntry: Record "Job Ledger Entry";
        JobLedgerEntryYearMonth: Record "PS_JobLedgerEntryMonthYear";
        PurchInvHeader: Record "Purch. Inv. Header";
        PostingDateYear: code[4];
        PostingDateMonth: code[2];
        PurcCRHeader: Record "Purch. Cr. Memo Hdr.";

    trigger OnRun()
    var
        Dialog: Dialog;
        Total, Procesados : Integer;
    begin
        // Recorremos todos los registros de Job Ledger Entry
        JobLedgerEntryYearMonth.DeleteAll();
        Total := JobLedgerEntry.Count();
        Procesados := 0;
        Dialog.Open('Procesando líneas del diario de proyectos @1/@2', Procesados, Total);
        if JobLedgerEntry.FindSet() then
            repeat
                // Determinamos el año y el mes según la fecha disponible
                PurchInvHeader."No." := JobLedgerEntry."Document No.";
                if PurchInvHeader.GET(PurchInvHeader."No.") then begin
                    if JobLedgerEntry."ARBVRNTimesheetdate" = 0D then begin
                        PostingDateYear := format(Date2DMY(PurchInvHeader."VAT Reporting Date", 3)); // Año
                        PostingDateMonth := format(Date2DMY(PurchInvHeader."VAT Reporting Date", 2)); // Mes
                    end else begin
                        PostingDateYear := format(Date2DMY(JobLedgerEntry."ARBVRNTimesheetdate", 3)); // Año
                        PostingDateMonth := format(Date2DMY(JobLedgerEntry."ARBVRNTimesheetdate", 2)); // Mes
                    end;

                end
                else if PurcCRHeader.GET(PurcCRHeader."No.") then begin
                    if JobLedgerEntry."ARBVRNTimesheetdate" = 0D then begin
                        PostingDateYear := format(Date2DMY(PurcCRHeader."VAT Reporting Date", 3)); // Año
                        PostingDateMonth := format(Date2DMY(PurcCRHeader."VAT Reporting Date", 2)); // Mes
                    end else begin
                        PostingDateYear := format(Date2DMY(JobLedgerEntry."ARBVRNTimesheetdate", 3)); // Año
                        PostingDateMonth := format(Date2DMY(JobLedgerEntry."ARBVRNTimesheetdate", 2)); // Mes
                    end;

                end
                else begin
                    if JobLedgerEntry."ARBVRNTimesheetdate" = 0D then begin
                        PostingDateYear := format(Date2DMY(JobLedgerEntry."Posting Date", 3)); // Año
                        PostingDateMonth := format(Date2DMY(JobLedgerEntry."Posting Date", 2)); // Mes
                    end else begin
                        PostingDateYear := format(Date2DMY(JobLedgerEntry."ARBVRNTimesheetdate", 3)); // Año
                        PostingDateMonth := format(Date2DMY(JobLedgerEntry."ARBVRNTimesheetdate", 2)); // Mes
                    end;
                end;
                // Buscamos el registro en JobLedgerEntryYearMonth
                if JobLedgerEntryYearMonth.Get(JobLedgerEntry."Entry No.") then begin
                    // Actualizamos el registro existente
                    JobLedgerEntryYearMonth."PS_Year" := PostingDateYear;
                    JobLedgerEntryYearMonth."PS_Month" := PostingDateMonth;
                    JobLedgerEntryYearMonth.Modify();
                end else begin
                    // Creamos un nuevo registro si no existe
                    JobLedgerEntryYearMonth.Init();
                    JobLedgerEntryYearMonth."PS_EntryNo." := JobLedgerEntry."Entry No.";
                    JobLedgerEntryYearMonth."PS_JobNo." := JobLedgerEntry."Job No.";
                    JobLedgerEntryYearMonth."PS_Year" := PostingDateYear;
                    JobLedgerEntryYearMonth."PS_Month" := PostingDateMonth;
                    JobLedgerEntryYearMonth.Insert();
                end;
                Procesados += 1;
                Dialog.Update(1, Procesados);
            until JobLedgerEntry.Next() = 0;
        Dialog.Close();
    end;
}

codeunit 50105 "PS_FillMonthClosing"
{

    var
        PS_MonthClosing: Record "PS_MonthClosing";
        JobRec: Record "Job";
        SelectedYear: Code[4];
        MonthNames: array[12] of Text[10];
        YearAsInteger: Integer;
        i: Integer;
        ClosingDate: Date;

    trigger OnRun()
    begin
        MonthNames[1] := 'January';
        MonthNames[2] := 'February';
        MonthNames[3] := 'March';
        MonthNames[4] := 'April';
        MonthNames[5] := 'May';
        MonthNames[6] := 'June';
        MonthNames[7] := 'July';
        MonthNames[8] := 'August';
        MonthNames[9] := 'September';
        MonthNames[10] := 'October';
        MonthNames[11] := 'November';
        MonthNames[12] := 'December';

        // Request the year
        if not ConfirmYearInput(SelectedYear) then
            exit;

        // Convert the year to an integer
        if not Evaluate(YearAsInteger, SelectedYear) then
            Error('The specified year is not valid: %1.', SelectedYear);

        // Loop through the Job table and filter non-completed projects
        JobRec.SetFilter(Status, '<>%1&<>%2', JobRec.Status::Lost, JobRec.Status::Planning);
        JobRec.SetFilter("No.", '<>%1&<>%2', 'PP*', 'PY*');
        JobRec.SetFilter("No.", '<>%1&<>%2', 'PP*', 'PY*');

        if JobRec.FindSet() then begin
            repeat
                for i := 1 to 12 do begin
                    // Generate the closing date

                    if JOBREC."Starting Date" = 0D then
                        error('La fecha de inicio esta en blanco para el proyecto %1', JobRec."No.");

                    // Initialize and populate the data in the table
                    PS_MonthClosing.Init();
                    PS_MonthClosing."PS_JobNo" := JobRec."No."; // Assign the Job No. from the project
                    PS_MonthClosing."PS_Description" := JobRec.Description;
                    IF Date2DMY(JOBREC."Starting Date", 3) <= YearAsInteger THEN begin
                        IF i > 9 THEN begin
                            PS_MonthClosing.PS_ClosingMonthCode := Format(YearAsInteger) + '.' + Format(i);
                            PS_MonthClosing.SetRange(PS_MonthClosing."PS_ClosingMonthCode", Format(YearAsInteger) + '.' + Format(i));
                        end
                        ELSE begin
                            PS_MonthClosing.SetRange(PS_MonthClosing."PS_ClosingMonthCode", Format(YearAsInteger) + '.0' + Format(i));
                            PS_MonthClosing.PS_ClosingMonthCode := Format(YearAsInteger) + '.0' + Format(i);
                        end;

                        PS_MonthClosing.PS_GlobalDimension1Code := JobRec."Global Dimension 1 Code";
                        PS_MonthClosing."PS_ClosingMonthName" := MonthNames[i];
                        PS_MonthClosing."PS_Status" := PS_MonthClosing."PS_Status"::Close;
                        PS_MonthClosing.PS_Month := Format(i);
                        PS_MonthClosing."PS_Year" := Format(YearAsInteger); // Convert year to text
                        Evaluate(ClosingDate, '01/' + PS_MonthClosing.PS_Month + '/' + PS_MonthClosing.PS_Year);
                        PS_MonthClosing.PS_ClosingMonthDate := CalcDate('<CM>', ClosingDate);
                        PS_MonthClosing.SetRange(PS_MonthClosing."PS_JobNo", JobRec."No.");

                        if not PS_MonthClosing.FindFirst() then
                            PS_MonthClosing.Insert();
                    end;
                end;
            until JobRec.Next() = 0;
        end;

        Message('Records have been created for all projects in the year %1.', SelectedYear);
    end;

    local procedure ConfirmYearInput(var SelectedYear: Code[4]): Boolean
    var
        SelectedOption: Integer;
        CurrentYear: Integer;
        YearList: Text;
    begin
        CurrentYear := Date2DMY(Today(), 3);
        YearList := Format(CurrentYear - 1);

        SelectedOption := StrMenu(YearList, 1);
        if SelectedOption = 0 then
            exit(false);

        SelectedYear := CopyStr(YearList, (SelectedOption - 1) * 5 + 1, 4);
        exit(true);
    end;
}
codeunit 50106 ProcessClosedMonthClosings
{

    trigger OnRun()
    var
        MonthClosing: Record "PS_MonthClosing";
        LocalMonth: Integer;
        LocalYear: Integer;
        TotalToProcess: Integer;
        PonerRealenPlanificadoCodeunit: Codeunit 50422;
    begin
        MonthClosing.SetRange(PS_Status, MonthClosing.PS_Status::Close);
        //MonthClosing.SetRange(PS_JobNo, 'PSI-ST-25-5000');

        TotalToProcess := MonthClosing.Count();
        if MonthClosing.FindSet() then begin
            repeat
                Evaluate(LocalMonth, MonthClosing.PS_Month);
                Evaluate(LocalYear, MonthClosing.PS_Year);
                PonerRealenPlanificadoCodeunit.PonerRealenPlanificado(
                    MonthClosing.PS_JobNo,
                    LocalMonth,
                    LocalYear
                );
            until MonthClosing.Next() = 0;
            Message('Procesados todos los registros cerrados.');
        end else begin
            Message('No se encontraron registros cerrados.');
        end;
    end;
}

codeunit 50107 "PS_LimpiarPlanificacion"
{
    trigger OnRun()
    var
        JobPlanningLine: Record "PS_JobPlanningLine";
        JobPlanningToDelete: Record "PS_JobPlanningLine";
        ClosingCodes: List of [Text[10]];
        ProjectCodes: List of [Code[20]];
        CodigoMes: Text[7];
        Año, Mes : Integer;
        FechaDesde: Date;
        TotalCodigos, CodigoIndex, Eliminados : Integer;
        JobNo: Code[20];
    begin
        // Obtener todos los códigos de proyecto únicos
        JobPlanningLine.Reset();
        JobPlanningLine.SetCurrentKey("PS_JobNo.");
        if JobPlanningLine.FindSet() then begin
            repeat
                JobNo := JobPlanningLine."PS_JobNo.";
                if (JobNo <> '') and not ProjectCodes.Contains(JobNo) then
                    ProjectCodes.Add(JobNo);
            until JobPlanningLine.Next() = 0;
        end;

        // Recorrer cada proyecto individualmente
        foreach JobNo in ProjectCodes do begin
            Clear(ClosingCodes);
            TotalCodigos := 0;

            JobPlanningLine.Reset();
            JobPlanningLine.SetCurrentKey("PS_ClosingMonthCode");
            JobPlanningLine.SetRange("PS_JobNo.", JobNo);

            if JobPlanningLine.FindSet() then begin
                repeat
                    CodigoMes := JobPlanningLine."PS_ClosingMonthCode";

                    if (CodigoMes <> '') and (StrLen(CodigoMes) = 7) and not ClosingCodes.Contains(CodigoMes) then
                        ClosingCodes.Add(CodigoMes);
                until JobPlanningLine.Next() = 0;

                TotalCodigos := ClosingCodes.Count();

                if TotalCodigos > 1 then begin
                    for CodigoIndex := 2 to TotalCodigos do begin
                        CodigoMes := ClosingCodes.Get(CodigoIndex);

                        Evaluate(Año, COPYSTR(CodigoMes, 1, 4));
                        Evaluate(Mes, COPYSTR(CodigoMes, 6, 2));
                        FechaDesde := DMY2DATE(1, Mes, Año);

                        JobPlanningToDelete.Reset();
                        JobPlanningToDelete.SetRange("PS_JobNo.", JobNo);
                        JobPlanningToDelete.SetRange("PS_ClosingMonthCode", CodigoMes);
                        JobPlanningToDelete.SetFilter("PS_PlanningDate", '<%1', FechaDesde);

                        if JobPlanningToDelete.FindSet() then begin
                            repeat
                                JobPlanningToDelete.Delete();
                                Eliminados += 1;
                            until JobPlanningToDelete.Next() = 0;
                        end;
                    end;
                end;
            end;
        end;

        Message('Proceso completado. Se eliminaron %1 líneas en total.', Eliminados);
    end;
}
codeunit 50108 "PS_RecalcularProbabilidad"
{
    trigger OnRun()
    var
        Job: Record Job;
        JobPlanningLine: Record "PS_JobPlanningLine";
        JobUnitPlanning: Record "PS_JobUnitPlanning";
        Probabilidad: Integer;
        Factor: Decimal;
        Total: Integer;
        Procesados: Integer;
        Dialog: Dialog;
    begin
        // 🔴 Eliminar registros con mes de cierre anterior a 2025.01
        //JobPlanningLine.SetFilter("PS_ClosingMonthCode", '<%1', '2025.01');
        //if JobPlanningLine.FindSet() then
        //    repeat
        //        JobPlanningLine.Delete();
        //    until JobPlanningLine.Next() = 0;

        //JobUnitPlanning.SetFilter("PS_ClosingMonthCode", '<%1', '2025.01');
        //if JobUnitPlanning.FindSet() then
        //    repeat
        //        JobUnitPlanning.Delete();
        //    until JobUnitPlanning.Next() = 0;

        // ✅ Recalcular para PS_JobPlanningLine
        JobPlanningLine.Reset();
        Total := JobPlanningLine.Count();
        Procesados := 0;
        Dialog.Open('Recalculando líneas de planificación @1/@2', Procesados, Total);

        if JobPlanningLine.FindSet() then
            repeat
                if Job.Get(JobPlanningLine."PS_JobNo.") then begin
                    Probabilidad := Job."PS_% Probability";
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
                    JobPlanningLine."PS_% Probability" := Job."PS_% Probability";
                    JobPlanningLine."PS_ProbabilizedPrice(LCY)" := Round(JobPlanningLine."PS_TotalPrice(LCY)" * Factor, 0.01);
                    JobPlanningLine."PS_ProbabilizedCost(LCY)" := Round(JobPlanningLine."PS_TotalCost(LCY)" * Factor, 0.01);
                    JobPlanningLine.Modify();
                end;
                Procesados += 1;
                Dialog.Update(1, Procesados);
            until JobPlanningLine.Next() = 0;
        Dialog.Close();

        // ✅ Recalcular para PS_JobUnitPlanning
        JobUnitPlanning.Reset();
        Total := JobUnitPlanning.Count();
        Procesados := 0;
        Dialog.Open('Recalculando unidades de planificación @1/@2', Procesados, Total);

        if JobUnitPlanning.FindSet() then
            repeat
                if Job.Get(JobUnitPlanning."PS_JobNo") then begin
                    Probabilidad := Job."PS_% Probability";
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

                    JobUnitPlanning."PS_ProbabilizedPrice(LCY)" := Round(JobUnitPlanning."PS_CertificationAmount" * Factor, 0.01);
                    JobUnitPlanning."PS_ProbabilizedCost(LCY)" := Round(JobUnitPlanning."PS_ProductionAmount" * Factor, 0.01);
                    JobUnitPlanning.Modify();
                end;
                Procesados += 1;
                Dialog.Update(1, Procesados);
            until JobUnitPlanning.Next() = 0;
        Dialog.Close();
    end;
}
codeunit 50109 "PS_SyncJobPlanningLine"
{
    Subtype = Normal;

    trigger OnRun()
    begin
        SincronizarJobPlanningLineEnero2025();
    end;

    procedure SincronizarJobPlanningLineEnero2025()
    var
        JobPlanningLine: Record "Job Planning Line";
        DestTable: Record "PS_JobPlanningUnified";
        PlanningStart: Date;
        PlanningEnd: Date;
    begin
        // Establecer el rango de fechas de enero 2025
        PlanningStart := DMY2DATE(1, 1, 2025);
        PlanningEnd := DMY2DATE(31, 1, 2025);

        // 🧹 Borrar registros existentes en la tabla unificada con PS_ClosingMonthCode = '2025.01' y PlanningType = PlanningLine
        DestTable.Reset();
        DestTable.SetRange(PS_ClosingMonthCode, '2025.01');
        DestTable.SetRange(PS_PlanningType, DestTable.PS_PlanningType::PlanningLine);
        DestTable.SetRange(PS_PlanningDate, PlanningStart, PlanningEnd);
        if DestTable.FindSet() then
            repeat
                DestTable.Delete();
            until DestTable.Next() = 0;

        // 📥 Insertar registros desde Job Planning Line con Planning Date en enero 2025
        JobPlanningLine.Reset();
        JobPlanningLine.SetRange("Planning Date", PlanningStart, PlanningEnd);
        if JobPlanningLine.FindSet() then
            repeat
                DestTable.Init();
                DestTable.PS_LineNo := JobPlanningLine."Line No.";
                DestTable.PS_JobNo := JobPlanningLine."Job No.";
                DestTable.PS_PlanningDate := JobPlanningLine."Planning Date";
                DestTable.PS_DocumentNo := JobPlanningLine."Document No.";
                DestTable.PS_Type := JobPlanningLine.Type;
                DestTable.PS_No := JobPlanningLine."No.";
                DestTable.PS_Description := JobPlanningLine.Description;
                DestTable.PS_Quantity := JobPlanningLine.Quantity;
                DestTable."PS_DirectUnitCost(LCY)" := JobPlanningLine."Direct Unit Cost (LCY)";
                DestTable."PS_UnitCost(LCY)" := JobPlanningLine."Unit Cost (LCY)";
                DestTable."PS_TotalCost(LCY)" := JobPlanningLine."Total Cost (LCY)";
                DestTable."PS_UnitPrice(LCY)" := JobPlanningLine."Unit Price (LCY)";
                DestTable."PS_TotalPrice(LCY)" := JobPlanningLine."Total Price (LCY)";
                DestTable.PS_ResourceGroupNo := JobPlanningLine."Resource Group No.";
                DestTable.PS_UnitofMeasureCode := JobPlanningLine."Unit of Measure Code";
                DestTable.PS_LastDateModified := JobPlanningLine."Last Date Modified";
                DestTable.PS_UserID := JobPlanningLine."User ID";
                DestTable.PS_WorkTypeCode := JobPlanningLine."Work Type Code";
                DestTable.PS_DocumentDate := JobPlanningLine."Document Date";
                DestTable.PS_JobTaskNo := JobPlanningLine."Job Task No.";
                DestTable.PS_LineType := JobPlanningLine."Line Type";
                DestTable.PS_CurrencyCode := JobPlanningLine."Currency Code";
                DestTable.PS_CurrencyDate := JobPlanningLine."Currency Date";
                DestTable.PS_Status := JobPlanningLine.Status;
                DestTable.PS_ClosingMonthCode := '2025.01';
                DestTable.PS_PlanningType := DestTable.PS_PlanningType::PlanningLine;

                DestTable.Insert(true); // Insert con overwrite si ya existe
            until JobPlanningLine.Next() = 0;
    end;
}
codeunit 50110 "PS_CargarUnificacionPlanning"
{
    Subtype = Normal;

    trigger OnRun()
    begin
        CargarDatosUnificados();
    end;

    procedure CargarDatosUnificados()
    var
        SourcePlanLine: Record "PS_JobPlanningLine";
        SourceUnitPlan: Record "PS_JobUnitPlanning";
        Unified: Record "PS_JobPlanningUnified";
        LineNoCounter: Integer;
    begin
        // 🧹 Limpiar la tabla unificada antes de cargar
        Unified.DeleteAll();

        // 🔁 Cargar desde PS_JobPlanningLine
        if SourcePlanLine.FindSet() then
            repeat
                Unified.Init();
                Unified.PS_JobNo := SourcePlanLine."PS_JobNo.";
                Unified.PS_JobTaskNo := SourcePlanLine."PS_JobTaskNo.";
                Unified.PS_LineNo := SourcePlanLine."PS_LineNo.";
                Unified.PS_PlanningDate := SourcePlanLine."PS_PlanningDate";
                Unified.PS_DocumentNo := SourcePlanLine."PS_DocumentNo.";
                Unified.PS_Type := SourcePlanLine.PS_Type;
                Unified.PS_No := SourcePlanLine."PS_No.";
                Unified.PS_Description := SourcePlanLine.PS_Description;
                Unified.PS_Quantity := SourcePlanLine.PS_Quantity;
                Unified."PS_DirectUnitCost(LCY)" := SourcePlanLine."PS_DirectUnitCost(LCY)";
                Unified."PS_UnitCost(LCY)" := SourcePlanLine."PS_UnitCost(LCY)";
                Unified."PS_TotalCost(LCY)" := SourcePlanLine."PS_TotalCost(LCY)";
                Unified."PS_UnitPrice(LCY)" := SourcePlanLine."PS_UnitPrice(LCY)";
                Unified."PS_TotalPrice(LCY)" := SourcePlanLine."PS_TotalPrice(LCY)";
                Unified.PS_ResourceGroupNo := SourcePlanLine."PS_ResourceGroupNo.";
                Unified.PS_UnitofMeasureCode := SourcePlanLine."PS_UnitofMeasureCode";
                Unified.PS_LastDateModified := SourcePlanLine."PS_LastDateModified";
                Unified.PS_UserID := SourcePlanLine."PS_UserID";
                Unified.PS_WorkTypeCode := SourcePlanLine."PS_WorkTypeCode";
                Unified.PS_DocumentDate := SourcePlanLine."PS_DocumentDate";
                Unified.PS_LineType := SourcePlanLine."PS_LineType";
                Unified.PS_CurrencyCode := SourcePlanLine."PS_CurrencyCode";
                Unified.PS_CurrencyDate := SourcePlanLine."PS_CurrencyDate";
                Unified.PS_Status := SourcePlanLine."PS_Status";
                Unified.PS_ClosingMonthCode := SourcePlanLine."PS_ClosingMonthCode";
                Unified."PS_% Probability" := SourcePlanLine."PS_% Probability";
                Unified."PS_ProbabilizedPrice(LCY)" := SourcePlanLine."PS_ProbabilizedPrice(LCY)";
                Unified."PS_ProbabilizedCost(LCY)" := SourcePlanLine."PS_ProbabilizedCost(LCY)";
                Unified.PS_PlanningType := Unified.PS_PlanningType::PlanningLine;
                Unified.Insert(true); // Reemplaza si ya existe
            until SourcePlanLine.Next() = 0;

        // 🔁 Cargar desde PS_JobUnitPlanning (solo campos comunes por ahora)
        LineNoCounter := 100000;
        if SourceUnitPlan.FindSet() then
            repeat
                Unified.Init();
                Unified.PS_JobNo := SourceUnitPlan.PS_JobNo;
                Unified.PS_JobTaskNo := '';
                Unified.PS_LineNo := LineNoCounter;
                LineNoCounter += 1;
                Unified.PS_PlanningDate := SourceUnitPlan.PS_PlanningDate;
                Unified."PS_TotalCost(LCY)" := SourceUnitPlan.PS_ProductionAmountLCY;
                Unified."PS_TotalPrice(LCY)" := SourceUnitPlan.PS_CertificationAmountLCY;
                Unified."PS_ProbabilizedCost(LCY)" := SourceUnitPlan."PS_ProbabilizedCost(LCY)";
                Unified."PS_ProbabilizedPrice(LCY)" := SourceUnitPlan."PS_ProbabilizedPrice(LCY)";
                Unified.PS_ClosingMonthCode := SourceUnitPlan.PS_ClosingMonthCode;
                Unified."PS_% Probability" := SourceUnitPlan."PS_% Probability";
                Unified.PS_PlanningType := Unified.PS_PlanningType::UnitPlanning;
                Unified.Insert(true);
            until SourceUnitPlan.Next() = 0;
    end;
}

codeunit 50111 "PS_RenumerarPlanificadas"
{
    Subtype = Normal;

    trigger OnRun()
    var
        JobTask: Record "Job Task";
        ProgressMsg: Label 'Procesando.......#1######################\';
        Progress: Dialog;
        TotalTasks: Integer;
        TaskCounter: Integer;
        PercentText: Integer;
        Planificado: Record "Job Planning Line";
        TempPlanificado: Record "Job Planning Line" temporary;
        CurrentLineNo: Integer;
        SkippedCount: Integer;
    begin
        TaskCounter := 0;
        Progress.OPEN(ProgressMsg, TaskCounter);
        JobTask.reset();
        if JobTask.FindSet() then
            repeat
                Planificado.SetRange("Job No.", JobTask."Job No.");
                Planificado.SetRange("Job Task No.", JobTask."Job Task No.");
                Planificado.SetCurrentKey("Job No.", "Job Task No.", "Line No.");
                if Planificado.FindSet(true) then begin
                    CurrentLineNo := 10000;
                    SkippedCount := 0;
                    repeat
                        if Planificado."Qty. Transferred to Invoice" = 0 then begin
                            TempPlanificado := Planificado;
                            TempPlanificado."Line No." := CurrentLineNo;
                            TaskCounter += 1;
                            Progress.Update(1, TaskCounter);
                            TempPlanificado.Insert();
                            CurrentLineNo += 10000;
                        end else
                            SkippedCount += 1;
                    until Planificado.Next() = 0;

                    Planificado.Reset();
                    Planificado.SetRange("Job No.", JobTask."Job No.");
                    Planificado.SetRange("Job Task No.", JobTask."Job Task No.");
                    Planificado.SetRange("Qty. Transferred to Invoice", 0);
                    Planificado.DeleteAll();

                    if TempPlanificado.FindSet() then
                        repeat
                            Planificado := TempPlanificado;
                            if not Planificado.Get(Planificado."Job No.", Planificado."Job Task No.", Planificado."Line No.") then begin
                                Planificado.Insert();
                                TaskCounter += 1;
                                Progress.Update(1, TaskCounter);
                            end;
                        until TempPlanificado.Next() = 0;

                    if SkippedCount > 0 then
                        Message('Se omitieron %1 líneas ya facturadas en el proyecto %2, tarea %3.', SkippedCount, JobTask."Job No.", JobTask."Job Task No.");
                end;

            until JobTask.Next() = 0;
        Progress.Close();
    end;
}
