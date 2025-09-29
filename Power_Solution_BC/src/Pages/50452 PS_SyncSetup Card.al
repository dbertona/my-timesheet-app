page 50452 "PS_SyncSetup Card"
{
    PageType = Card;
    SourceTable = "PS_SyncSetup";
    ApplicationArea = All;
    UsageCategory = Administration;
    Caption = 'PS Sync Setup';

    layout
    {
        area(content)
        {
            group(General)
            {
                field("Webhook URL"; Rec."Webhook URL")
                {
                    ApplicationArea = All;
                }
                field("API Key"; Rec."API Key")
                {
                    ApplicationArea = All;
                    ExtendedDatatype = Masked;
                }
                field("Debounce Seconds"; Rec."Debounce Seconds")
                {
                    ApplicationArea = All;
                }
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(TestWebhook)
            {
                ApplicationArea = All;
                Caption = 'Probar Webhook';
                Image = SendTo;
                Promoted = true;
                PromotedCategory = Process;

                trigger OnAction()
                var
                    Http: HttpClient;
                    Resp: HttpResponseMessage;
                    Cnt: HttpContent;
                    Hdr: HttpHeaders;
                    Url: Text;
                    Body: Text;
                    Msg: Text;
                begin
                    // Usar el registro actual (Rec); no llamar a Get()
                    Url := Rec."Webhook URL";
                    if Url = '' then begin
                        Message('Configura primero la Webhook URL.');
                        exit;
                    end;

                    Body := '{"source":"bc","test":true,"companyName":"' + CompanyName() + '"}';
                    Cnt.WriteFrom(Body);
                    Cnt.GetHeaders(Hdr);
                    Hdr.Remove('Content-Type');
                    Hdr.Add('Content-Type', 'application/json');
                    if Rec."API Key" <> '' then
                        Hdr.Add('X-API-Key', Rec."API Key");

                    if Http.Post(Url, Cnt, Resp) then begin
                        Msg := StrSubstNo('HTTP %1 %2', Format(Resp.HttpStatusCode), Resp.ReasonPhrase);
                    end else begin
                        Msg := StrSubstNo('Fallo al enviar la solicitud HTTP: %1', GetLastErrorText());
                    end;

                    Message('%1\nURL: %2', Msg, Url);
                end;
            }
        }
    }

    trigger OnOpenPage()
    begin
        if not Rec.FindFirst() then begin
            Rec.Init();
            Rec.Insert(true);
        end;
    end;
}


