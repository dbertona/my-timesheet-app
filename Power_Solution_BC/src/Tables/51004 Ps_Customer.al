// Extensión de la Tabla Customers
tableextension 51004 CustomerExtension extends Customer
{
    fields
    {
        field(50100; PS_ReclamarPagos; Boolean)
        {
            Caption = 'Payment Tracking';
            DataClassification = ToBeClassified;
        }
    }
    trigger OnInsert()
    begin
        Rec.PS_ReclamarPagos := true;
    end;
}
