// Página Lista para Customers (modificación para incluir el nuevo campo)
pageextension 50908 PS_Customer extends "Customer Card"
{
    layout
    {
        addafter("Non-Paymt. Periods Code")
        {
            field(ReclamarPagos; Rec.PS_ReclamarPagos)
            {
                ApplicationArea = All;
                Caption = 'Payment Tracking';
            }
        }
    }
}
