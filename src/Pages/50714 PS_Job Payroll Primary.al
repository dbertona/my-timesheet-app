page 50714 "PS_Job Payroll Primary"
{
    PageType = ListPart;
    SourceTable = "PS_Temp job Ledger Summary";
    SourceTableTemporary = false;
    ApplicationArea = All;
    UsageCategory = None;
    Caption = 'Job Ledger Entry Payroll Primary Costs';
    InsertAllowed = false;
    DeleteAllowed = false;

    layout
    {
        area(content)
        {
            repeater(Group1)
            {
                Caption = 'Primary Costs';

                field("Resource"; Rec."Resource No")
                {
                    ApplicationArea = All;
                    Editable = false;
                    StyleExpr = rec.RowStyle; // Usar la variable global
                    trigger OnAssistEdit()
                    begin
                        // Llamar al procedimiento para establecer el filtro del recurso
                        SetResourceFilter(Rec."Resource No");
                    end;
                }
                field("Name"; Rec."Resource Name")
                {
                    ApplicationArea = All;
                    Editable = false;
                    StyleExpr = Rec.RowStyle; // Usar la variable global
                }
                field("Total Cost by Payroll"; Rec."Total Cost by Payroll")
                {
                    ApplicationArea = All;
                    Editable = false;
                    StyleExpr = Rec.RowStyle; // Usar la variable global
                }
                field("Total Cost for Imputation"; Rec."Total Cost for Imputation")
                {
                    ApplicationArea = All;
                    Editable = false;
                    StyleExpr = Rec.RowStyle; // Usar la variable global
                }
                field("Compensation Reserve"; Rec."Compensation Reserve")
                {
                    ApplicationArea = All;
                    Editable = true; // Permitir edición
                    StyleExpr = Rec.RowStyle; // Usar la variable global
                    trigger OnValidate()
                    begin
                        // Llamar al procedimiento para actualizar los ajustes
                        Rec."Percentage Difference" := GetPercentageDifference();
                        Rec.Modify();
                        CurrPage.Update(false);
                        UpdateGroupedJobLedgerAdjustments(Rec."Resource No");
                        CurrPage.Update(false);
                    end;
                }
                field("Diferencia"; GetCostDifference())
                {
                    ApplicationArea = All;
                    Editable = false;
                    AutoFormatType = 1;
                    AutoFormatExpression = '<Precision,2>';
                    StyleExpr = Rec.RowStyle; // Usar la variable global
                }
                field("Percentage Difference"; Rec."Percentage Difference")
                {
                    ApplicationArea = All;
                    Editable = false;
                    AutoFormatType = 10;
                    AutoFormatExpression = '<precision, 2:2><standard format,0>%';
                    StyleExpr = Rec.RowStyle; // Usar la variable global
                }
            }
        }
    }

    var
        TotalTotalCostByPayroll: Decimal;
        TotalTotalCostForImputation: Decimal;
        TotalCompensationReserve: Decimal;
        TotalDiferencia: Decimal;
        RowStyle: Text[30]; // Variable global para el estilo

    trigger OnAfterGetRecord()
    begin
        // Calcular totales solo si no es la línea de totales
        if not Rec."IsTotalLine" then begin
            TotalTotalCostByPayroll += Rec."Total Cost by Payroll";
            TotalTotalCostForImputation += Rec."Total Cost for Imputation";
            TotalCompensationReserve += Rec."Compensation Reserve";
            TotalDiferencia += GetCostDifference();
        end;
        // Actualizar estilo basado en IsTotalLine
        if Rec."IsTotalLine" then
            Rec.RowStyle := 'StrongAccent'
        else
            Rec.RowStyle := '';
    end;

    procedure SetResourceFilter(ResourceNo: Code[20])
    var
        Page50715: Page "PS_Job Ledger Grouped";
    begin
        // Filtrar la página 50715 por el recurso seleccionado
        Page50715.SetResourceFilter(ResourceNo);
        Page50715.Update(false);
    end;

    procedure GetCostDifference(): Decimal
    begin
        exit((Rec."Total Cost by Payroll" + Rec."Compensation Reserve" - Rec."Total Cost for Imputation") * -1);
    end;

    procedure UpdateGroupedJobLedgerAdjustments(ResourceNo: Code[20])
    var
        TempGroupedRec: Record "PS_Temp Grouped job Ledger";
        TempJobLedgerSummaryRec: Record "PS_Temp job Ledger Summary";
        TotalCostByPayroll, CompensationReserve, TotalCostForImputation, TotalWeight, Weight, Adjustment : Decimal;
    begin
        if TempJobLedgerSummaryRec.Get(ResourceNo) then begin
            TotalCostByPayroll := TempJobLedgerSummaryRec."Total Cost by Payroll";
            TotalCostForImputation := TempJobLedgerSummaryRec."Total Cost for Imputation";
            CompensationReserve := TempJobLedgerSummaryRec."Compensation Reserve";

            TempGroupedRec.SetRange("Resource No.", ResourceNo);
            if TempGroupedRec.FindSet() then begin
                repeat
                    TempGroupedRec."Percentage of Total" := (TempGroupedRec."Grouped Total Cost" / TotalCostForImputation);
                    TempGroupedRec."Adjustment" := ((TotalCostByPayroll + CompensationReserve - TotalCostForImputation) * (TempGroupedRec."Percentage of Total")) * -1;
                    TempGroupedRec.Modify();
                until TempGroupedRec.Next() = 0;
            end else begin
                Error('No se encontraron registros en PS_Temp Grouped project Ledger para el recurso %1.', ResourceNo);
            end;
        end else begin
            Error('No se encontraron registros en PS_Temp project Ledger Summary para el recurso %1.', ResourceNo);
        end;
    end;

    procedure GetPercentageDifference(): Decimal
    begin
        if Rec."Total Cost for Imputation" <> 0 then
            exit((GetCostDifference() / Rec."Total Cost for Imputation") * -1)
        else
            exit(0);
    end;
}
