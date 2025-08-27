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

        // Reemplazo del control de Line Type por uno auxiliar con valores limitados
        addafter("Line Type")
        {
            field("PS Line Type"; AuxLineType)
            {
                ApplicationArea = All;
                Caption = 'Line Type';
                ToolTip = 'Specifies the line type.';

                trigger OnValidate()
                begin
                    case AuxLineType of
                        AuxLineType::Budget:
                            Rec.Validate("Line Type", Rec."Line Type"::Budget);
                        AuxLineType::Billable:
                            Rec.Validate("Line Type", Rec."Line Type"::Billable);
                    end;

                    IsBudgetLine := AuxLineType = AuxLineType::Budget;
                    IsBillableLine := AuxLineType = AuxLineType::Billable;
                end;
            }
        }

        modify("Line Type")
        {
            Visible = false;
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
        AuxLineType: Option Budget,Billable;

    trigger OnAfterGetRecord()
    begin
        IsBudgetLine := Rec."Line Type" = Rec."Line Type"::Budget;
        IsBillableLine := Rec."Line Type" = Rec."Line Type"::Billable;

        case Rec."Line Type" of
            Rec."Line Type"::Budget:
                AuxLineType := AuxLineType::Budget;
            Rec."Line Type"::Billable:
                AuxLineType := AuxLineType::Billable;
            else
                AuxLineType := AuxLineType::Budget;
        end;
    end;
}
