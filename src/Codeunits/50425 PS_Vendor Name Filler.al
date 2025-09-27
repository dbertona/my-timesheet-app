codeunit 50425 "PS_VendorNameFiller"
{
    [EventSubscriber(ObjectType::Table, Database::"Vendor Ledger Entry", 'OnAfterInsertEvent', '', true, true)]
    local procedure FillVendorNameAfterInsert(var Rec: Record "Vendor Ledger Entry")
    var
        Vendor: Record Vendor;
    begin
        if Rec."Vendor Name" = '' then
            if Vendor.Get(Rec."Vendor No.") then begin
                Rec."Vendor Name" := Vendor.Name;
                Rec.Modify(); // ← Importante para guardar el cambio
            end;
    end;
}
