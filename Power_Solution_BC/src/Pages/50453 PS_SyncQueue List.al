page 50453 "PS_SyncQueue List"
{
    PageType = List;
    SourceTable = "PS_SyncQueue";
    ApplicationArea = All;
    UsageCategory = Administration;
    Caption = 'PS Sync Queue';

    layout
    {
        area(content)
        {
            repeater(Group)
            {
                field("ID"; Rec."ID")
                {
                    ApplicationArea = All;
                }
                field("Company Name"; Rec."Company Name")
                {
                    ApplicationArea = All;
                }
                field("Entity"; Rec."Entity")
                {
                    ApplicationArea = All;
                }
                field("Event Type"; Rec."Event Type")
                {
                    ApplicationArea = All;
                }
                field("Status"; Rec."Status")
                {
                    ApplicationArea = All;
                }
                field("Attempts"; Rec."Attempts")
                {
                    ApplicationArea = All;
                }
                field("Created At"; Rec."Created At")
                {
                    ApplicationArea = All;
                }
                field("Processed At"; Rec."Processed At")
                {
                    ApplicationArea = All;
                }
                field("Http Status Code"; Rec."Http Status Code")
                {
                    ApplicationArea = All;
                }
                field("Last Response"; Rec."Last Response")
                {
                    ApplicationArea = All;
                    Visible = false;
                }
                field("Last Error"; Rec."Last Error")
                {
                    ApplicationArea = All;
                }
                field("Payload"; Rec."Payload")
                {
                    ApplicationArea = All;
                    Visible = false;
                }
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(ProcessNow)
            {
                ApplicationArea = All;
                Caption = 'Procesar ahora';
                Image = Start;
                trigger OnAction()
                var
                    Worker: Codeunit "PS_Analytics SyncWorker";
                begin
                    Worker.RunSync();
                end;
            }

            action(MarkPending)
            {
                ApplicationArea = All;
                Caption = 'Marcar como Pendiente';
                Image = ReOpen;
                trigger OnAction()
                begin
                    Rec.Status := Rec.Status::Pending;
                    Rec.Modify(true);
                end;
            }

            action(MarkDone)
            {
                ApplicationArea = All;
                Caption = 'Marcar como Hecho';
                Image = Approve;
                trigger OnAction()
                begin
                    Rec.Status := Rec.Status::Done;
                    Rec."Processed At" := CurrentDateTime();
                    Rec.Modify(true);
                end;
            }

            action(ViewDetails)
            {
                ApplicationArea = All;
                Caption = 'Ver detalle';
                Image = ViewDetails;
                trigger OnAction()
                var
                    Details: Text;
                begin
                    Details := 'HTTP Status: ' + Format(Rec."Http Status Code") + '\n\n' +
                        'Last Response:\n' + Rec."Last Response" + '\n\n' +
                        'Last Error:\n' + Rec."Last Error";
                    Message(Details);
                end;
            }
        }
    }
}


