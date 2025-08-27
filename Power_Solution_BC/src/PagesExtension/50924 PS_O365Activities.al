pageextension 50924 PS_O365Activities extends "O365 Activities"
{
    layout
    {


        addlast("Ongoing Purchases")
        {
            field("Expiration purchases"; GetExpirationpurchases())
            {
                ApplicationArea = Basic, Suite;
                Caption = 'Due on payment day';
                StyleExpr = true;
                trigger OnDrillDown()
                begin
                    ShowDetails();
                end;

            }
        }
        addlast(content)
        {
            cuegroup(Nomina)
            {
                field("Last Payroll Date"; GetLastNominasMonth())
                {
                    ApplicationArea = Basic, Suite;
                    Caption = 'Last Payrolls Month';
                    //Style = VarStyleExpr;
                    StyleExpr = true;
                }
            }
        }
    }
    var
        PurchInvoiceLine: Record "Vendor Ledger Entry";
        TargetDate: Date;
        TotalAmount: Decimal;
        VarStyleExpr: Text;

    procedure GetExpirationpurchases(): Decimal
    var
        GLRegister: Record "Vendor Ledger Entry";
    begin
        TargetDate := GetTargetDate(); // Calcula el día 10 dinámico

        // Aplica filtros
        PurchInvoiceLine.SetRange("Due Date", 0D, TargetDate);
        PurchInvoiceLine.SetRange("Document Type", PurchInvoiceLine."Document Type"::Invoice);
        PurchInvoiceLine.SetRange(Open, true);
        PurchInvoiceLine.SetFilter("Remaining Amount (LCY) stats.", '<>%1', 0);
        // Suma los importes restantes
        TotalAmount := 0;
        if PurchInvoiceLine.FindSet() then
            repeat
                TotalAmount += PurchInvoiceLine."Remaining Amount (LCY) stats.";
            until PurchInvoiceLine.Next() = 0;
        TotalAmount := TotalAmount * -1;
        exit(TotalAmount);
    end;

    local procedure GetTargetDate(): Date
    var
        Today: Date;
    begin
        Today := WORKDATE; // Usa la fecha de trabajo como base

        // Si el día actual es menor o igual a 10, calcula el día 10 del mes actual
        if DATE2DMY(Today, 1) <= 10 then
            exit(DMY2DATE(10, DATE2DMY(Today, 2), DATE2DMY(Today, 3)));

        // Si el día actual es mayor a 10, calcula el día 10 del mes siguiente
        exit(DMY2DATE(10, DATE2DMY(CALCDATE('<+1M>', Today), 2), DATE2DMY(CALCDATE('<+1M>', Today), 3)));
    end;

    local procedure ShowDetails()
    VAR
        VendorLedgerEntry: Record "Vendor Ledger Entry";
    begin
        VendorLedgerEntry.SetRange("Due Date", 0D, TargetDate);
        VendorLedgerEntry.SetRange("Document Type", PurchInvoiceLine."Document Type"::Invoice);
        VendorLedgerEntry.SetRange(Open, true);
        VendorLedgerEntry.SetFilter("Remaining Amount (LCY) stats.", '<>%1', 0);
        PAGE.Run(PAGE::"Vendor Ledger Entries", VendorLedgerEntry);
    end;

    procedure GetLastNominasMonth(): Integer
    var
        GLRegister: Record "G/L Register";
    begin
        GLRegister.SetRange("Journal Batch Name", 'NOMINAS');
        GLRegister.SetCurrentKey("Posting Date");
        GLRegister.Ascending(false);

        if GLRegister.FindFirst() then
            exit(Date2DMY(GLRegister."Posting Date", 2)); // Devuelve el mes como número
        exit(0);
    end;
}
