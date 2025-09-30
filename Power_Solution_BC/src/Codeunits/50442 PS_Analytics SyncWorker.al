codeunit 50442 "PS_Analytics SyncWorker"
{
    SingleInstance = true;

    trigger OnRun()
    begin
        // Permite que el Job Queue ejecute el codeunit sin especificar método
        RunSync();
    end;

    procedure RunSync()
    var
        Queue: Record "PS_SyncQueue";
        Setup: Record "PS_SyncSetup";
        Http: HttpClient;
        Resp: HttpResponseMessage;
        Cnt: HttpContent;
        Hdr: HttpHeaders;
        Url: Text;
        Body: Text;
        DebounceSec: Integer;
        NowDT: DateTime;
        DebounceDur: Duration;
    begin
        if not Setup.FindFirst() then begin
            exit;
        end;

        DebounceSec := Setup."Debounce Seconds";
        if DebounceSec <= 0 then
            DebounceSec := 60;

        NowDT := CurrentDateTime();
        DebounceDur := DebounceSec * 1000; // segundos → duración en ms

        Queue.Reset();
        Queue.SetRange(Status, Queue.Status::Pending);
        if Queue.FindSet() then
            repeat
                // Debounce por compañía+entidad: procesa si han pasado DebounceSec desde la creación
                if NowDT < (Queue."Created At" + DebounceDur) then
                    continue;

                Url := Setup."Webhook URL";
                if Url = '' then
                    exit;

                Body := '{' +
                    '"companyName":"' + Queue."Company Name" + '",' +
                    '"entity":"' + Queue.Entity + '"' +
                    '}';

                Cnt.Clear();
                Cnt.WriteFrom(Body);
                Cnt.GetHeaders(Hdr);
                Hdr.Remove('Content-Type');
                Hdr.Add('Content-Type', 'application/json');
                if Setup."API Key" <> '' then
                    Hdr.Add('X-API-Key', Setup."API Key");

                Queue.Status := Queue.Status::Processing;
                Queue.Modify(true);

                if Http.Post(Url, Cnt, Resp) then begin
                    if Resp.IsSuccessStatusCode() then begin
                        Queue.Status := Queue.Status::Done;
                        Queue."Processed At" := CurrentDateTime();
                        Queue.Modify(true);
                    end else begin
                        Queue.Status := Queue.Status::Error;
                        Queue.Attempts := Queue.Attempts + 1;
                        Queue.Modify(true);
                    end;
                end else begin
                    Queue.Status := Queue.Status::Error;
                    Queue.Attempts := Queue.Attempts + 1;
                    Queue.Modify(true);
                end;
            until Queue.Next() = 0;
    end;
}


