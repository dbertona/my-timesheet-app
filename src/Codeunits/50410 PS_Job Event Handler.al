codeunit 50410 "PS_Job Event Handler"
{
    Subtype = Normal;

    [IntegrationEvent(false, false)]
    procedure OnResourceSelected(ResourceNo: Code[20])
    begin
        // Publica el evento
    end;
}
