codeunit 50409 "PsCustEntryEditExt"
{
    [EventSubscriber(ObjectType::Codeunit, Codeunit::"Cust. Entry-Edit", 'OnBeforeCustLedgEntryModify', '', false, false)]
    local procedure OnBeforeCustLedgEntryModify(var CustLedgEntry: Record "Cust. Ledger Entry"; FromCustLedgEntry: Record "Cust. Ledger Entry")
    begin
        CustLedgEntry."ReclamarPagos" := FromCustLedgEntry."ReclamarPagos";
        CustLedgEntry."Payment commitment date" := FromCustLedgEntry."Payment commitment date";
    end;

    [EventSubscriber(ObjectType::Codeunit, Codeunit::"Cust. Entry-Edit", 'OnRunOnAfterCustLedgEntryModify', '', false, false)]
    local procedure OnRunOnAfterCustLedgEntryModify(var CustLedgerEntryRec: Record "Cust. Ledger Entry"; var CustLedgerEntry: Record "Cust. Ledger Entry")
    begin
        // Add any additional logic here if needed after modification
    end;
}
