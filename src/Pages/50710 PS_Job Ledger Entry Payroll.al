page 50710 "PS_Job Ledger Entry Payroll"
{
    PageType = Card;
    ApplicationArea = All;
    UsageCategory = Lists;
    Caption = 'Job Ledger Entry Payroll Costs';

    layout
    {
        area(content)
        {
            part(Group1; "PS_Job Payroll Primary")
            {
                Caption = 'Primary Costs';
                ApplicationArea = All;
            }

            part(Group2; "PS_Job Ledger Grouped")
            {
                Caption = 'Grouped Costs by project No.';
                ApplicationArea = All;
            }
        }
    }
    actions
    {

        area(processing)
        {
            action("Process Adjustment")
            {
                Caption = 'Process adjustment';
                Image = Process;
                ApplicationArea = All;
                trigger OnAction()
                begin
                    ProcessAdjustment();
                end;
            }
        }
    }

    var
        FilterStartDate: Date;
        FilterEndDate: Date;
        FilterDepartmentCode: Text;
        ForecastPercentage: Decimal;
        LocalPostingDate: Date;
        TempRec: Record "PS_Temp job Ledger Summary";
        TempGroupedRec: Record "PS_Temp Grouped job Ledger";
        ResourceRec: Record Resource;
        SelectedResourceNo: Code[20];
        Progress: Dialog;
        ProgressMsg: Label 'Procesando.......#1######################\';
        Counter: Integer;

    procedure SetFilterDates(StartDate: Date; EndDate: Date)
    begin
        if StartDate > EndDate then
            Error('Start Date cannot be after End Date.');
        FilterStartDate := StartDate;
        FilterEndDate := EndDate;
    end;

    procedure SetFilterDepartment(DepartmentCode: Text)
    begin
        FilterDepartmentCode := DepartmentCode;
    end;

    procedure SetFilterForecastPercentage(Percentage: Decimal)
    begin
        ForecastPercentage := Percentage;
    end;

    procedure SetFilterPostingDate(PostingDate: Date)
    begin
        LocalPostingDate := PostingDate;
    end;

    trigger OnOpenPage()
    var
        JobLedgerEntryRec: Record "Job Ledger Entry";
        JobLedgerEntryPage: Page "PS_Job Ledger Entry Payroll";
    begin
        // Clear temporary records
        TempRec.DeleteAll();
        TempGroupedRec.DeleteAll();

        JobLedgerEntryPage.SetFilterPostingDate(LocalPostingDate);
        // Contar el número total de registros para la barra de progreso
        JobLedgerEntryRec.Reset();
        JobLedgerEntryRec.SetRange("Posting Date", FilterStartDate, FilterEndDate);
        JobLedgerEntryRec.SetFilter("Global Dimension 1 Code", FilterDepartmentCode);
        JobLedgerEntryRec.SetRange("No.", '64000000', '64299999');
        JobLedgerEntryRec.SetRange("Document No.", 'REC0027');
        Counter := 0;

        Progress.OPEN(ProgressMsg, Counter);

        // Filter and calculate Total Cost by Payroll
        ApplyPrimaryCostFilters(JobLedgerEntryRec, FilterStartDate, FilterEndDate, FilterDepartmentCode);

        // Filter and calculate Total Cost for Imputation
        ApplyImputationCostFilters(JobLedgerEntryRec, FilterStartDate, FilterEndDate, FilterDepartmentCode);

        CalcularTotales();

        // Aggregate and copy data for Grouped Costs by project No.
        AggregateGroupedCosts(JobLedgerEntryRec, FilterStartDate, FilterEndDate);

        Progress.CLOSE();

        // Ensure the page parts are updated
        CurrPage.Group1.PAGE.Update();
        CurrPage.Group2.PAGE.Update();
    end;

    procedure SetSelectedResourceNo(ResourceNo: Code[20])
    begin
        SelectedResourceNo := ResourceNo;
        CurrPage.Group2.PAGE.SetResourceFilter(SelectedResourceNo);
    end;

    procedure ApplyPrimaryCostFilters(var JobLedgerEntryRec: Record "Job Ledger Entry"; StartDate: Date; EndDate: Date; DepartmentCode: Text)
    var
        CurrentResource: Code[20];
        Total640Accounts: Decimal;
    begin
        JobLedgerEntryRec.Reset();
        JobLedgerEntryRec.SetRange("Posting Date", StartDate, EndDate);
        JobLedgerEntryRec.SetFilter("Global Dimension 1 Code", DepartmentCode);
        JobLedgerEntryRec.SetRange("No.", '64000000', '64299999');
        //JobLedgerEntryRec.SetRange("Document No.", 'REC0042');
        JobLedgerEntryRec.SetCurrentKey("Document No.", "No.", "Posting Date");
        JobLedgerEntryRec.SetAscending("Document No.", true);
        JobLedgerEntryRec.SetAscending("No.", true);
        JobLedgerEntryRec.SetAscending("Posting Date", true);

        if JobLedgerEntryRec.FindSet() then begin
            CurrentResource := '';
            Total640Accounts := 0;

            repeat
                // Si cambiamos de recurso, aplicamos el ForecastPercentage y reseteamos el total
                if CurrentResource <> JobLedgerEntryRec."Document No." then begin
                    if CurrentResource <> '' then begin
                        if ResourceRec.Get(CurrentResource) then begin
                            if TempRec.Get(CurrentResource) then begin
                                TempRec."Compensation Reserve" := Total640Accounts * ForecastPercentage;
                                TempRec.Modify();
                            end;
                        end;
                    end;

                    CurrentResource := JobLedgerEntryRec."Document No.";
                    Total640Accounts := 0;
                end;

                // Si la cuenta es 640*, sumamos el costo
                if COPYSTR(JobLedgerEntryRec."No.", 1, 3) = '640' then begin
                    Total640Accounts += JobLedgerEntryRec."Total Cost (LCY)";
                end;

                if ResourceRec.Get(JobLedgerEntryRec."Document No.") then begin
                    if not TempRec.Get(JobLedgerEntryRec."Document No.") then begin
                        TempRec.Init();
                        TempRec."Resource No" := JobLedgerEntryRec."Document No.";
                        TempRec."Resource Name" := ResourceRec.Name;
                        TempRec."Total Cost by Payroll" := 0;
                        TempRec."Total Cost for Imputation" := 0;
                        TempRec."Compensation Reserve" := 0;
                        TempRec.Insert();
                    end;
                    TempRec."Total Cost by Payroll" += JobLedgerEntryRec."Total Cost (LCY)";
                    TempRec.Modify();
                end;

                // Actualizar la barra de progreso
                Counter += 1;
                Progress.Update(1, Counter)
            until JobLedgerEntryRec.Next() = 0;

            // Aplicar el ForecastPercentage para el último recurso
            if ResourceRec.Get(CurrentResource) then begin
                if TempRec.Get(CurrentResource) then begin
                    TempRec."Compensation Reserve" := Total640Accounts * ForecastPercentage;
                    TempRec.Modify();
                end;
            end;
        end else begin
            Message('No records found for Total Cost by Payroll.');
        end;

        // Ensure the page part is updated
        CurrPage.Group1.PAGE.Update();
    end;

    procedure ApplyImputationCostFilters(var JobLedgerEntryRec: Record "Job Ledger Entry"; StartDate: Date; EndDate: Date; DepartmentCode: Text)
    begin
        // Recorrer la tabla PS_Temp project Ledger Summary
        if TempRec.FindSet() then begin
            repeat
                IF NOT TEMPREC.IsTotalLine THEN BEGIN
                    JobLedgerEntryRec.Reset();
                    JobLedgerEntryRec.SetRange(ARBVRNTimesheetdate, StartDate, EndDate);
                    JobLedgerEntryRec.SetRange(Type, JobLedgerEntryRec.Type::Resource);
                    JobLedgerEntryRec.SetRange("No.", TempRec."Resource No");
                    JobLedgerEntryRec.SetFilter("Job No.", '<>@PY*'); // Exclude all projects starting with "PY"

                    if JobLedgerEntryRec.FindSet() then begin
                        repeat
                            // Actualizar los costos de imputación en la tabla PS_Temp project Ledger Summary
                            TempRec."Total Cost for Imputation" += JobLedgerEntryRec."Total Cost (LCY)";
                            // Calcular el porcentaje de diferencia
                            if TempRec."Total Cost for Imputation" <> 0 then
                                TempRec."Percentage Difference" := ((TempRec."Total Cost by Payroll" + TempRec."Compensation Reserve" - TempRec."Total Cost for Imputation") / TempRec."Total Cost for Imputation")
                            else
                                TempRec."Percentage Difference" := 0;
                            TempRec.Modify();
                            Counter += 1;
                            Progress.Update(1, Counter)
                        until JobLedgerEntryRec.Next() = 0;
                    end else begin
                        Message('No records found for Total Cost for Imputation for Resource %1.', TempRec."Resource No");
                    end;

                    // Actualizar la barra de progreso
                    Counter += 1;
                    Progress.Update(1, Counter)
                END;

            until TempRec.Next() = 0;
        end else begin
            Message('No records found in PS_Temp project Ledger Summary.');
        end;
    end;

    procedure AggregateGroupedCosts(var JobLedgerEntryRec: Record "Job Ledger Entry"; StartDate: Date; EndDate: Date)
    var
        TempRec: Record "PS_Temp job Ledger Summary";
        TempGroupedRec: Record "PS_Temp Grouped job Ledger";
    begin
        if TempRec.FindSet() then begin
            repeat
                JobLedgerEntryRec.Reset();
                JobLedgerEntryRec.SetRange(ARBVRNTimesheetdate, StartDate, EndDate);
                JobLedgerEntryRec.SetRange(Type, JobLedgerEntryRec.Type::Resource);
                JobLedgerEntryRec.SetRange("No.", TempRec."Resource No");
                JobLedgerEntryRec.SetFilter("Job No.", '<>@PY*'); // Exclude all projects starting with "PY"

                if JobLedgerEntryRec.FindSet() then begin
                    repeat
                        // Utilizar Get con la clave primaria para la búsqueda
                        if not TempGroupedRec.Get(JobLedgerEntryRec."Job No.", TempRec."Resource No", JobLedgerEntryRec."Job Task No.") then begin
                            TempGroupedRec.Init();
                            TempGroupedRec."Job No." := JobLedgerEntryRec."Job No.";
                            TempGroupedRec."Resource No." := TempRec."Resource No";
                            TempGroupedRec."Resource Name" := TempRec."Resource Name";
                            TempGroupedRec."Job Task No." := JobLedgerEntryRec."Job Task No.";
                            TempGroupedRec."Grouped Total Cost" := 0;
                            TempGroupedRec.Insert();
                        end;
                        TempGroupedRec."Grouped Total Cost" += JobLedgerEntryRec."Total Cost (LCY)";

                        // Calcular el porcentaje y el ajuste directamente aquí
                        TempGroupedRec."Percentage of Total" := (TempGroupedRec."Grouped Total Cost" / TempRec."Total Cost for Imputation");
                        TempGroupedRec."Adjustment" := ((TempRec."Total Cost by Payroll" + TempRec."Compensation Reserve" - TempRec."Total Cost for Imputation") * (TempGroupedRec."Percentage of Total")) * -1;

                        // Si el ajuste es cero, no tomar en cuenta el registro
                        if TempGroupedRec."Adjustment" <> 0 then begin
                            TempGroupedRec.Modify();
                        end else begin
                            TempGroupedRec.Delete();
                        end;
                        Counter += 1;
                        Progress.Update(1, Counter)
                    until JobLedgerEntryRec.Next() = 0;
                end;

                // Actualizar la barra de progreso
                Counter += 1;
                Progress.Update(1, Counter)
            until TempRec.Next() = 0;
        end;

        // Ensure the page part is updated
        CurrPage.Group2.PAGE.Update();
    end;

    procedure CalcularTotales();
    Var
        Rec: Record "PS_Temp job Ledger Summary";
        TotalTotalCostByPayroll: Decimal;
        TotalTotalCostForImputation: Decimal;
        TotalCompensationReserve: Decimal;
        TotalDiferencia: Decimal;
        RowStyle: Text[30]; // Variable global para el estilo
    begin
        // Calcular totales solo si no es la línea de totales
        Rec.Init();
        if Rec.FindSet() then begin
            repeat
                if not Rec."IsTotalLine" then begin
                    TotalTotalCostByPayroll += Rec."Total Cost by Payroll";
                    TotalTotalCostForImputation += Rec."Total Cost for Imputation";
                    TotalCompensationReserve += Rec."Compensation Reserve";
                    TotalDiferencia += ((Rec."Total Cost by Payroll" + Rec."Compensation Reserve" - Rec."Total Cost for Imputation") * -1);
                end;
            until Rec.Next() = 0;
        END;
        Rec.Init();
        Rec."IsTotalLine" := true;
        Rec."Resource No" := 'Totales';
        Rec."Total Cost by Payroll" := TotalTotalCostByPayroll;
        Rec."Total Cost for Imputation" := TotalTotalCostForImputation;
        Rec."Compensation Reserve" := TotalCompensationReserve;
        rec."Percentage Difference" := ((TotalTotalCostByPayroll + TotalCompensationReserve - TotalTotalCostForImputation) / TotalTotalCostForImputation);
        Rec.Insert();
        // Actualizar estilo basado en IsTotalLine
        if Rec."IsTotalLine" then
            RowStyle := 'Strong'
        else
            RowStyle := '';
    end;

    procedure ProcessAdjustment()
    var
        AjusteCodeunit: Codeunit "PS_ProcessAdjustment";
    begin
        // Llama al codeunit para procesar el ajuste
        AjusteCodeunit.ProcesarAjuste(LocalPostingDate);
        CurrPage.Close();
    end;
}
