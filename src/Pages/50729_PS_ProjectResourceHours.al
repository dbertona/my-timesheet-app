page 50729 "PSProjectResourceHours"
{
    PageType = ListPart;
    SourceTable = "PSProjectResourceHours";
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
                field("Total Hours"; Rec."PS_TotalHours")
                {
                    ApplicationArea = All;
                    Caption = 'Hours';
                }
            }
            group(TotalGroup)
            {
                ShowCaption = false;

                field("Total Hours Sum"; rec."PS_JobTotalHours") // Campo para el total de horas
                {
                    ApplicationArea = All;
                    Caption = 'Total Hours';
                    Editable = false;
                }
            }
        }
    }
}
