page 50715 "PS_Job Ledger Grouped"
{
    PageType = ListPart;
    SourceTable = "PS_Temp Grouped job Ledger";
    SourceTableTemporary = false;
    ApplicationArea = All;
    UsageCategory = None;
    Caption = 'Job Ledger Entry Grouped Costs by project No.';
    InsertAllowed = false;
    DeleteAllowed = false;

    SourceTableView = sorting("Resource No.", "Percentage of Total") order(ascending);

    layout
    {
        area(content)
        {
            repeater(Group2)
            {
                Caption = 'Grouped Costs by project No.';

                field("Resource"; Rec."Resource No.")
                {
                    ApplicationArea = All;
                    Editable = false;
                }
                field("Name"; Rec."Resource Name")
                {
                    ApplicationArea = All;
                    Editable = false;
                }
                field("Job No."; Rec."Job No.")
                {
                    ApplicationArea = All;
                    Editable = false;
                }
                field("Job Task No."; Rec."Job Task No.")
                {
                    ApplicationArea = All;
                    Editable = false;
                }
                field("Project Name"; GetProjectName())
                {
                    ApplicationArea = All;
                    Editable = false;
                }
                field("Imputation Cost by Project"; Rec."Grouped Total Cost")
                {
                    ApplicationArea = All;
                    Editable = false;
                }
                field("Porcentaje por proyecto"; Rec."Percentage of Total")
                {
                    ApplicationArea = All;
                    Editable = true; // Hacer que el campo sea editable
                    AutoFormatType = 10;
                    AutoFormatExpression = '<precision, 2:2><standard format,0>%';
                    trigger OnValidate()
                    var
                        TotalPercentage, OldPercentage, Difference, NewTotalPercentage, Adjustment, TotalCostByPayroll, "Compensation Reserve", TotalCostForImputation, TotalWeight, Weight : Decimal;
                        TempGroupedRec: Record "PS_Temp Grouped job Ledger";
                        TempJobLedgerSummaryRec: Record "PS_Temp job Ledger Summary";
                        ConfirmChange: Boolean;
                    begin
                        // Guardar el valor anterior del porcentaje
                        OldPercentage := xRec."Percentage of Total";

                        // Leer valores de la tabla "PS_Temp project Ledger Summary" para el recurso
                        if TempJobLedgerSummaryRec.Get(Rec."Resource No.") then begin
                            TotalCostByPayroll := TempJobLedgerSummaryRec."Total Cost by Payroll";
                            TotalCostForImputation := TempJobLedgerSummaryRec."Total Cost for Imputation";
                            "Compensation Reserve" := TempJobLedgerSummaryRec."Compensation Reserve";
                        end else begin
                            Error('No se encontraron registros en PS_Temp project Ledger Summary para el recurso %1.', Rec."Resource No.");
                        end;

                        // Calcular la diferencia entre el porcentaje nuevo y el anterior
                        Difference := Rec."Percentage of Total" - OldPercentage;

                        // Recalcular Adjustment para el registro actual
                        Rec."Adjustment" := ((TotalCostByPayroll + "Compensation Reserve" - TotalCostForImputation) * (TempGroupedRec."Percentage of Total")) * -1;
                        Rec.Modify();

                        // Obtener el total del peso (porcentaje) de los otros proyectos
                        TempGroupedRec.Reset();
                        TempGroupedRec.SetRange("Resource No.", Rec."Resource No.");
                        TempGroupedRec.SetFilter("Job No.", '<> %1', Rec."Job No."); // Excluir el proyecto actual

                        TotalWeight := 0;
                        if TempGroupedRec.FindSet() then begin
                            repeat
                                TotalWeight += TempGroupedRec."Percentage of Total";
                            until TempGroupedRec.Next() = 0;
                        end else begin
                            Error('No se encontraron otros proyectos para el recurso %1.', Rec."Resource No.");
                        end;

                        // Redistribuir la diferencia según el peso de cada proyecto
                        TempGroupedRec.Reset();
                        TempGroupedRec.SetRange("Resource No.", Rec."Resource No.");
                        TempGroupedRec.SetFilter("Job No.", '<> %1', Rec."Job No."); // Excluir el proyecto actual

                        NewTotalPercentage := Rec."Percentage of Total"; // Inicializar con el porcentaje del registro actual
                        if TempGroupedRec.FindSet() then begin
                            repeat
                                // Calcular el peso relativo del proyecto
                                Weight := TempGroupedRec."Percentage of Total" / TotalWeight;

                                // Ajustar el porcentaje de los otros proyectos
                                TempGroupedRec."Percentage of Total" := TempGroupedRec."Percentage of Total" - (Difference * Weight);

                                // Recalcular Adjustment
                                TempGroupedRec."Adjustment" := ((TotalCostByPayroll + "Compensation Reserve" - TotalCostForImputation) * (TempGroupedRec."Percentage of Total")) * -1;
                                TempGroupedRec.Modify();

                                NewTotalPercentage += TempGroupedRec."Percentage of Total";
                            until TempGroupedRec.Next() = 0;

                            // Validar que el total del porcentaje por recurso sea 100%
                            if ROUND(NewTotalPercentage, 0.0001) <> 1 then
                                Error('El total del porcentaje para el recurso %1 debe ser 100%. Actualmente es %2%.', Rec."Resource No.", (NewTotalPercentage * 100));
                        end;

                        CurrPage.Update(false);
                    end;

                }
                field("Adjustment"; Rec."Adjustment")
                {
                    ApplicationArea = All;
                    Editable = false;
                }
            }
        }
    }


    trigger OnNewRecord(BelowxRec: Boolean);
    begin
        // Impedir la creación de nuevos registros
        Error('No se pueden crear nuevos registros en esta página.');
    end;

    trigger OnDeleteRecord(): Boolean;
    begin
        // Impedir la eliminación de registros
        Error('No se pueden eliminar registros en esta página.');
        exit(false); // Esto es necesario para que no se realice la eliminación
    end;

    procedure SetResourceFilter(ResourceNo: Code[20])
    begin
        Rec.SetRange("Resource No.", ResourceNo);
        CurrPage.Update(false);
    end;

    procedure GetProjectName(): Text
    var
        ProjectRec: Record "Job"; // Tabla de proyectos
    begin
        if ProjectRec.Get(Rec."Job No.") then
            exit(ProjectRec."Description")
        else
            exit('');
    end;
}
