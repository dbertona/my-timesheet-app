/// <summary>
/// PageExtension PS_OperativeJobLis (ID 50001) extends Record ARBVRNOperativeJobList.
/// </summary>
pageextension 50909 "PS_User Setup" extends "User Setup"
{

    layout
    {
        addlast(Control1)
        {

            field("Project team filter"; Rec."Project team filter")
            {
                ApplicationArea = Jobs;
                Caption = 'Project team filter';
                Editable = true;
                ToolTip = 'Specifies whether filters are applied by project team.';
            }
        }
    }
}
