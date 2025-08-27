page 50722 "PS Operational Statistics"

{
    Caption = 'General project statistics';
    Editable = false;
    LinksAllowed = false;
    PageType = CardPart;
    SourceTable = Job;

    layout
    {
        area(content)
        {

            field(BillablePriceLCYTotal; PL[12])
            {
                ApplicationArea = Jobs;
                Caption = 'Budgeted sales amount';
                Editable = false;

                ToolTip = 'Specifies the total billable price used for a project.';

                trigger OnDrillDown()
                var
                    IsHandled: Boolean;
                begin
                    IsHandled := false;
                    OnBeforeOnDrillDownBillablePriceLCYTotal(Rec, IsHandled);
                    if not IsHandled then
                        JobCalcStatistics.ShowPlanningLine(0, false);
                end;
            }
            field(ScheduleCostLCYTotal; CL[4])
            {
                ApplicationArea = Jobs;
                Caption = 'Budgeted cost amount';
                Editable = false;
                ToolTip = 'Specifies the total budget cost of a project.';

                trigger OnDrillDown()
                begin
                    JobCalcStatistics.ShowPlanningLine(0, true);
                end;
            }
            field(InvoicedPriceLCYTotal; PL[16])
            {
                ApplicationArea = Jobs;
                Caption = 'Invoiced';
                Editable = false;
                ToolTip = 'Specifies the total invoiced price of a project.';

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
            field(UsageCostLCYTotal; CL[8])
            {
                ApplicationArea = Jobs;
                Caption = 'Consumption';
                Editable = false;
                ToolTip = 'Specifies the total costs used for a project.';

                trigger OnDrillDown()
                begin
                    JobCalcStatistics.ShowLedgEntry(0, true);
                end;
            }
            field(Expectedinitialdate; Localdate)
            {
                ApplicationArea = Jobs;
                Caption = 'Budget start date';
                Editable = false;
                ToolTip = 'Specifies the Budget start date for a project.';
            }
            field(Expectedinitialmarginporcetn; Localcalculations[5])
            {
                ApplicationArea = Jobs;
                Caption = '% Initial Budgeted Margin';
                Editable = false;
                ToolTip = 'Specifies the % budget margin for a project.';
            }
            field(Expectedinitialmargin; Localcalculations[6])
            {
                ApplicationArea = Jobs;
                Caption = 'Initial Budgeted Margin';
                Editable = false;
                ToolTip = 'Specifies the initial budgeted margin for a project.';
            }
            field(Expectedmarginporcet; Localcalculations[2])
            {
                ApplicationArea = Jobs;
                Caption = '% Current Budgeted Margin';
                Editable = false;
                ToolTip = 'Specifies the % budgeted margin for a project.';
            }
            field(Expectedmargin; Localcalculations[1])
            {
                ApplicationArea = Jobs;
                Caption = 'Current Budgeted Margin';
                Editable = false;
                ToolTip = 'Specifies the actual budgeted margin for a project.';
            }

            field(Expectedmarginporcent; Localcalculations[4])
            {
                ApplicationArea = Jobs;
                Caption = '% Real margin';
                Editable = false;
                ToolTip = 'Specifies the % Real margin for a project.';
            }
            field(Realmarginporcent; Localcalculations[3])
            {
                ApplicationArea = Jobs;
                Caption = 'Real margin';
                Editable = false;
                ToolTip = 'Specifies the Real margin for a project.';
            }


        }
    }
    var
        Localcalculations: array[6] of Decimal;
        CierresMensuales: Record PS_MonthClosing;
        LocalDate: text[7];
        i: Integer;


    trigger OnAfterGetCurrRecord()
    begin
        Clear(JobCalcStatistics);
        for i := 1 to 6 do
            Localcalculations[i] := 0;
        JobCalcStatistics.JobCalculateCommonFilters(Rec);
        JobCalcStatistics.CalculateAmounts();
        JobCalcStatistics.GetLCYCostAmounts(CL);
        JobCalcStatistics.GetLCYPriceAmounts(PL);
        Localcalculations[1] := PL[12] - cl[4];
        if pl[12] > 0 then
            Localcalculations[2] := ((PL[12] - cl[4]) / PL[12]) * 100;
        Localcalculations[3] := PL[16] - cl[8];
        if pl[16] > 0 then
            Localcalculations[4] := ((PL[16] - cl[8]) / PL[16]) * 100;
        CierresMensuales.SetRange(PS_JobNo, Rec."No.");
        CierresMensuales.SetRange(PS_Status, CierresMensuales.PS_Status::Close);
        if CierresMensuales.FINDSET() then begin
            REPEAT
                if CierresMensuales.PS_BillablePriceTotal > 0 then begin
                    Localcalculations[5] := ((CierresMensuales.PS_BillablePriceTotal - CierresMensuales.PS_CostTotal) / CierresMensuales.PS_BillablePriceTotal) * 100;
                    Localcalculations[6] := CierresMensuales.PS_BillablePriceTotal - CierresMensuales.PS_CostTotal;
                end;
                LocalDate := Format(CierresMensuales.PS_Year) + '-' + Format(CierresMensuales.PS_Month);
            until CierresMensuales.NEXT() = 0;
        END;

    end;


    var
        JobCalcStatistics: Codeunit "PS Calculate Statistics";
        PlaceHolderLbl: Label 'Placeholder';
        CL: array[24] of Decimal;
        PL: array[24] of Decimal;

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
