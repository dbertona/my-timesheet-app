codeunit 50420 "PS_Validate JobCard"
{
    // [EventSubscriber(ObjectType::Table, Database::Job, 'OnAfterValidateEvent', 'Sell-to Customer Name', true, true)]
    // local procedure OnAfterValidateSelltoCustomerName(var Rec: Record Job; CurrFieldNo: Integer)
    // begin
    //     // Verificar si el registro todavía existe en la base de datos
    //     if not Rec.Get(Rec."No.") then
    //         exit; // Si el registro no existe, omitimos la validación

    //     // Validar el campo "Global Dimension 1 Code"
    //     if Rec."Sell-to Customer Name" = '' then
    //         Error('El campo "Nombre cliente" es obligatorio.');
    // end;

    // [EventSubscriber(ObjectType::Table, Database::Job, 'OnAfterValidateEvent', 'Bill-to Customer No.', true, true)]
    // local procedure OnAfterValidateBilltoCustomerNo(var Rec: Record Job; CurrFieldNo: Integer)
    // begin
    //     // Verificar si el registro todavía existe en la base de datos
    //     if not Rec.Get(Rec."No.") then
    //         exit; // Si el registro no existe, omitimos la validación

    //     // Validar el campo "Global Dimension 1 Code"
    //     if Rec."Bill-to Customer No." = '' then
    //         Error('El campo "Factura-a Nº cliente" es obligatorio.');
    // end;

    // [EventSubscriber(ObjectType::Table, Database::Job, 'OnAfterValidateEvent', 'Person Responsible', true, true)]
    // local procedure OnAfterValidatePersonResponsible(var Rec: Record Job; CurrFieldNo: Integer)
    // begin
    //     // Verificar si el registro todavía existe en la base de datos
    //     if not Rec.Get(Rec."No.") then
    //         exit; // Si el registro no existe, omitimos la validación

    //     // Validar el campo "Global Dimension 1 Code"
    //     if Rec."Person Responsible" = '' then
    //         Error('El campo "Cód. responsable" es obligatorio.');
    // end;

    // [EventSubscriber(ObjectType::Table, Database::Job, 'OnAfterValidateEvent', 'Global Dimension 1 Code', true, true)]
    // local procedure OnAfterValidateGlobalDimension1(var Rec: Record Job; CurrFieldNo: Integer)
    // begin
    //     // Verificar si el registro todavía existe en la base de datos
    //     if not Rec.Get(Rec."No.") then
    //         exit; // Si el registro no existe, omitimos la validación

    //     // Validar el campo "Global Dimension 1 Code"
    //     if Rec."Global Dimension 1 Code" = '' then
    //         Error('El campo "Código departamento" es obligatorio.');
    // end;

    // [EventSubscriber(ObjectType::Table, Database::Job, 'OnAfterValidateEvent', 'ARBPOWShortcutDim4', true, true)]
    // local procedure OnAfterValidateARBPOWShortcutDim4(var Rec: Record Job; CurrFieldNo: Integer)
    // begin
    //     // Verificar si el registro todavía existe en la base de datos
    //     if not Rec.Get(Rec."No.") then
    //         exit; // Si el registro no existe, omitimos la validación

    //     // Validar el campo "Global Dimension 1 Code"
    //     if Rec."ARBPOWShortcutDim4" = '' then
    //         Error('El campo "Tecnología Código" es obligatorio.');
    // end;

    // [EventSubscriber(ObjectType::Table, Database::Job, 'OnAfterValidateEvent', 'ARBPOWShortcutDim5', true, true)]
    // local procedure OnAfterValidateARBPOWShortcutDim5(var Rec: Record Job; CurrFieldNo: Integer)
    // begin
    //     // Verificar si el registro todavía existe en la base de datos
    //     if not Rec.Get(Rec."No.") then
    //         exit; // Si el registro no existe, omitimos la validación

    //     // Validar el campo "Global Dimension 1 Code"
    //     if Rec."ARBPOWShortcutDim5" = '' then
    //         Error('El campo "Tipología Código" es obligatorio.');
    // end;

}
