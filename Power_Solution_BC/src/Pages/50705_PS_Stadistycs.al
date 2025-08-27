/// <summary>
/// Page PS_stadisty (ID 50705).
/// </summary>
page 50705 PS_Stadistycs
{
    AdditionalSearchTerms = 'Projects, Projects List, Stadistycs';
    ApplicationArea = Jobs;
    Caption = 'Proyect Stadistycs';
    CardPageID = "ARBVRNOperativeJobCard";
    Editable = false;
    PageType = List;
    QueryCategory = 'Job List';
    SourceTable = job;
    UsageCategory = Lists;

    SourceTableView = sorting("No.") order(descending)
                      where("status" = filter('Open'), ARBVRNJobType = filter('Operativo'));


    layout
    {
        area(content)
        {
            repeater(General)
            {
                field("No."; Rec."No.")
                {
                    ToolTip = 'Specifies the project number.';
                }
                field(Description; Rec.Description)
                {
                    ToolTip = 'Specifies a short description of the job.';
                }
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
}


