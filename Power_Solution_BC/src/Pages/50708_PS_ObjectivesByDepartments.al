page 50708 PS_ObjectivesByDepartments
{
    ApplicationArea = All;
    Caption = 'Objectives By Departments';
    AdditionalSearchTerms = 'Objectives By Departments';
    PageType = List;
    SourceTable = PS_ObjectivesByDepartments;
    UsageCategory = Administration;
    Editable = true;

    layout
    {
        area(content)
        {
            repeater(Control1)
            {
                Caption = 'General';

                field(PS_JobNo; Rec.PS_Departments)
                {
                    ToolTip = 'Code of the project that will be closed.';
                }
                field(Year; Rec.PS_Year)
                {
                    ToolTip = 'Description of the project that will be closed.';
                }
                field("Cost Target"; Rec."PS_Cost Target")
                {
                    ToolTip = 'Objective to achieve in cost.';
                }
                field("Billing Target"; Rec."PS_Billing Target")
                {
                    ToolTip = 'Objective to achieve in billing.';
                }
                field("Margin Target"; Rec."PS_Margin Target")
                {
                    ToolTip = 'Objectives to achieve in margin.';
                }
            }
        }
    }
}