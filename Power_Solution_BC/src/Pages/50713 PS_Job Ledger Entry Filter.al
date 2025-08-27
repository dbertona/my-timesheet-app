page 50713 "Job Ledger Entry Filter"
{
    PageType = Card;
    ApplicationArea = All;
    UsageCategory = Lists;
    Caption = 'Payroll Adjustment';

    layout
    {
        area(content)
        {
            group(Filtros)
            {
                field("Fecha de Registro"; PostingDate)
                {
                    ApplicationArea = All;
                    Importance = Promoted;
                }
                field("Fecha de Inicio"; StartDate)
                {
                    ApplicationArea = All;
                    Importance = Promoted;
                }
                field("Fecha de fin"; EndDate)
                {
                    ApplicationArea = All;
                    Importance = Promoted;
                }
                field("Departamento"; DepartmentCode)
                {
                    ApplicationArea = All;
                    Importance = Promoted;
                    TableRelation = "Dimension Value".Code WHERE("Global Dimension No." = CONST(1), "Dimension Code" = CONST('DPTO')); // Removed to allow custom filtering
                }
                field("Porcentaje Previsión de indemnización"; FormattedForecastPercentage)
                {
                    ApplicationArea = All;
                    Importance = Promoted;
                    AutoFormatType = 10;
                    AutoFormatExpression = '<precision, 2:2><standard format,0>%';
                    Editable = true;
                    trigger OnValidate()
                    begin
                        FormattedForecastPercentage := ROUND(FormattedForecastPercentage / 100, 0.01);
                    end;
                }
            }
        }
    }

    actions
    {
        area(processing)
        {
            action("calculate adjustments")
            {
                Caption = 'Calculate adjustments ';
                ApplicationArea = All;
                Image = Process;
                Promoted = true; // Promueve la acción para que aparezca fuera del menú
                PromotedCategory = Process; // Categoría de promoción
                PromotedOnly = true;
                trigger OnAction()
                var
                    JobLedgerEntryPage: Page "PS_Job Ledger Entry Payroll";
                begin
                    JobLedgerEntryPage.SetFilterDates(StartDate, EndDate);
                    JobLedgerEntryPage.SetFilterDepartment(DepartmentCode);
                    JobLedgerEntryPage.SetFilterForecastPercentage(FormattedForecastPercentage);
                    JobLedgerEntryPage.SetFilterPostingDate(PostingDate);
                    JobLedgerEntryPage.Run();
                end;
            }
        }
    }

    var
        RegisterDate: Date;
        StartDate: Date;
        EndDate: Date;
        DepartmentCode: Text; // Change to Text to allow ranges and wildcards
        ForecastPercentage: Decimal;
        FormattedForecastPercentage: Decimal;
        PostingDate: Date;
}
