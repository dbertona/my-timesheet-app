/// <summary>
/// TableExtension PS_RespourceExten (ID 51000) extends Record Resource.
/// Esta extensión agrega tres nuevos campos al registro de Recursos: FechaDeBaja, NroRecursoNomina, y Perfil.
/// También agrega una clave para el campo NroRecursoNomina.
/// </summary>
tableextension 51000 PS_RespourceExten extends Resource
{
    fields
    {
        /// <summary>
        /// Campo FechaDeBaja (ID 50000).
        /// Este campo almacena la fecha en la que un recurso dejó de trabajar.
        /// </summary>
        field(50000; FechaDeBaja; Date)
        {
            Caption = 'Discharge date';
            DataClassification = SystemMetadata;
        }

        /// <summary>
        /// Campo NroRecursoNomina (ID 50001).
        /// Este campo almacena el número del recurso en la nómina.
        /// </summary>
        field(50001; NroRecursoNomina; Code[20])
        {
            Caption = 'Resource Number in Payroll';
            DataClassification = SystemMetadata;
        }

        /// <summary>
        /// Campo Perfil (ID 50002).
        /// Este campo almacena el perfil del recurso, utilizando una lista de opciones: Junior, Medio, Senior, Gestor, Consultor.
        /// </summary>
        field(50002; "Perfil"; Option)
        {
            Caption = 'Profile';
            OptionMembers = "Junior","Medio","Senior","Gestor","Consultor","Avanzado";
            DataClassification = SystemMetadata;
        }
    }

    keys
    {
        /// <summary>
        /// Llave (NroRecursoNominaKey) para el campo NroRecursoNomina.
        /// Esta clave permite realizar búsquedas y ordenaciones basadas en el número de recurso en la nómina.
        /// </summary>
        key(NroRecursoNominaKey; NroRecursoNomina)
        {
        }
    }

    trigger OnBeforeInsert()
    begin
        if Rec.IsTemporary then
            exit;

        if Rec."Gen. Prod. Posting Group" = '' then
            Error(GPPGRequiredErrLbl);
    end;

    trigger OnBeforeModify()
    begin
        if Rec.IsTemporary then
            exit;

        if (xRec."Gen. Prod. Posting Group" <> '') and (Rec."Gen. Prod. Posting Group" = '') then
            Error(CannotClearGPPGErrLbl);
    end;

    var
        GPPGRequiredErrLbl: Label 'Debe especificar el Grupo contable producto gen. en el recurso.', Locked = true, MaxLength = 250, Comment = 'Error when missing Gen. Prod. Posting Group on insert.';
        CannotClearGPPGErrLbl: Label 'No puede limpiar el Grupo contable producto gen. en un recurso existente.', Locked = true, MaxLength = 250, Comment = 'Error when clearing Gen. Prod. Posting Group on modify.';
}

/// <summary>
/// PageExtension PS_ResurceCard (ID 50300) extends "Resource Card".
/// Esta extensión agrega los campos FechaDeBaja, NroRecursoNomina y Perfil a la página de la tarjeta de recursos.
/// </summary>
pageextension 50300 PS_ResurceCard extends "Resource Card"
{
    layout
    {
        modify("Gen. Prod. Posting Group")
        {
            ShowMandatory = true;
        }
        addafter("Employment Date")
        {
            /// <summary>
            /// Campo FechaDeBaja (Rec.FechaDeBaja).
            /// Especifica la fecha en que la persona dejó de trabajar.
            /// </summary>
            field(FechaDeBaja; Rec.FechaDeBaja)
            {
                ApplicationArea = All;
                Caption = 'Discharge date';
                ToolTip = 'Specifies the date the person stopped working for you.';
                Visible = true;
            }

            /// <summary>
            /// Campo NroRecursoNomina (Rec.NroRecursoNomina).
            /// Especifica el número correspondiente de la persona en la nómina.
            /// </summary>
            field(NroRecursoNomina; Rec.NroRecursoNomina)
            {
                ApplicationArea = All;
                Caption = 'Resource Number in Payroll';
                ToolTip = 'Specifies the corresponding number of the person on the payroll.';
                Visible = true;
            }

            /// <summary>
            /// Campo Perfil (Rec.Perfil).
            /// Especifica el perfil correspondiente al recurso.
            /// </summary>
            field(Perfil; Rec.Perfil)
            {
                ApplicationArea = All;
                Caption = 'Resource Profile';
                ToolTip = 'Specifies the profile corresponding to the resource.';
                Visible = true;
            }
        }
    }
}
