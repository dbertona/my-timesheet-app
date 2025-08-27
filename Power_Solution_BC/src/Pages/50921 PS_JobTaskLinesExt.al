pageextension 50921 PSJobTaskLinesExt extends "Job Task Lines"
{
    layout
    { 
        modify("Global Dimension 1 Code")
        {
            Editable = false;
        }

        addlast(Control1)
        {
        }
        addafter(Control1)
        {
            part("Job Planning Lines Part"; "Job Planning Lines Part")
            {
                Caption = 'Job Planning Line';
                ApplicationArea = All;
                visible = True;
                SubPageLink = "Job No." = FIELD("Job No."), "Job Task No." = FIELD("Job Task No.");
            }

        }

        modify("ARBVRNJobPlanningLine")
        {
            Visible = false;
        }
        addafter(Control1900383207)
        {
            part("PS_ProjectTaskResourceHours"; "PS_ProjectTaskResourceHours")
            {
                Caption = 'Total Hours Open Month';
                ApplicationArea = All;
                Visible = true;
                SubPageLink = "PS_JobNo." = FIELD("Job No."), "PS_JobTaskNo." = FIELD("Job Task No.");
            }
        }
    }

}
