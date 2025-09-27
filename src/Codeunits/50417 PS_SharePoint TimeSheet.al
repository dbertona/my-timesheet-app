/* codeunit 50417 "Ps SharePoint TimeSheet"
{
    procedure LoadSharePointData(var TempList: Record "PS PowerApp" temporary; Token: Text)
    var
        HttpClient: HttpClient;
        HttpRequestMessage: HttpRequestMessage;
        HttpResponseMessage: HttpResponseMessage;
        HttpHeaders: HttpHeaders;
        JsonObject: JsonObject;
        JsonToken: JsonToken;
        JsonArray: JsonArray;
        Item: JsonObject;
        ResponseText: Text;
        IdValue: JsonToken;
        TitleValue: JsonToken;
        ResourceNoValue: JsonToken;
        JobNoValue: JsonToken;
        JobTaskNoValue: JsonToken;
        DescriptionValue: JsonToken;
        WorkTypeValue: JsonToken;
        DateValue: JsonToken;
        QuantityValue: JsonToken;
        StatusValue: JsonToken;
        ProcessedValue: JsonToken;
        JobResponsibleApprovalValue: JsonToken;
        RejectionCauseValue: JsonToken;
        JobResponsibleValue: JsonToken;
        ResourceResponsibleValue: JsonToken;
        JobNoAndDescriptionValue: JsonToken;
        ResourceNameValue: JsonToken;
        CompanyValue: JsonToken;
        CreatedValue: JsonToken;
        ModifiedValue: JsonToken;
    begin
        // Configurar la URI solicitada
        HttpRequestMessage.SetRequestUri('https://psgrupo365.sharepoint.com/_api/web');
        ;
        HttpRequestMessage.Method := 'GET';

        // Obtener los encabezados y agregar el token de autenticación
        HttpRequestMessage.GetHeaders(HttpHeaders);
        HttpHeaders.Add('Authorization', 'Bearer ' + Token);

        // Enviar la solicitud HTTP
        if HttpClient.Send(HTTPRequestMessage, HTTPResponseMessage) then begin
            if HTTPResponseMessage.IsSuccessStatusCode() then begin
                HTTPResponseMessage.Content().ReadAs(ResponseText);
                JsonObject.ReadFrom(ResponseText);

                // Obtener el valor de 'value' en un JsonToken, luego convertirlo a JsonArray
                if JsonObject.Get('value', JsonToken) then begin
                    JsonArray := JsonToken.AsArray();  // Convertir el JsonToken a JsonArray
                    foreach JsonToken in JsonArray do begin
                        Item := JsonToken.AsObject();  // Convertir JsonToken a JsonObject
                        TempList.Init();
                        if Item.Get('Id', IdValue) then
                            TempList.ID := IdValue.AsValue().AsInteger();
                        if Item.Get('Title', TitleValue) then
                            TempList.Title := TitleValue.AsValue().AsText();
                        if Item.Get('ResourceNo', ResourceNoValue) then
                            TempList.ResourceNo := ResourceNoValue.AsValue().AsText();
                        if Item.Get('JobNo', JobNoValue) then
                            TempList.JobNo := JobNoValue.AsValue().AsText();
                        if Item.Get('JobTaskNo', JobTaskNoValue) then
                            TempList.JobTaskNo := JobTaskNoValue.AsValue().AsText();
                        if Item.Get('Description', DescriptionValue) then
                            TempList.Description := DescriptionValue.AsValue().AsText();
                        if Item.Get('WorkType', WorkTypeValue) then
                            TempList.WorkType := WorkTypeValue.AsValue().AsText();
                        if Item.Get('Date', DateValue) then
                            TempList.Date := DT2Date(DateValue.AsValue().AsDateTime());
                        if Item.Get('Quantity', QuantityValue) then
                            TempList.Quantity := QuantityValue.AsValue().AsDecimal();
                        if Item.Get('Status', StatusValue) then begin
                            case StatusValue.AsValue().AsText() of
                                'Open':
                                    TempList.Status := TempList.Status::Open;
                                'Pending':
                                    TempList.Status := TempList.Status::Pending;
                                'Approved':
                                    TempList.Status := TempList.Status::Approved;
                                'Rejected':
                                    TempList.Status := TempList.Status::Rejected;
                                else
                                    Error('Estado desconocido: %1', StatusValue.AsValue().AsText());  // Para manejar casos desconocidos
                            end;
                        end;
                        if Item.Get('Processed', ProcessedValue) then
                            TempList.Processed := ProcessedValue.AsValue().AsBoolean();
                        if Item.Get('JobResponsibleApproval', JobResponsibleApprovalValue) then
                            TempList.JobResponsibleApproval := JobResponsibleApprovalValue.AsValue().AsBoolean();
                        if Item.Get('RejectionCause', RejectionCauseValue) then
                            TempList.RejectionCause := RejectionCauseValue.AsValue().AsText();
                        if Item.Get('JobResponsible', JobResponsibleValue) then
                            TempList.JobResponsible := JobResponsibleValue.AsValue().AsText();
                        if Item.Get('ResourceResponsible', ResourceResponsibleValue) then
                            TempList.ResourceResponsible := ResourceResponsibleValue.AsValue().AsText();
                        if Item.Get('JobNoAndDescription', JobNoAndDescriptionValue) then
                            TempList.JobNoAndDescription := JobNoAndDescriptionValue.AsValue().AsText();
                        if Item.Get('ResourceName', ResourceNameValue) then
                            TempList.ResourceName := ResourceNameValue.AsValue().AsText();
                        if Item.Get('Company', CompanyValue) then
                            TempList.Company := CompanyValue.AsValue().AsText();
                        if Item.Get('Created', CreatedValue) then
                            TempList.Created := CreatedValue.AsValue().AsDateTime();
                        if Item.Get('Modified', ModifiedValue) then
                            TempList.Modified := ModifiedValue.AsValue().AsDateTime();
                        TempList.Insert();
                    end;
                end;
            end else begin
                // Error en la respuesta del servidor
                HTTPResponseMessage.Content().ReadAs(ResponseText);
                Error('Error en la solicitud: %1', ResponseText);
            end;
        end else begin
            HTTPResponseMessage.Content().ReadAs(ResponseText);
            Error('Error en la solicitud HTTP: Código de estado %1, Contenido: %2',
                  HTTPResponseMessage.HttpStatusCode, ResponseText);
        end;
    end;
}
 */
