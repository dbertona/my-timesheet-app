table 50014 "PS_UniqueJobPlanningMatriz"
{
    DataClassification = ToBeClassified;

    fields
    {
        field(1; "Job No."; Code[20])
        {
            DataClassification = ToBeClassified;
            Caption = 'Job No.';
        }

        field(2; "Year"; Integer)
        {
            DataClassification = ToBeClassified;
            Caption = 'Year';
        }

        // Campos de Facturación (Invoice) para cada mes
        field(3; "JanInvoice"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'January Invoice';
        }
        field(4; "FebInvoice"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'February Invoice';
        }
        field(5; "MarInvoice"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'March Invoice';
        }
        field(6; "AprInvoice"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'April Invoice';
        }
        field(7; "MayInvoice"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'May Invoice';
        }
        field(8; "JunInvoice"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'June Invoice';
        }
        field(9; "JulInvoice"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'July Invoice';
        }
        field(10; "AugInvoice"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'August Invoice';
        }
        field(11; "SepInvoice"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'September Invoice';
        }
        field(12; "OctInvoice"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'October Invoice';
        }
        field(13; "NovInvoice"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'November Invoice';
        }
        field(14; "DecInvoice"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'December Invoice';
        }

        // Campos de Costos (Cost) para cada mes
        field(15; "JanCost"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'January Cost';
        }
        field(16; "FebCost"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'February Cost';
        }
        field(17; "MarCost"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'March Cost';
        }
        field(18; "AprCost"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'April Cost';
        }
        field(19; "MayCost"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'May Cost';
        }
        field(20; "JunCost"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'June Cost';
        }
        field(21; "JulCost"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'July Cost';
        }
        field(22; "AugCost"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'August Cost';
        }
        field(23; "SepCost"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'September Cost';
        }
        field(24; "OctCost"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'October Cost';
        }
        field(25; "NovCost"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'November Cost';
        }
        field(26; "DecCost"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'December Cost';
        }

        field(27; "AnaliticConcept"; Code[20])
        {
            DataClassification = ToBeClassified;
            Caption = 'Analytic Concept';
        }
        field(28; "Description"; Code[100])
        {
            DataClassification = ToBeClassified;
            Caption = 'Description';
        }
    }

    keys
    {
        key(PK; "Job No.", "Year")
        {
            Clustered = true;
        }
    }
}
