codeunit 50422 "PonerRealenPlanificado"
{
    procedure PonerRealenPlanificado(JobNo: Code[20]; Month: Integer; Year: Integer)
    var
        TablaReal: Record "Job Ledger Entry";
        TablaPLanificado: Record "Job Planning Line";
        TablaExpediente: Record "ARBVRNJobUnitPlanning";
        TablaTares: Record "Job Task";
        RecordCount: Integer;
        ProgressMsg: Label 'Procesando.......#1######################\';
        Progress: Dialog;
        LineNumber: Integer;
        FirstDayOfMonth: date;
        lastDayOfMonth: date;
        PurchInvHeader: Record "Purch. Inv. Header";
        PurcCRHeader: Record "Purch. Cr. Memo Hdr.";

    begin
        // Definir la fecha de inicio y fin basados en el mes y el año
        FirstDayOfMonth := DMY2DATE(1, MONTH, Year);
        lastDayOfMonth := CALCDATE('+1M', FirstDayOfMonth);
        LastDayOfMonth := CALCDATE('-1D', lastDayOfMonth);

        Progress.OPEN(ProgressMsg, RecordCount);

        TablaPLanificado.SETRANGE("Job No.", JobNo);
        TablaPLanificado.SETRANGE("Planning Date", FirstDayOfMonth, LastDayOfMonth);
        TablaPLanificado.SETRANGE("Qty. Transferred to Invoice", 0);
        TablaPLanificado.DELETEALL;

        CLEAR(TablaReal);
        TablaReal.SETRANGE("Job No.", JobNo);
        TablaReal.SETRANGE("Posting Date", FirstDayOfMonth, LastDayOfMonth);
        TablaReal.SETFILTER(Type, '<>%1', TablaReal.Type::Resource);

        if TablaReal.FINDSET then begin
            repeat
                TablaExpediente.SetRange("ARBVRNJobNo", TablaReal."Job No.");
                if not TablaExpediente.FINDSET OR (TablaReal."Entry Type" = Enum::"Job Journal Line Entry Type"::Usage) then begin
                    RecordCount := RecordCount + 1;
                    Progress.Update(1, RecordCount);

                    TablaPLanificado.RESET();
                    TablaPLanificado.SETRANGE("Job No.", TablaReal."Job No.");
                    TablaPLanificado.SETRANGE("Job Task No.", TablaReal."Job Task No.");
                    if TablaPLanificado.FINDLAST then
                        LineNumber := TablaPLanificado."Line No." + 10000
                    else
                        LineNumber := 10000;

                    TablaPLanificado.INIT;
                    TablaPLanificado."Line No." := LineNumber;
                    TablaPLanificado."Job No." := TablaReal."Job No.";
                    TablaPLanificado.VALIDATE("Job No.");
                    TablaPLanificado."Job Task No." := TablaReal."Job Task No.";
                    if TablaTares.Get(TablaReal."Job No.", TablaReal."Job Task No.") then
                        TablaPLanificado.VALIDATE("Job Task No.")
                    else begin
                        if TablaReal."Job No." = '' then
                            ERROR('El campo "Job No." está vacío.');
                        ERROR('El proyecto %1 tiene un valor en N.º tarea proyecto %2 que no existe.', TablaReal."Job Task No.", TablaReal."Job No.");
                    end;
                    if TablaReal."Entry Type" = Enum::"Job Journal Line Entry Type"::Sale then
                        TablaPLanificado."Line Type" := Enum::"Job Planning Line Line Type"::Billable
                    else
                        TablaPLanificado."Line Type" := Enum::"Job Planning Line Line Type"::Budget;

                    TablaPLanificado.VALIDATE("Line Type");

                    // PurchInvHeader.Reset();
                    // if PurchInvHeader.Get(TablaReal."Document No.") then
                    //     TablaPLanificado."Planning Date" := PurchInvHeader."VAT Reporting Date"
                    // else begin
                    //     PurcCRHeader.Reset();
                    //     if PurcCRHeader.Get(TablaReal."Document No.") then
                    //         TablaPLanificado."Planning Date" := PurcCRHeader."VAT Reporting Date"
                    //     else
                    //         TablaPLanificado."Planning Date" := TablaReal."Posting Date"; // Valor por defecto si no se encuentra ninguno
                    // end;
                    TablaPLanificado."Planning Date" := TablaReal."Posting Date";
                    TablaPLanificado.VALIDATE("Planning Date");
                    TablaPLanificado."Document No." := TablaReal."Document No.";
                    TablaPLanificado.VALIDATE("Document No.");
                    TablaPLanificado.Type := TablaReal.Type;
                    TablaPLanificado.VALIDATE(Type);
                    TablaPLanificado."No." := TablaReal."No.";
                    TablaPLanificado.VALIDATE("No.");
                    TablaPLanificado.Description := TablaReal.Description;
                    TablaPLanificado.VALIDATE(Description);
                    if TablaReal."Entry Type" = Enum::"Job Journal Line Entry Type"::Sale then begin
                        if (TablaReal.Quantity > 0) AND (TablaReal."Total Price (LCY)" < 0) then
                            TablaPLanificado.Quantity := TablaReal.Quantity
                        else
                            TablaPLanificado.Quantity := TablaReal.Quantity * -1;
                    end else
                        TablaPLanificado.Quantity := TablaReal.Quantity;

                    if ABS(TablaReal.Quantity) > 999999999 then
                        Error('Cantidad demasiado alta: %1', TablaReal.Quantity);

                    TablaPLanificado.VALIDATE(Quantity);
                    if TablaPLanificado."Line Type" = Enum::"Job Planning Line Line Type"::Billable then begin
                        TablaPLanificado."Direct Unit Cost (LCY)" := 0;
                        TablaPLanificado.VALIDATE("Direct Unit Cost (LCY)");
                        TablaPLanificado."Unit Cost (LCY)" := 0;
                        TablaPLanificado.VALIDATE("Unit Cost (LCY)");
                        TablaPLanificado."Unit Price (LCY)" := TablaReal."Unit Price (LCY)";
                        TablaPLanificado.VALIDATE("Unit Price (LCY)");
                    end else begin
                        TablaPLanificado."Unit Price (LCY)" := 0;
                        TablaPLanificado.VALIDATE("Unit Price (LCY)");
                        TablaPLanificado."Direct Unit Cost (LCY)" := TablaReal."Direct Unit Cost (LCY)";
                        TablaPLanificado.VALIDATE("Direct Unit Cost (LCY)");
                        TablaPLanificado."Unit Cost (LCY)" := TablaReal."Unit Cost (LCY)";
                        TablaPLanificado.VALIDATE("Unit Cost (LCY)");
                    end;

                    TablaPLanificado."Resource Group No." := TablaReal."Resource Group No.";
                    TablaPLanificado."Unit of Measure Code" := TablaReal."Unit of Measure Code";
                    TablaPLanificado.VALIDATE("Unit of Measure Code");
                    TablaPLanificado."Last Date Modified" := TODAY();
                    TablaPLanificado."User ID" := TablaReal."User ID";
                    TablaPLanificado.VALIDATE("User ID");
                    TablaPLanificado."Work Type Code" := TablaReal."Work Type Code";
                    TablaPLanificado."Document Date" := TablaReal."Posting Date";
                    TablaPLanificado.VALIDATE("Document Date");
                    TablaPLanificado."Currency Code" := TablaReal."Currency Code";
                    TablaPLanificado.VALIDATE("Currency Code");
                    TablaPLanificado."Currency Date" := TODAY();
                    TablaPLanificado.VALIDATE("Currency Date");
                    if TablaReal."Global Dimension 2 Code" = '' then
                        TablaPLanificado.ARBVRNAnaliticConcept := 'P64.00'
                    else
                        TablaPLanificado.ARBVRNAnaliticConcept := TablaReal."Global Dimension 2 Code";

                    if TablaPLanificado."Qty. Transferred to Invoice" <> 0 then
                        exit;

                    if not TablaPLanificado.INSERT then;
                    LineNumber += 10000
                end;
            until TablaReal.NEXT = 0;
        end;
        //TablaReal.SETCURRENTKEY("Job No.", "Posting Date", "Type");
        CLEAR(TablaReal);
        TablaReal.SETRANGE("Job No.", JobNo);
        TablaReal.SETRANGE(ARBVRNTimesheetdate, FirstDayOfMonth, LastDayOfMonth);
        TablaReal.SETRANGE(Type, TablaReal.Type::Resource);

        if TablaReal.FINDSET then begin
            repeat
                TablaExpediente.SetRange("ARBVRNJobNo", TablaReal."Job No.");
                if not TablaExpediente.FINDSET OR (TablaReal."Entry Type" = Enum::"Job Journal Line Entry Type"::Usage) then begin
                    RecordCount := RecordCount + 1;
                    Progress.Update(1, RecordCount);

                    TablaPLanificado.RESET();
                    TablaPLanificado.SETRANGE("Job No.", TablaReal."Job No.");
                    TablaPLanificado.SETRANGE("Job Task No.", TablaReal."Job Task No.");
                    if TablaPLanificado.FINDLAST then
                        LineNumber := TablaPLanificado."Line No." + 10000
                    else
                        LineNumber := 10000;

                    TablaPLanificado.INIT;
                    TablaPLanificado."Line No." := LineNumber;
                    TablaPLanificado."Job No." := TablaReal."Job No.";
                    TablaPLanificado.VALIDATE("Job No.");
                    TablaPLanificado."Job Task No." := TablaReal."Job Task No.";
                    if TablaTares.Get(TablaReal."Job No.", TablaReal."Job Task No.") then
                        TablaPLanificado.VALIDATE("Job Task No.")
                    else begin
                        if TablaReal."Job No." = '' then
                            ERROR('El campo "Job No." está vacío.');
                        ERROR('El proyecto %1 tiene un valor en N.º tarea proyecto %2 que no existe.', TablaReal."Job Task No.", TablaReal."Job No.");
                    end;
                    if TablaReal."Entry Type" = Enum::"Job Journal Line Entry Type"::Sale then
                        TablaPLanificado."Line Type" := Enum::"Job Planning Line Line Type"::Billable
                    else
                        TablaPLanificado."Line Type" := Enum::"Job Planning Line Line Type"::Budget;
                    TablaPLanificado.VALIDATE("Line Type");

                    TablaPLanificado."Planning Date" := TablaReal.ARBVRNTimesheetdate;
                    TablaPLanificado.VALIDATE("Planning Date");
                    TablaPLanificado."Document No." := TablaReal."Document No.";
                    TablaPLanificado.VALIDATE("Document No.");
                    TablaPLanificado.Type := TablaReal.Type;
                    TablaPLanificado.VALIDATE(Type);
                    TablaPLanificado."No." := TablaReal."No.";
                    TablaPLanificado.VALIDATE("No.");
                    TablaPLanificado.Description := TablaReal.Description;
                    TablaPLanificado.VALIDATE(Description);
                    if TablaReal."Entry Type" = Enum::"Job Journal Line Entry Type"::Sale then begin
                        if (TablaReal.Quantity > 0) AND (TablaReal."Total Price (LCY)" < 0) then
                            TablaPLanificado.Quantity := TablaReal.Quantity
                        else
                            TablaPLanificado.Quantity := TablaReal.Quantity * -1;
                    end else
                        TablaPLanificado.Quantity := TablaReal.Quantity;

                    if ABS(TablaReal.Quantity) > 999999999 then
                        Error('Cantidad demasiado alta: %1', TablaReal.Quantity);

                    TablaPLanificado.VALIDATE(Quantity);
                    if TablaPLanificado."Line Type" = Enum::"Job Planning Line Line Type"::Billable then begin
                        TablaPLanificado."Direct Unit Cost (LCY)" := 0;
                        TablaPLanificado.VALIDATE("Direct Unit Cost (LCY)");
                        TablaPLanificado."Unit Cost (LCY)" := 0;
                        TablaPLanificado.VALIDATE("Unit Cost (LCY)");
                        TablaPLanificado."Unit Price (LCY)" := TablaReal."Unit Price (LCY)";
                        TablaPLanificado.VALIDATE("Unit Price (LCY)");
                    end else begin
                        TablaPLanificado."Direct Unit Cost (LCY)" := TablaReal."Direct Unit Cost (LCY)";
                        TablaPLanificado.VALIDATE("Direct Unit Cost (LCY)");
                        TablaPLanificado."Unit Cost (LCY)" := TablaReal."Unit Cost (LCY)";
                        TablaPLanificado.VALIDATE("Unit Cost (LCY)");
                        TablaPLanificado."Unit Price (LCY)" := 0;
                        TablaPLanificado.VALIDATE("Unit Price (LCY)");
                    end;
                    TablaPLanificado."Resource Group No." := TablaReal."Resource Group No.";
                    TablaPLanificado."Unit of Measure Code" := TablaReal."Unit of Measure Code";
                    TablaPLanificado.VALIDATE("Unit of Measure Code");
                    TablaPLanificado."Last Date Modified" := TODAY();
                    TablaPLanificado."User ID" := TablaReal."User ID";
                    TablaPLanificado.VALIDATE("User ID");
                    TablaPLanificado."Work Type Code" := TablaReal."Work Type Code";
                    TablaPLanificado."Document Date" := TablaReal.ARBVRNTimesheetdate;
                    TablaPLanificado.VALIDATE("Document Date");
                    TablaPLanificado."Currency Code" := TablaReal."Currency Code";
                    TablaPLanificado.VALIDATE("Currency Code");
                    TablaPLanificado."Currency Date" := TODAY();
                    TablaPLanificado.VALIDATE("Currency Date");
                    if TablaReal."Global Dimension 2 Code" = '' then
                        TablaPLanificado.ARBVRNAnaliticConcept := 'P64.00'
                    else
                        TablaPLanificado.ARBVRNAnaliticConcept := TablaReal."Global Dimension 2 Code";

                    if TablaPLanificado."Qty. Transferred to Invoice" <> 0 then
                        exit;

                    TablaPLanificado.INSERT;
                    LineNumber += 10000
                end;
            until TablaReal.NEXT = 0;
        end;

    end;
}
