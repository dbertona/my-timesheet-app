codeunit 50441 "PS_Analytics Webhook Dispatcher"
{
    SingleInstance = true;

    // Recursos (Resource)
    [EventSubscriber(ObjectType::Table, Database::Resource, 'OnAfterInsertEvent', '', false, false)]
    local procedure ResourceOnAfterInsert(var Rec: Record Resource; RunTrigger: Boolean)
    begin
        TriggerSync('recursos');
    end;

    [EventSubscriber(ObjectType::Table, Database::Resource, 'OnAfterModifyEvent', '', false, false)]
    local procedure ResourceOnAfterModify(var Rec: Record Resource; xRec: Record Resource; RunTrigger: Boolean)
    begin
        TriggerSync('recursos');
    end;

    [EventSubscriber(ObjectType::Table, Database::Resource, 'OnAfterDeleteEvent', '', false, false)]
    local procedure ResourceOnAfterDelete(var Rec: Record Resource; RunTrigger: Boolean)
    begin
        TriggerSync('recursos');
    end;

    // Proyectos (Job)
    [EventSubscriber(ObjectType::Table, Database::Job, 'OnAfterInsertEvent', '', false, false)]
    local procedure JobOnAfterInsert(var Rec: Record Job; RunTrigger: Boolean)
    begin
        TriggerSync('proyectos');
    end;

    [EventSubscriber(ObjectType::Table, Database::Job, 'OnAfterModifyEvent', '', false, false)]
    local procedure JobOnAfterModify(var Rec: Record Job; xRec: Record Job; RunTrigger: Boolean)
    begin
        TriggerSync('proyectos');
    end;

    [EventSubscriber(ObjectType::Table, Database::Job, 'OnAfterDeleteEvent', '', false, false)]
    local procedure JobOnAfterDelete(var Rec: Record Job; RunTrigger: Boolean)
    begin
        TriggerSync('proyectos');
    end;

    // Equipo de proyectos (Job Planning Line)
    [EventSubscriber(ObjectType::Table, Database::"Job Planning Line", 'OnAfterInsertEvent', '', false, false)]
    local procedure JPLOnAfterInsert(var Rec: Record "Job Planning Line"; RunTrigger: Boolean)
    begin
        TriggerSync('equipo_proyectos');
    end;

    [EventSubscriber(ObjectType::Table, Database::"Job Planning Line", 'OnAfterModifyEvent', '', false, false)]
    local procedure JPLOnAfterModify(var Rec: Record "Job Planning Line"; xRec: Record "Job Planning Line"; RunTrigger: Boolean)
    begin
        TriggerSync('equipo_proyectos');
    end;

    [EventSubscriber(ObjectType::Table, Database::"Job Planning Line", 'OnAfterDeleteEvent', '', false, false)]
    local procedure JPLOnAfterDelete(var Rec: Record "Job Planning Line"; RunTrigger: Boolean)
    begin
        TriggerSync('equipo_proyectos');
    end;

    // Movimientos de proyectos (Job Ledger Entry)
    [EventSubscriber(ObjectType::Table, Database::"Job Ledger Entry", 'OnAfterInsertEvent', '', false, false)]
    local procedure JLEOnAfterInsert(var Rec: Record "Job Ledger Entry"; RunTrigger: Boolean)
    begin
        TriggerSync('movimientos_proyectos');
    end;

    [EventSubscriber(ObjectType::Table, Database::"Job Ledger Entry", 'OnAfterModifyEvent', '', false, false)]
    local procedure JLEOnAfterModify(var Rec: Record "Job Ledger Entry"; xRec: Record "Job Ledger Entry"; RunTrigger: Boolean)
    begin
        TriggerSync('movimientos_proyectos');
    end;

    [EventSubscriber(ObjectType::Table, Database::"Job Ledger Entry", 'OnAfterDeleteEvent', '', false, false)]
    local procedure JLEOnAfterDelete(var Rec: Record "Job Ledger Entry"; RunTrigger: Boolean)
    begin
        TriggerSync('movimientos_proyectos');
    end;

    // Configuración de usuarios (User Setup)
    [EventSubscriber(ObjectType::Table, Database::"User Setup", 'OnAfterInsertEvent', '', false, false)]
    local procedure UserSetupOnAfterInsert(var Rec: Record "User Setup"; RunTrigger: Boolean)
    begin
        TriggerSync('configuracion_usuarios');
    end;

    [EventSubscriber(ObjectType::Table, Database::"User Setup", 'OnAfterModifyEvent', '', false, false)]
    local procedure UserSetupOnAfterModify(var Rec: Record "User Setup"; xRec: Record "User Setup"; RunTrigger: Boolean)
    begin
        TriggerSync('configuracion_usuarios');
    end;

    [EventSubscriber(ObjectType::Table, Database::"User Setup", 'OnAfterDeleteEvent', '', false, false)]
    local procedure UserSetupOnAfterDelete(var Rec: Record "User Setup"; RunTrigger: Boolean)
    begin
        TriggerSync('configuracion_usuarios');
    end;

    // Centros de responsabilidad / Tecnologías / Tipologías (Dimension Value)
    [EventSubscriber(ObjectType::Table, Database::"Dimension Value", 'OnAfterInsertEvent', '', false, false)]
    local procedure DimValOnAfterInsert(var Rec: Record "Dimension Value"; RunTrigger: Boolean)
    begin
        TriggerSync('centros_de_responsabilidad');
        TriggerSync('tecnologias');
        TriggerSync('tipologias');
    end;

    [EventSubscriber(ObjectType::Table, Database::"Dimension Value", 'OnAfterModifyEvent', '', false, false)]
    local procedure DimValOnAfterModify(var Rec: Record "Dimension Value"; xRec: Record "Dimension Value"; RunTrigger: Boolean)
    begin
        TriggerSync('centros_de_responsabilidad');
        TriggerSync('tecnologias');
        TriggerSync('tipologias');
    end;

    [EventSubscriber(ObjectType::Table, Database::"Dimension Value", 'OnAfterDeleteEvent', '', false, false)]
    local procedure DimValOnAfterDelete(var Rec: Record "Dimension Value"; RunTrigger: Boolean)
    begin
        TriggerSync('centros_de_responsabilidad');
        TriggerSync('tecnologias');
        TriggerSync('tipologias');
    end;

    // PS_Year
    [EventSubscriber(ObjectType::Table, Database::"PS_Year", 'OnAfterInsertEvent', '', false, false)]
    local procedure PSYearOnAfterInsert(var Rec: Record "PS_Year"; RunTrigger: Boolean)
    begin
        TriggerSync('ps_year');
    end;

    [EventSubscriber(ObjectType::Table, Database::"PS_Year", 'OnAfterModifyEvent', '', false, false)]
    local procedure PSYearOnAfterModify(var Rec: Record "PS_Year"; xRec: Record "PS_Year"; RunTrigger: Boolean)
    begin
        TriggerSync('ps_year');
    end;

    [EventSubscriber(ObjectType::Table, Database::"PS_Year", 'OnAfterDeleteEvent', '', false, false)]
    local procedure PSYearOnAfterDelete(var Rec: Record "PS_Year"; RunTrigger: Boolean)
    begin
        TriggerSync('ps_year');
    end;

    local procedure TriggerSync(Entity: Text)
    var
        Client: HttpClient;
        Content: HttpContent;
        Headers: HttpHeaders;
        Response: HttpResponseMessage;
        Body: Text;
        CompanyNameTxt: Text;
        Slug: Text;
        Url: Text;
    begin
        CompanyNameTxt := CompanyName();

        case CompanyNameTxt of
            'Power Solution Iberia SL':
                Slug := 'psi';
            'PS LAB CONSULTING SL':
                Slug := 'pslab';
            else
                Slug := '';
        end;

        Url := 'http://192.168.88.68:5678/webhook/sync-recursos-y-ps-years-psanalytics';
        if Slug <> '' then
            Url := Url + '?company=' + Slug;

        Body := '{"companyName":"' + CompanyNameTxt + '","entity":"' + Entity + '"}';

        Content.Clear();
        Content.WriteFrom(Body);
        Content.GetHeaders(Headers);
        Headers.Remove('Content-Type');
        Headers.Add('Content-Type', 'application/json');

        Client.Post(Url, Content, Response);
        // En esta primera versión, no se gestionan reintentos ni respuesta.
    end;
}


