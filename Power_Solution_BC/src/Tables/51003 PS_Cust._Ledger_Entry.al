// Extensión de la Tabla Cust. Ledger Entry
tableextension 51003 "Ps Cust. Ledger Entry" extends "Cust. Ledger Entry"
{
    fields
    {
        field(50101; ReclamarPagos; Boolean)
        {
            Caption = 'Payment Tracking';
            DataClassification = ToBeClassified;

            trigger OnValidate()
            begin
                TestField(Open, true);
            end;
        }
        field(50102; "Payment commitment date"; Date)
        {
            Caption = 'Payment commitment date';
            DataClassification = ToBeClassified;

        }
    }

    trigger OnInsert()
    var
        CustomerRec: Record Customer;
    begin
        if CustomerRec.Get("Customer No.") then begin
            ReclamarPagos := CustomerRec.PS_ReclamarPagos;
        end;
    end;

    trigger OnModify()
    begin
        // Sin lógica para evitar reseteo de campos
    end;
}
