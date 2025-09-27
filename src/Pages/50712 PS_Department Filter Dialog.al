page 50712 "PS_Department Filter Dialog"
{
    PageType = ConfirmationDialog;
    ApplicationArea = All;
    Caption = 'PS_Department Filter Dialog';
    layout
    {
        area(content)
        {
            group(Group)
            {
                field("Department Code"; DepartmentCode)
                {
                    ApplicationArea = All;
                }
            }
        }
    }

    actions
    {
        area(processing)
        {
            action("OK")
            {
                Caption = 'OK';
                ApplicationArea = All;
                trigger OnAction()
                begin
                    CurrPage.Close();
                end;
            }
            action("Cancel")
            {
                Caption = 'Cancel';
                ApplicationArea = All;
                trigger OnAction()
                begin
                    CurrPage.Close();
                end;
            }
        }
    }

    var
        DepartmentCode: Code[20];

    procedure GetDepartmentCode(): Code[20]
    begin
        exit(DepartmentCode);
    end;
}
