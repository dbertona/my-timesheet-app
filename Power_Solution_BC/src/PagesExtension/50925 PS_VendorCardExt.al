pageextension 50925 "PS_VendorCardExt" extends "Vendor Card"
{
    trigger OnQueryClosePage(CloseAction: Action): Boolean
    begin
        if Rec."VAT Registration No." = '' then
            Error('El campo CIF/NIF es obligatorio.');
    end;
}
