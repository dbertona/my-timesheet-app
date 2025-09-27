table 50009 "PS_Resultado"
{
    DataClassification = ToBeClassified;

    fields
    {
        field(1; "Empresa"; TEXT[100])
        {
            DataClassification = ToBeClassified;
        }
        field(2; "Facturado"; Decimal)
        {
            DataClassification = ToBeClassified;
        }
        field(3; "Coste"; Decimal)
        {
            DataClassification = ToBeClassified;
        }
        field(4; "Cantidad"; Decimal)
        {
            DataClassification = ToBeClassified;
        }
        field(5; "CodigoUnicoDepartamento"; Code[50])
        {
            DataClassification = ToBeClassified;
        }
        field(6; "FachaCalculada"; Date)
        {
            DataClassification = ToBeClassified;
        }
        field(7; ID; Integer)
        {
            DataClassification = ToBeClassified;
        }
    }
    keys
    {
        key(IDKey; ID)
        {
            Clustered = true;
        }
    }
}
