pageextension 50922 "PS_Job Planning Lines Part" extends "Job Planning Lines Part"
{
    layout
    {
        addafter("Description")
        {
            field("ARBVRNAnaliticConcept"; Rec."ARBVRNAnaliticConcept")
            {
                ApplicationArea = All;
                Caption = 'Analytic Concept';
                ToolTip = 'Specifies the analytic concept.';
            }
        }

        modify("Unit Price")
        {
            Editable = not IsBudgetLine;
        }
        modify("Line Amount")
        {
            Editable = not IsBudgetLine;
        }
        modify("Total Price (LCY)")
        {
            Editable = not IsBudgetLine;
        }
        modify("Total Price")
        {
            Editable = not IsBudgetLine;
        }
        modify("Unit Cost")
        {
            Editable = not IsBillableLine;
        }
        modify("Total Cost (LCY)")
        {
            Editable = not IsBillableLine;
        }
        modify("Total Cost")
        {
            Editable = not IsBillableLine;
        }
    }

    var
        IsBudgetLine: Boolean;
        IsBillableLine: Boolean;

    trigger OnAfterGetRecord()
    begin
        IsBudgetLine := Rec."Line Type" = Rec."Line Type"::Budget;
        IsBillableLine := Rec."Line Type" = Rec."Line Type"::Billable;
    end;
}
