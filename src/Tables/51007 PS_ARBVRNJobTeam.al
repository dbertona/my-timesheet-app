// Extensión de la Tabla Customers
tableextension 51007 PS_ARBVRNJobTeam extends ARBVRNJobTeam
{
    fields
    {
        field(50100; PS_SoloImputar; Boolean)
        {
            Caption = 'Solo permitir Imputacion';
            DataClassification = ToBeClassified;
        }

    }
    trigger OnInsert()
    begin
        Rec.PS_SoloImputar := false;
    end;
}
