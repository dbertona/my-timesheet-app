codeunit 50442 "PS_Analytics SyncWorker"
{
    SingleInstance = true;

    trigger OnRun()
    begin
        // Permite que el Job Queue ejecute el codeunit sin especificar método
        RunSync();
    end;

    local procedure ExtractErrorSummary(JsonText: Text): Text
    var
        StartPos: Integer;
        EndPos: Integer;
        Summary: Text;
    begin
        // Extrae resumen de errores del JSON: busca "details" y construye lista de entidades con error
        // Ejemplo: "proyectos (timeout), movimientos (constraint)"
        Summary := '';

        // Buscar entidades con "status":"error" en el JSON
        StartPos := StrPos(JsonText, '"details"');
        if StartPos > 0 then begin
            // Simplificado: devuelve primeros 500 caracteres de details
            EndPos := StrPos(CopyStr(JsonText, StartPos, StrLen(JsonText) - StartPos + 1), '}');
            if EndPos > 0 then
                Summary := CopyStr(JsonText, StartPos, EndPos);
        end;

        if Summary = '' then
            Summary := 'Ver Last Response para detalle completo';

        exit(Summary);
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
        RespBody: Text;
        DebounceSec: Integer;
        NowDT: DateTime;
        DebounceDur: Duration;
        StatusCode: Integer;
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
                    StatusCode := Resp.HttpStatusCode();
                    Queue."Http Status Code" := StatusCode;

                    if Resp.Content().ReadAs(RespBody) then
                        Queue."Last Response" := CopyStr(RespBody, 1, MaxStrLen(Queue."Last Response"));

                    if Resp.IsSuccessStatusCode() then begin
                        // Parsear "status" del JSON: si contiene "error" → marcar Error
                        if (StrPos(RespBody, '"status":"error"') > 0) or (StrPos(RespBody, '"status":"partial_error"') > 0) then begin
                            Queue.Status := Queue.Status::Error;
                            Queue."Last Error" := CopyStr(ExtractErrorSummary(RespBody), 1, MaxStrLen(Queue."Last Error"));
                        end else begin
                            Queue.Status := Queue.Status::Done;
                        end;
                        Queue."Processed At" := CurrentDateTime();
                        Queue.Modify(true);
                    end else begin
                        Queue.Status := Queue.Status::Error;
                        Queue."Last Error" := CopyStr(Resp.ReasonPhrase(), 1, MaxStrLen(Queue."Last Error"));
                        Queue.Attempts := Queue.Attempts + 1;
                        Queue.Modify(true);
                    end;
                end else begin
                    Queue.Status := Queue.Status::Error;
                    Queue."Last Error" := CopyStr(GetLastErrorText(), 1, MaxStrLen(Queue."Last Error"));
                    Queue.Attempts := Queue.Attempts + 1;
                    Queue.Modify(true);
                end;
            until Queue.Next() = 0;
    end;
}


