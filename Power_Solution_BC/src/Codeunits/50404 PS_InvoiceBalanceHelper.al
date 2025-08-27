codeunit 50404 InvoiceBalanceHelper
{
    procedure GetInvoiceBalance(EntryNo: Integer): Decimal
    var
        CustLedgerEntry: Record "Cust. Ledger Entry";
        Balance: Decimal;
    begin
        if CustLedgerEntry.Get(EntryNo) then begin
            Balance := CustLedgerEntry."Remaining Amount";
            exit(Balance);
        end else begin
            Error('Customer Ledger Entry not found.');
        end;
    end;
}
