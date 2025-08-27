table 50011 "PS_Combined_Data"
{
    DataClassification = ToBeClassified;

    fields
    {
        field(1; Invoice; Decimal) { }
        field(2; cost; Decimal) { }
        field(3; quantity; Decimal) { }
        field(4; probability; Integer) { }
        field(5; departamento; Text[50]) { }
        field(8; job; Text[50]) { }
        field(9; documenDay; Date) { }
        field(10; workDay; Date) { }
        field(11; lineType; Text[50]) { }
        field(12; nr; Integer) { }
        field(13; typeLine; Text[50]) { }
        field(14; descripcion; Text[100]) { }
        field(15; estado; Text[50]) { }
        field(16; tipoProyecto; Text[50]) { }
        field(17; budgetDateYear; Integer) { } // Campo en desuso
        field(18; budgetDateMonth; Integer) { } // Campo en desuso
        field(19; status1; Text[50]) { }
        field(20; descripcionCA; Text[100]) { }
        field(21; Date; Date) { }
        field(22; InvoiceSinKilometros; Decimal) { }
        field(23; ID; Integer)
        {
            AutoIncrement = true;
            DataClassification = ToBeClassified;
        }
        field(24; year; code[4]) { }
        field(25; month; code[2]) { }
        field(26; budgetDateYear2; code[4]) { }
        field(27; budgetDateMonth2; code[2]) { }

    }

    keys
    {
        key(IDKey; ID)
        {
            Clustered = true;
        }
    }
}
