/// <summary>
/// Page project Cost Factbox1 (ID 50704).
/// </summary>
page 50704 "PS Planning Statistics"
{
    Caption = 'Job Details';
    Editable = false;
    LinksAllowed = false;
    PageType = CardPart;
    SourceTable = Job;

    layout
    {
        area(content)
        {
            field("No."; Rec."No.")
            {
                ApplicationArea = Jobs;
                Caption = 'Project No.';
                ToolTip = 'Specifies the project number.';

                trigger OnDrillDown()
                begin
                    ShowDetails();
                end;
            }
            group("Budget Cost")
            {
                Caption = 'Budget Cost';
                field(PlaceHolderLbl; PlaceHolderLbl)
                {
                    ApplicationArea = Jobs;
                    Editable = false;
                    Enabled = false;
                    ToolTip = 'Specifies nothing.';
                    Visible = false;
                }
                field(ScheduleCostLCY; CL[1])
                {
                    ApplicationArea = Jobs;
                    Caption = 'Resource';
                    Editable = false;
                    ToolTip = 'Specifies the total budgeted cost of resources associated with this project.';

                    trigger OnDrillDown()
                    begin
                        JobCalcStatistics.PS_ShowPlanningLine(1, true);
                    end;
                }
                field(ScheduleCostLCYItem; CL[2])
                {
                    ApplicationArea = Jobs;
                    Caption = 'Item';
                    Editable = false;
                    ToolTip = 'Specifies the total budgeted cost of items associated with this project.';

                    trigger OnDrillDown()
                    begin
                        JobCalcStatistics.PS_ShowPlanningLine(2, true);
                    end;
                }
                field(ScheduleCostLCYGLAcc; CL[3])
                {
                    ApplicationArea = Jobs;
                    Caption = 'G/L Account';
                    Editable = false;
                    ToolTip = 'Specifies the total budgeted cost of general journal entries associated with this project.';

                    trigger OnDrillDown()
                    begin
                        JobCalcStatistics.PS_ShowPlanningLine(3, true);
                    end;
                }
                field(ScheduleCostLCYTotal; CL[4])
                {
                    ApplicationArea = Jobs;
                    Caption = 'Total';
                    Editable = false;
                    Style = Strong;
                    StyleExpr = TRUE;
                    ToolTip = 'Specifies the total budget cost of a project.';

                    trigger OnDrillDown()
                    begin
                        JobCalcStatistics.PS_ShowPlanningLine(0, true);
                    end;
                }
            }

            group("Billable Price")
            {
                Caption = 'Billable Price';
                field(Placeholder3; PlaceHolderLbl)
                {
                    ApplicationArea = Jobs;
                    Editable = false;
                    Enabled = false;
                    ToolTip = 'Specifies nothing.';
                    Visible = false;
                }
                field(BillablePriceLCY; PL[9])
                {
                    ApplicationArea = Jobs;
                    Caption = 'Resource';
                    Editable = false;
                    ToolTip = 'Specifies the total billable price of resources associated with this job.';

                    trigger OnDrillDown()
                    var
                        IsHandled: Boolean;
                    begin
                        IsHandled := false;
                        OnBeforeOnDrillDownBillablePriceLCY(Rec, IsHandled);
                        if not IsHandled then
                            JobCalcStatistics.PS_ShowPlanningLine(1, false);
                    end;
                }
                field(BillablePriceLCYItem; PL[10])
                {
                    ApplicationArea = Jobs;
                    Caption = 'Item';
                    Editable = false;
                    ToolTip = 'Specifies the total billable price of items associated with this project.';

                    trigger OnDrillDown()
                    var
                        IsHandled: Boolean;
                    begin
                        IsHandled := false;
                        OnBeforeOnDrillDownBillablePriceLCYItem(Rec, IsHandled);
                        if not IsHandled then
                            JobCalcStatistics.PS_ShowPlanningLine(2, false);
                    end;
                }
                field(BillablePriceLCYGLAcc; PL[11])
                {
                    ApplicationArea = Jobs;
                    Caption = 'G/L Account';
                    Editable = false;
                    ToolTip = 'Specifies the total billable price for project planning lines of type G/L account.';

                    trigger OnDrillDown()
                    var
                        IsHandled: Boolean;
                    begin
                        IsHandled := false;
                        OnBeforeOnDrillDownBillablePriceLCYGLAcc(Rec, IsHandled);
                        if not IsHandled then
                            JobCalcStatistics.PS_ShowPlanningLine(3, false);
                    end;
                }
                field(BillablePriceLCYTotal; PL[12])
                {
                    ApplicationArea = Jobs;
                    Caption = 'Total';
                    Editable = false;
                    Style = Strong;
                    StyleExpr = TRUE;
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
            }
            group("Budget Cost Probability")
            {
                Caption = 'Budget Cost by Probability ';
                field(PlaceHolderLblProb; PlaceHolderLbl)
                {
                    ApplicationArea = Jobs;
                    Editable = false;
                    Enabled = false;
                    ToolTip = 'Specifies nothing.';
                    Visible = false;
                }
                field(ScheduleCostLCYProb; CL[17])
                {
                    ApplicationArea = Jobs;
                    Caption = 'Resource';
                    Editable = false;
                    ToolTip = 'Specifies the total budgeted cost of resources associated with this project. by Probability';

                    trigger OnDrillDown()
                    begin
                        JobCalcStatistics.PS_ShowPlanningLine(1, true);
                    end;
                }
                field(ScheduleCostLCYItemProb; CL[18])
                {
                    ApplicationArea = Jobs;
                    Caption = 'Item';
                    Editable = false;
                    ToolTip = 'Specifies the total budgeted cost of items associated with this project. by Probability';

                    trigger OnDrillDown()
                    begin
                        JobCalcStatistics.PS_ShowPlanningLine(2, true);
                    end;
                }
                field(ScheduleCostLCYGLAccProb; CL[19])
                {
                    ApplicationArea = Jobs;
                    Caption = 'G/L Account';
                    Editable = false;
                    ToolTip = 'Specifies the total budgeted cost of general journal entries associated with this project. by Probability';

                    trigger OnDrillDown()
                    begin
                        JobCalcStatistics.PS_ShowPlanningLine(3, true);
                    end;
                }
                field(ScheduleCostLCYTotalProb; CL[20])
                {
                    ApplicationArea = Jobs;
                    Caption = 'Total';
                    Editable = false;
                    Style = Strong;
                    StyleExpr = TRUE;
                    ToolTip = 'Specifies the total budget cost of a project.';

                    trigger OnDrillDown()
                    begin
                        JobCalcStatistics.PS_ShowPlanningLine(0, true);
                    end;
                }
            }
            group("Billable Price Prob")
            {
                Caption = 'Billable Price by probability';
                field(Placeholder3Prob; PlaceHolderLbl)
                {
                    ApplicationArea = Jobs;
                    Editable = false;
                    Enabled = false;
                    ToolTip = 'Specifies nothing.';
                    Visible = false;
                }
                field(BillablePriceLCYProb; PL[21])
                {
                    ApplicationArea = Jobs;
                    Caption = 'Resource';
                    Editable = false;
                    ToolTip = 'Specifies the total billable price of resources associated with this project by probability.';

                    trigger OnDrillDown()
                    var
                        IsHandled: Boolean;
                    begin
                        IsHandled := false;
                        OnBeforeOnDrillDownBillablePriceLCY(Rec, IsHandled);
                        if not IsHandled then
                            JobCalcStatistics.PS_ShowPlanningLine(1, false);
                    end;
                }
                field(BillablePriceLCYItemProb; PL[22])
                {
                    ApplicationArea = Jobs;
                    Caption = 'Item';
                    Editable = false;
                    ToolTip = 'Specifies the total billable price of items associated with this project by probability.';

                    trigger OnDrillDown()
                    var
                        IsHandled: Boolean;
                    begin
                        IsHandled := false;
                        OnBeforeOnDrillDownBillablePriceLCYItem(Rec, IsHandled);
                        if not IsHandled then
                            JobCalcStatistics.PS_ShowPlanningLine(2, false);
                    end;
                }
                field(BillablePriceLCYGLAccProb; PL[23])
                {
                    ApplicationArea = Jobs;
                    Caption = 'G/L Account';
                    Editable = false;
                    ToolTip = 'Specifies the total billable price for project planning lines of type G/L account by probability.';

                    trigger OnDrillDown()
                    var
                        IsHandled: Boolean;
                    begin
                        IsHandled := false;
                        OnBeforeOnDrillDownBillablePriceLCYGLAcc(Rec, IsHandled);
                        if not IsHandled then
                            JobCalcStatistics.PS_ShowPlanningLine(3, false);
                    end;
                }
                field(BillablePriceLCYTotalProb; PL[24])
                {
                    ApplicationArea = Jobs;
                    Caption = 'Total';
                    Editable = false;
                    Style = Strong;
                    StyleExpr = TRUE;
                    ToolTip = 'Specifies the total billable price used for a project by probability.';

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
            }
            group("Margen")
            {
                Caption = 'Margin';
                field(Placeholder4; PlaceHolderLbl)
                {
                    ApplicationArea = Jobs;
                    Editable = false;
                    Enabled = false;
                    ToolTip = 'Specifies nothing.';
                    Visible = false;
                }
                field(MargenGroup; PL[25])
                {
                    ApplicationArea = Jobs;
                    Caption = 'Margin percent';
                    Style = Strong;
                    StyleExpr = TRUE;
                    Editable = false;
                    ToolTip = 'Specifies the % Real margin for a project.';

                    // trigger OnDrillDown()
                    // var
                    //     IsHandled: Boolean;
                    // begin
                    //     IsHandled := false;
                    //     OnBeforeOnDrillDownBillablePriceLCY(Rec, IsHandled);
                    //     if not IsHandled then
                    //         JobCalcStatistics.PS_ShowPlanningLine(1, false);
                    // end;
                }
            }
        }
    }

    actions
    {
    }

    trigger OnAfterGetCurrRecord()
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
    end;

    var
        JobCalcStatistics: Codeunit "PS Calculate Statistics";
        ARBjobCalStatics: Codeunit "ARBVRNVERONAJobCalcStatistics";
        PlaceHolderLbl: Label 'Placeholder';
        CL: array[25] of Decimal;
        PL: array[25] of Decimal;

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
