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
        PollUrl: Text;
        PollResp: HttpResponseMessage;
        PollBody: Text;
        SuccessPos: Integer;
        SuccessStr: Text;
        SuccessComma: Integer;
        SuccessCount: Integer;
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
                        // Si no hay body o no es conclusivo, hacemos polling a Supabase sync_executions
                        if (StrLen(RespBody) = 0) or (StrPos(RespBody, '"status":') = 0) then begin
                            // Construir URL: {Supabase REST URL}/sync_executions?company_name=eq.{Company}&order=finished_at.desc&limit=1
                            if (Setup."Supabase REST URL" <> '') and (Setup."Supabase API Key" <> '') then begin
                                PollUrl := Setup."Supabase REST URL" + '/sync_executions?company_name=eq.' + Queue."Company Name" + '&order=finished_at.desc&limit=1';
                                Http.DefaultRequestHeaders().Remove('apikey');
                                Http.DefaultRequestHeaders().Remove('Authorization');
                                Http.DefaultRequestHeaders().Add('apikey', Setup."Supabase API Key");
                                Http.DefaultRequestHeaders().Add('Authorization', 'Bearer ' + Setup."Supabase API Key");
                                if Http.Get(PollUrl, PollResp) then begin
                                    if PollResp.Content().ReadAs(PollBody) then begin
                                        // Guardar respuesta
                                        Queue."Last Response" := CopyStr(PollBody, 1, MaxStrLen(Queue."Last Response"));
                                        // Determinar estado a partir de JSON array con último registro
                                        if (StrPos(PollBody, '"status":"error"') > 0) or (StrPos(PollBody, '"status":"partial_error"') > 0) then begin
                                            Queue.Status := Queue.Status::Error;
                                            Queue."Last Error" := CopyStr(ExtractErrorSummary(PollBody), 1, MaxStrLen(Queue."Last Error"));
                                        end else begin
                                            Queue.Status := Queue.Status::Done;
                                        end;
                                        Queue."Processed At" := CurrentDateTime();
                                        Queue.Modify(true);
                                    end;
                                end;
                            end else begin
                                // Fallback: sin supabase config, usar 200 OK como Done
                                Queue.Status := Queue.Status::Done;
                                Queue."Processed At" := CurrentDateTime();
                                Queue.Modify(true);
                            end;
                        end else begin
                            // Body con status
                            if StrPos(RespBody, '"status":"error"') > 0 then begin
                                Queue.Status := Queue.Status::Error;
                                Queue."Last Error" := CopyStr(ExtractErrorSummary(RespBody), 1, MaxStrLen(Queue."Last Error"));
                            end else if StrPos(RespBody, '"status":"partial_error"') > 0 then begin
                                // partial_error es exitoso si hay al menos un éxito
                                if StrPos(RespBody, '"success":') > 0 then begin
                                    // Extraer número de éxitos
                                    SuccessPos := StrPos(RespBody, '"success":');
                                    if SuccessPos > 0 then begin
                                        SuccessStr := CopyStr(RespBody, SuccessPos + 9, 10);
                                        SuccessComma := StrPos(SuccessStr, ',');
                                        if SuccessComma > 0 then
                                            SuccessStr := CopyStr(SuccessStr, 1, SuccessComma - 1);
                                        if Evaluate(SuccessCount, SuccessStr) and (SuccessCount > 0) then begin
                                            Queue.Status := Queue.Status::Done;
                                            Queue."Last Error" := CopyStr(ExtractErrorSummary(RespBody), 1, MaxStrLen(Queue."Last Error"));
                                        end else begin
                                            Queue.Status := Queue.Status::Error;
                                            Queue."Last Error" := CopyStr(ExtractErrorSummary(RespBody), 1, MaxStrLen(Queue."Last Error"));
                                        end;
                                    end else begin
                                        Queue.Status := Queue.Status::Done;
                                        Queue."Last Error" := CopyStr(ExtractErrorSummary(RespBody), 1, MaxStrLen(Queue."Last Error"));
                                    end;
                                end else begin
                                    Queue.Status := Queue.Status::Done;
                                    Queue."Last Error" := CopyStr(ExtractErrorSummary(RespBody), 1, MaxStrLen(Queue."Last Error"));
                                end;
                            end else
                                Queue.Status := Queue.Status::Done;
                            Queue."Processed At" := CurrentDateTime();
                            Queue.Modify(true);
                        end;
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


