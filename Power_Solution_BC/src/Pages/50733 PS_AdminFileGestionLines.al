page 50733 "PS_AdminFileGestionLines"
{
    AutoSplitKey = true;
    Caption = 'Project Planning Lines';
    PageType = List;
    SourceTable = "ARBVRNJobUnitPlanning";
    ApplicationArea = All;
    UsageCategory = Lists;
    Editable = False;

    layout
    {
        area(content)
        {
            repeater(Control1)
            {
                ShowCaption = false;
                field("Job No."; Rec.ARBVRNJobNo)
                {
                    ApplicationArea = All;
                    Caption = 'Job No.';
                    Visible = false;
                }
                field("Job Unit No."; Rec.ARBVRNJobUnitNo)
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the corresponding project unit to which the sales budget corresponds.';
                }
                field("Description"; Rec.ARBVRNDescriptionExtend)
                {
                    ApplicationArea = All;
                    Caption = 'Description';
                    Visible = false;
                }
                field("Planning Date"; Rec.ARBVRNPlanningDate)
                {
                    Caption = 'Planning Date';
                    ApplicationArea = Jobs;
                    ToolTip = 'Specifies the date of the planning line.';
                }
                field("CertificationQuantity"; Rec.ARBVRNCertificationQuantity)
                {
                    ApplicationArea = Jobs;
                    ToolTip = 'Specifies the planning Quantity.';
                    Caption = 'Certification Quantity';
                }
                field("Certification Amount"; Rec.ARBVRNCertificationAmountLCY)
                {
                    ApplicationArea = Jobs;
                    ToolTip = 'Specifies the planning Amount.';
                    Caption = 'Certification Amount';
                }
            }
        }
        area(factboxes)
        {
        }
    }
}
