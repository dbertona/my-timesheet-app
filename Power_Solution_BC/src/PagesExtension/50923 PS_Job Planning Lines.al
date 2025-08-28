pageextension 50923 "PS_Job Planning Lines" extends "Job Planning Lines"
{
    layout
    {
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
                end;
            }
        }

        modify("Line Type")
        {
            Visible = false;
        }
    }

    var
        AuxLineType: Enum "PS_AuxLineType";

    trigger OnAfterGetRecord()
    begin
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





