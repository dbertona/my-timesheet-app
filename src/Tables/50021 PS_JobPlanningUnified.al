table 50021 "PS_JobPlanningUnified"
{
    Caption = 'Unificación Planificación Proyecto';
    DataClassification = ToBeClassified;

    fields
    {
        field(1; "PS_JobNo"; Code[20]) { Caption = 'Job No.'; }
        field(2; "PS_JobTaskNo"; Code[20]) { Caption = 'Job Task No.'; }
        field(3; "PS_LineNo"; Integer) { Caption = 'Line No.'; }
        field(4; "PS_PlanningDate"; Date) { Caption = 'Planning Date'; }
        field(5; "PS_DocumentNo"; Code[20]) { Caption = 'Document No.'; }
        field(6; "PS_Type"; Enum "Job Planning Line Type") { Caption = 'Type'; }
        field(7; "PS_No"; Code[20]) { Caption = 'No.'; }
        field(8; "PS_Description"; Text[100]) { Caption = 'Description'; }
        field(9; "PS_Quantity"; Decimal) { Caption = 'Quantity'; DecimalPlaces = 0 : 5; }
        field(10; "PS_DirectUnitCost(LCY)"; Decimal) { Caption = 'Direct Unit Cost (LCY)'; }
        field(11; "PS_UnitCost(LCY)"; Decimal) { Caption = 'Unit Cost (LCY)'; }
        field(12; "PS_TotalCost(LCY)"; Decimal) { Caption = 'Total Cost (LCY)'; }
        field(13; "PS_UnitPrice(LCY)"; Decimal) { Caption = 'Unit Price (LCY)'; }
        field(14; "PS_TotalPrice(LCY)"; Decimal) { Caption = 'Total Price (LCY)'; }
        field(15; "PS_ResourceGroupNo"; Code[20]) { Caption = 'Resource Group No.'; }
        field(16; "PS_UnitofMeasureCode"; Code[10]) { Caption = 'Unit of Measure Code'; }
        field(17; "PS_LastDateModified"; Date) { Caption = 'Last Date Modified'; }
        field(18; "PS_UserID"; Code[50]) { Caption = 'User ID'; }
        field(19; "PS_WorkTypeCode"; Code[10]) { Caption = 'Work Type Code'; }
        field(20; "PS_DocumentDate"; Date) { Caption = 'Document Date'; }
        field(21; "PS_LineType"; Enum "Job Planning Line Line Type") { Caption = 'Line Type'; }
        field(22; "PS_CurrencyCode"; Code[10]) { Caption = 'Currency Code'; }
        field(23; "PS_CurrencyDate"; Date) { Caption = 'Currency Date'; }
        field(24; "PS_Status"; Enum "Job Planning Line Status") { Caption = 'Status'; }
        field(25; "PS_ClosingMonthCode"; Code[20]) { Caption = 'Closing Month Code'; }
        field(26; "PS_% Probability"; Option)
        {
            Caption = '% Probability';
            OptionMembers = "0","10","30","50","70","90";
        }
        field(27; "PS_ProbabilizedPrice(LCY)"; Decimal) { Caption = 'Probabilized Price (LCY)'; }
        field(28; "PS_ProbabilizedCost(LCY)"; Decimal) { Caption = 'Probabilized Cost (LCY)'; }

        // Campo adicional para indicar origen del dato
        field(29; "PS_PlanningType"; Option)
        {
            Caption = 'Planning Type';
            OptionMembers = PlanningLine,UnitPlanning;
        }
    }

    keys
    {
        key(PK; "PS_JobNo", "PS_JobTaskNo", "PS_LineNo", "PS_PlanningType", "PS_ClosingMonthCode")
        {
            Clustered = true;
        }
    }
}
