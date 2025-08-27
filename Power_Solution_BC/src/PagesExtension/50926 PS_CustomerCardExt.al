pageextension 50926 "PS_CustomerCardExt" extends "Customer Card"
{
    trigger OnQueryClosePage(CloseAction: Action): Boolean
    begin
        if Rec."VAT Registration No." = '' then
            Error('El campo "Nº de registro del IVA" es obligatorio.');
    end;
}
