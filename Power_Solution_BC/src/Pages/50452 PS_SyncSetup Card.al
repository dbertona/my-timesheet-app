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
                field("Supabase REST URL"; Rec."Supabase REST URL")
                {
                    ApplicationArea = All;
                }
                field("Supabase API Key"; Rec."Supabase API Key")
                {
                    ApplicationArea = All;
                    ExtendedDatatype = Masked;
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
                    Err: Text;
                    RespBody: Text;
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
                        if Resp.Content().ReadAs(RespBody) then;
                        Msg := StrSubstNo('HTTP %1 %2', Format(Resp.HttpStatusCode), Resp.ReasonPhrase);
                        Message('%1\nURL: %2\nCuerpo: %3', Msg, Url, CopyStr(RespBody, 1, 250));
                    end else begin
                        Err := GetLastErrorText();
                        Message('Fallo al enviar la solicitud HTTP. URL: %1\nError: %2', Url, Err);
                    end;
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


