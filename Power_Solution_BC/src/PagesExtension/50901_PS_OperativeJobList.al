/// <summary>
/// PageExtension PS_OperativeJobLis (ID 50001) extends Record ARBVRNOperativeJobList.
/// </summary>
pageextension 50901 PS_OperativeJobList extends ARBVRNOperativeJobList
{
    layout
    {

        addlast(Control1)
        {

            field(ScheduleCostLCY; CL[4])
            {
                ApplicationArea = Jobs;
                Caption = 'Budget Cost';
                Editable = false;
                ToolTip = 'Specify the amount budgeted cost (LCY) of the job.';

                trigger OnDrillDown()
                begin
                    JobCalcStatistics.PS_ShowPlanningLine(0, true);
                end;
            }
            field(UsageCostLCYTotal; CL[8])
            {
                ApplicationArea = Jobs;
                Caption = 'Actual Cost';
                Editable = false;
                ToolTip = 'Specifies the total costs used for a job.';
                trigger OnDrillDown()
                begin
                    JobCalcStatistics.ShowLedgEntry(3, true);
                end;
            }
            field(BillablePriceLCYTotal; PL[12])
            {
                ApplicationArea = Jobs;
                Caption = 'Billable Price';
                Editable = false;
                ToolTip = 'Specifies the total billable price used for a job.';

                trigger OnDrillDown()
                var
                    IsHandled: Boolean;
                begin
                    IsHandled := false;
                    OnBeforeOnDrillDownBillablePriceLCYTotal(Rec, IsHandled);
                    if not IsHandled then
                        JobCalcStatistics.PS_ShowPlanningLine(0, false);
                end;
            }
            field(InvoicedPriceLCYTotal; PL[16])
            {
                ApplicationArea = Jobs;
                Caption = 'Invoiced Price';
                Editable = false;
                ToolTip = 'Specifies the total invoiced price of a job.';

                trigger OnDrillDown()
                var
                    IsHandled: Boolean;
                begin
                    IsHandled := false;
                    OnBeforeOnDrillDownInvoicedPriceLCYTotal(Rec, IsHandled);
                    if not IsHandled then
                        JobCalcStatistics.ShowLedgEntry(0, false);
                end;
            }
            field(Margen; PL[25])
            {
                ApplicationArea = Jobs;
                Caption = 'Prospected margin';
                Editable = false;
                ToolTip = 'Prospected margin percent';
                StyleExpr = StyleExprBudgetMargen;
            }
            field(MargenReal; PL[26])
            {
                ApplicationArea = Jobs;
                Caption = 'Real margin';
                Editable = false;
                ToolTip = 'Real margin percent';
                StyleExpr = StyleExprRealMargen;
            }
        }
        addfirst(factboxes)
        {

            part("PS Operational Statistics"; "PS Operational Statistics")
            {
                ApplicationArea = Jobs;
                SubPageLink = "No." = field("No.");
                Visible = true;
            }
        }

    }
    actions
    {
        addfirst(navigation)
        {
            action("FilterByStatus")
            {
                Caption = 'Filter Active Projects';
                Image = Filter;
                Promoted = true;
                PromotedCategory = Process; // Categoría "Process"
                PromotedOnly = true;
                ToolTip = 'Click to filter active projects';
                ApplicationArea = All;

                trigger OnAction()
                begin
                    //                ApplyFilterToActiveProjects();
                end;
            }
        }
    }


    trigger OnAfterGetRecord()
    begin
        Clear(JobCalcStatistics);
        JobCalcStatistics.JobCalculateCommonFilters(Rec);
        JobCalcStatistics.CalculateAmounts();
        JobCalcStatistics.GetLCYCostAmounts(CL);
        JobCalcStatistics.GetLCYPriceAmounts(PL);
        if pl[12] > 0 THEN
            Pl[25] := ((pl[12] - cl[4]) / pl[12]) * 100
        else
            Pl[25] := 0;
        if pl[16] > 0 THEN
            Pl[26] := ((pl[16] - cl[8]) / pl[16]) * 100
        else
            Pl[26] := 0;
        clear(StyleExprBudgetMargen);
        IF (PL[25] < 20) and (pl[25] > 0) then
            StyleExprBudgetMargen := 'Strong';
        IF (PL[25] <= 0) then
            StyleExprBudgetMargen := 'Unfavorable';
        IF (PL[25] > 30) then
            StyleExprBudgetMargen := 'Favorable';
        IF (PL[25] > 20) and (PL[25] <= 30) then
            StyleExprBudgetMargen := 'StrongAccent';
        IF (PL[26] < 20) and (pl[26] > 0) then
            StyleExprRealMargen := 'Strong';
        IF (PL[26] <= 0) then
            StyleExprRealMargen := 'Unfavorable';
        IF (PL[26] > 30) then
            StyleExprRealMargen := 'Favorable';
        IF (PL[26] > 20) and (PL[26] <= 30) then
            StyleExprRealMargen := 'StrongAccent';
    end;

    var
        JobCalcStatistics: Codeunit "PS Calculate Statistics";
        PlaceHolderLbl: Label 'Placeholder';
        CL: array[26] of Decimal;
        PL: array[26] of Decimal;
        StyleExprBudgetMargen: Text[20];
        StyleExprRealMargen: Text[20];

    local procedure ShowDetails()
    begin
        PAGE.Run(PAGE::"Job Card", Rec);
    end;

    [IntegrationEvent(true, false)]
    local procedure OnBeforeOnDrillDownBillablePriceLCY(var Job: Record Job; var IsHandled: Boolean);
    begin
    end;

    [IntegrationEvent(true, false)]
    local procedure OnBeforeOnDrillDownBillablePriceLCYTotal(var Job: Record Job; var IsHandled: Boolean);
    begin
    end;

    [IntegrationEvent(true, false)]
    local procedure OnBeforeOnDrillDownBillablePriceLCYGLAcc(var Job: Record Job; var IsHandled: Boolean);
    begin
    end;

    [IntegrationEvent(true, false)]
    local procedure OnBeforeOnDrillDownBillablePriceLCYItem(var Job: Record Job; var IsHandled: Boolean);
    begin
    end;

    [IntegrationEvent(true, false)]
    local procedure OnBeforeOnDrillDownInvoicedPriceLCYGLAcc(var Job: Record Job; var IsHandled: Boolean);
    begin
    end;

    [IntegrationEvent(true, false)]
    local procedure OnBeforeOnDrillDownInvoicedPriceLCYTotal(var Job: Record Job; var IsHandled: Boolean);
    begin
    end;

    [IntegrationEvent(true, false)]
    local procedure OnBeforeOnDrillDownInvoicedPriceLCYItem(var Job: Record Job; var IsHandled: Boolean);
    begin
    end;

    [IntegrationEvent(true, false)]
    local procedure OnBeforeOnDrillDownInvoicedPriceLCY(var Job: Record Job; var IsHandled: Boolean);
    begin
    end;

    trigger OnOpenPage()
    var
        DepartamentoFun: Codeunit "PS_UserDepartmentManagement";
        UserDepartment: Code[10];
        JobRec: Record Job;
        grp: Integer;
        ApplyJobFilter: Codeunit "ApplyJobFilter";
        RecRef: RecordRef;
        EmptyRecRef: RecordRef; // Referencia de registro vacía
        FieldId: Integer;
        LineFieldId: Integer;
        JobTypeFilter: Enum "PS_JobTypeEnum";
        UserSetupRec: Record "User Setup"; // Agregar referencia a la tabla User Setup
    begin
        // Asegurarse de que JobRec y Rec están inicializados y abiertos

        Error('El acceso a esta página está restringido.');
        grp := JobRec.FilterGroup;
        Rec.FilterGroup(10);
        UserDepartment := DepartamentoFun.PS_GetUserDepartment();
        if UserDepartment <> '' then
            Rec.SetRange(Rec."Global Dimension 1 Code", UserDepartment);
        JobRec.FilterGroup(grp);
        RecRef.GetTable(Rec); // Obtener la tabla en RecRef
        FieldId := 1; // ID del campo en la cabecera
        JobTypeFilter := JobTypeFilter::Operativo;

        // Configurar la referencia de registro vacía
        EmptyRecRef.GetTable(Rec);
        EmptyRecRef.Reset(); // Asegurar que esté vacía
        LineFieldId := 0; // ID de campo no relevante para la referencia vacía

        // Leer el registro de User Setup del usuario actual
        if UserSetupRec.Get(UserId()) then begin
            // Llamar al procedimiento ApplyFilter solo si "Project team filter" es verdadero
            if UserSetupRec."Project team filter" then
                ApplyJobFilter.ApplyFilter(RecRef, FieldId, JobTypeFilter, EmptyRecRef, LineFieldId);
        end else
            Error('No se encontró la configuración del usuario.');

        // Convertir el registro actual a RecordRef
        JobRec.FilterGroup(grp);
        RecRef.SetTable(Rec); // Establecer la tabla en RecRef
    end;
}
