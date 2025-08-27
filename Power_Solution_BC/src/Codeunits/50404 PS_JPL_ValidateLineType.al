codeunit 50404 "PS_JPL_ValidateLineType"
{
    [EventSubscriber(ObjectType::Table, Database::"Job Planning Line", 'OnBeforeValidateEvent', 'Line Type', true, true)]
    local procedure EnforceAllowedLineType(var Rec: Record "Job Planning Line"; var xRec: Record "Job Planning Line"; CurrFieldNo: Integer)
    begin
        if (Rec."Line Type" <> Rec."Line Type"::Budget) and (Rec."Line Type" <> Rec."Line Type"::Billable) then
            Error('Solo se permiten los valores Budget o Billable.');
    end;
}
