tableextension 51002 PS_Job_Extension extends Job
{
    fields
    {
        field(51001; "PS_% Probability"; Option)
        {
            Caption = '% Probability';
            OptionMembers = "0","10","30","50","70","90";
            DataClassification = SystemMetadata;
        }

        field(51002; "PS_OriginalStatus"; Enum "Job Status")
        {
            DataClassification = SystemMetadata;
            // Esto no se almacena en la base de datos, es solo para uso temporal
        }
        field(51003; "PS_NumberofInvoicesIssued"; Integer)
        {
            Caption = 'Number of Invoices Issued';

            FieldClass = FlowField;
            CalcFormula = Count("Sales Invoice Header" where("ARBVRNJobNo" = field("No.")));
        }
        field(51004; "PS_NumberofCrInvoicesIssued"; Integer)
        {
            Caption = 'Number of sales credit Issued';

            FieldClass = FlowField;
            CalcFormula = Count("Sales Cr.Memo Header" where("ARBVRNJobNo" = field("No.")));
        }
        field(51005; "PS_NumberofPurchaseOrders"; Integer)
        {
            Caption = 'Number of Purchase orders';

            FieldClass = FlowField;
            CalcFormula = Count("Purchase Header" where("ARBVRNJobNo" = field("No.")));
        }
        field(51006; "PS_NumberofPurchaseInvoice"; Integer)
        {
            Caption = 'Number of Purchase Invoice Issued';

            FieldClass = FlowField;
            CalcFormula = Count("Purch. Inv. Header" where("ARBVRNJobNo" = field("No.")));
        }
        field(51007; "PS_NumberofCRPurchaseIssued"; Integer)
        {
            Caption = 'Number of Purchase Credit Issued';

            FieldClass = FlowField;
            CalcFormula = Count("Purch. Cr. Memo Hdr." where("ARBVRNJobNo" = field("No.")));
        }

        field(50108; PS_DoNotConsolidate; Boolean)
        {
            Caption = 'Not consolidated between companies';
            DataClassification = ToBeClassified;
        }

    }
    trigger OnModify()
    var
        RecBeforeModification: Record Job;
        PS_MonthClosing: Record "PS_MonthClosing";
    begin
        // Leer el registro antes de la modificación para comparar valores
        RecBeforeModification.Get(Rec."No.");

        if (Rec.Status = Rec.Status::Completed) OR (Rec.Status = Rec.Status::lost) then begin
            // Cerrar todos los meses abiertos para este proyecto cuando el estado cambie a Completado
            PS_MonthClosing.SETRANGE("PS_JobNo", Rec."No.");
            PS_MonthClosing.SETRANGE("PS_Status", PS_MonthClosing."PS_Status"::Open);

            if PS_MonthClosing.FINDSET then begin
                repeat
                    // Cambiar el estado a Cerrado
                    PS_MonthClosing."PS_Status" := PS_MonthClosing."PS_Status"::Close;
                    PS_MonthClosing.MODIFY;
                until PS_MonthClosing.NEXT = 0;
            end;
        end;

        // Establecer la 'Probabilidad' a cero si el 'Status' ha cambiado
        if (Rec."PS_OriginalStatus" <> Rec.Status) AND (Rec.Status = Rec.Status::Open) then
            Rec."PS_% Probability" := 0;
    end;

    trigger OnAfterModify()
    var
        RecJob: Record "Job";
        PS_MonthClosing: Record "PS_MonthClosing";
        i: Integer;
        DocumentDateYear: Code[4];
        DocumentDateMonth: Integer;
        ClosingMonthCode: Code[20];
        DateTypeVariable: Date;
        CurrentMonth: Integer;
    begin
        // Obtener el registro recién modificado
        RecJob.Get(Rec."No.");
        PS_MonthClosing.SETRANGE("PS_JobNo", RecJob."No.");

        // Obtener el mes actual
        CurrentMonth := Date2DMY(Today, 2); // Devuelve el mes actual

        IF NOT PS_MonthClosing.FINDSET THEN BEGIN
            if (RecJob.Description <> '') AND (RecJob."Global Dimension 1 Code" <> '') then
                for i := 1 to 12 do begin
                    PS_MonthClosing.INIT;
                    PS_MonthClosing."PS_JobNo" := RecJob."No.";
                    PS_MonthClosing."PS_Description" := RecJob."Description";
                    PS_MonthClosing."PS_GlobalDimension1Code" := RecJob."Global Dimension 1 Code";
                    PS_MonthClosing."PS_ClosingMonthName" := GetMonthName(i);

                    IF i > 9 THEN
                        PS_MonthClosing.PS_ClosingMonthCode := Format(Date2DMY(Today, 3)) + '.' + Format(i)
                    ELSE
                        PS_MonthClosing.PS_ClosingMonthCode := Format(Date2DMY(Today, 3)) + '.0' + Format(i);

                    // Establecer el año actual
                    PS_MonthClosing.PS_Year := Format(Date2DMY(Today, 3));
                    PS_MonthClosing.PS_Month := Format(i);

                    // Insertar el nuevo registro en PS_MonthClosing
                    Evaluate(DateTypeVariable, '01/' + PS_MonthClosing.PS_Month + '/' + PS_MonthClosing.PS_Year);
                    PS_MonthClosing.PS_ClosingMonthDate := CalcDate('<CM>', DateTypeVariable);

                    // Si el mes que se está creando es menor que el mes actual, establecer el estado en Close
                    if i < CurrentMonth then
                        PS_MonthClosing."PS_Status" := PS_MonthClosing."PS_Status"::Close;
                    PS_MonthClosing.Insert();
                end;
        END;
    end;

    trigger OnDelete()
    var
        RecJob: Record "Job";
        PS_MonthClosing: Record "PS_MonthClosing";
    begin
        // Obtener el registro del proyecto que se está eliminando
        RecJob.Get(Rec."No.");

        // Establecer el rango de búsqueda en PS_MonthClosing para encontrar los registros asociados a este proyecto
        PS_MonthClosing.SETRANGE("PS_JobNo", RecJob."No.");

        // Eliminar todos los registros de PS_MonthClosing asociados a este proyecto
        PS_MonthClosing.DELETEALL;
    end;

    procedure GetMonthName(month: Integer): Text
    var
        MonthNames: array[12] of Text[10];
    begin
        MonthNames[1] := 'Enero';
        MonthNames[2] := 'Febrero';
        MonthNames[3] := 'Marzo';
        MonthNames[4] := 'Abril';
        MonthNames[5] := 'Mayo';
        MonthNames[6] := 'Junio';
        MonthNames[7] := 'Julio';
        MonthNames[8] := 'Agosto';
        MonthNames[9] := 'Septiembre';
        MonthNames[10] := 'Octubre';
        MonthNames[11] := 'Noviembre';
        MonthNames[12] := 'Diciembre';

        if (month >= 1) and (month <= 12) then
            exit(MonthNames[month])
        else
            exit('');
    end;
}
