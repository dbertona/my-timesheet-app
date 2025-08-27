codeunit 50424 "PS_JobPlanningLineHandler"
{
    [EventSubscriber(ObjectType::Page, Page::"Job Planning Lines Part", 'OnAfterValidateEvent', 'Work Type Code', true, true)]
    local procedure OnAfterValidateLineType(var Rec: Record "Job Planning Line")
    begin
        if Rec."Line Type" = Rec."Line Type"::Budget then begin
            if Rec."Unit Price" <> 0 then begin
                Rec.Validate("Unit Price", 0);
                Rec.Modify(); // ← Asegura que el cambio se aplique
            end;
        end;
        if Rec."Line Type" = Rec."Line Type"::Billable then begin
            if Rec."Unit Cost" <> 0 then begin
                Rec.Validate("Unit Cost", 0);
                Rec.Modify(); // ← Asegura que el cambio se aplique
            end;
        end;
    end;
}
