page 50152 "PS Job Planning Lines"
{
    PageType = List;
    SourceTable = "PS_JobPlanningLine";
    ApplicationArea = All;
    UsageCategory = Lists;

    layout
    {
        area(content)
        {
            repeater(Group)
            {
                field("PS_LineNo."; Rec."PS_LineNo.") { }
                field("PS_JobNo."; Rec."PS_JobNo.") { }
                field("PS_PlanningDate"; Rec."PS_PlanningDate") { }
                field("PS_DocumentNo."; Rec."PS_DocumentNo.") { }
                field(PS_Type; Rec.PS_Type) { }
                field("PS_No."; Rec."PS_No.") { }
                field(PS_Description; Rec.PS_Description) { }
                field(PS_Quantity; Rec.PS_Quantity) { }
                field("PS_DirectUnitCost(LCY)"; Rec."PS_DirectUnitCost(LCY)") { }
                field("PS_UnitCost(LCY)"; Rec."PS_UnitCost(LCY)") { }
                field("PS_TotalCost(LCY)"; Rec."PS_TotalCost(LCY)") { }
                field("PS_UnitPrice(LCY)"; Rec."PS_UnitPrice(LCY)") { }
                field("PS_TotalPrice(LCY)"; Rec."PS_TotalPrice(LCY)") { }
                field("PS_ResourceGroupNo."; Rec."PS_ResourceGroupNo.") { }
                field("PS_UnitofMeasureCode"; Rec."PS_UnitofMeasureCode") { }
                field("PS_LastDateModified"; Rec."PS_LastDateModified") { }
                field("PS_UserID"; Rec."PS_UserID") { }
                field("PS_WorkTypeCode"; Rec."PS_WorkTypeCode") { }
                field("PS_DocumentDate"; Rec."PS_DocumentDate") { }
                field("PS_JobTaskNo."; Rec."PS_JobTaskNo.") { }
                field("PS_LineType"; Rec."PS_LineType") { }
                field("PS_CurrencyCode"; Rec."PS_CurrencyCode") { }
                field("PS_CurrencyDate"; Rec."PS_CurrencyDate") { }
                field(PS_Status; Rec.PS_Status) { }
                field("PS_ClosingMonthCode"; Rec."PS_ClosingMonthCode") { }
                field("PS_% Probability"; Rec."PS_% Probability") { }
                field("PS_ProbabilizedPrice(LCY)"; Rec."PS_ProbabilizedPrice(LCY)") { }
                field("PS_ProbabilizedCost(LCY)"; Rec."PS_ProbabilizedCost(LCY)") { }
            }
        }
    }
}
