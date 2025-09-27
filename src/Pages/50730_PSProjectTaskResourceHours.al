page 50730 "PS_ProjectTaskResourceHours"
{
    PageType = ListPart;
    SourceTable = "PS_ProjectTaskResourceHours";
    ApplicationArea = All;
    Caption = 'Project Resource Hours';
    Editable = False;

    layout
    {
        area(content)
        {
            repeater(Group)
            {
                field("Resource Name"; Rec."PS_ResourceName")
                {
                    ApplicationArea = All;
                    Caption = 'Resource Name';
                }
                field("Total Hours"; Rec."PS_JobandTaskTotalHours")
                {
                    ApplicationArea = All;
                    Caption = 'Hours';
                }
            }
            group(TotalGroup)
            {
                ShowCaption = false;

                field("Total Hours Open Month"; rec."PS_OpenMonthHours") // Campo para el total de horas
                {
                    ApplicationArea = All;
                    Caption = 'Total Hours';
                    Editable = false;
                }
            }
        }
    }

    trigger OnOpenPage()

    begin
        rec.SetFilter(rec.PS_JobandTaskTotalHours, '<> 0');
    end;
}
