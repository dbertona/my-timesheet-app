table 50019 "PS_EconomicMonitoringMatrix"
{
    DataClassification = ToBeClassified;

    fields
    {
        field(1; "Concept"; Option)
        {
            DataClassification = ToBeClassified;
            OptionMembers = A,Invoice,Cost,Labour;
            OptionCaption = '..,Invoice,Cost,Labour';
            Caption = 'Concept';
        }

        field(2; "Type"; Option)
        {
            DataClassification = ToBeClassified;
            OptionMembers = A,R,P;
            OptionCaption = '..,Real,Planned';
            Caption = 'Type';
        }

        field(3; "Job No."; Code[20])
        {
            DataClassification = ToBeClassified;
            Caption = 'Job No.';
        }

        field(4; "Year"; Integer)
        {
            DataClassification = ToBeClassified;
            Caption = 'Year';
        }
        field(5; "JanImport"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'January Import';
        }
        field(6; "FebImport"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'February Import';
        }
        field(7; "MarImport"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'March Import';
        }
        field(8; "AprImport"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'April Import';
        }
        field(9; "MayImport"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'May Import';
        }
        field(10; "JunImport"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'June Import';
        }
        field(11; "JulImport"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'July Import';
        }
        field(12; "AugImport"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'August Import';
        }
        field(13; "SepImport"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'September Import';
        }
        field(14; "OctImport"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'October Import';
        }
        field(15; "NovImport"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'November Import';
        }
        field(16; "DecImport"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'December Import';
        }

        field(17; "AnaliticConcept"; Code[20])
        {
            DataClassification = ToBeClassified;
            Caption = 'Analytic Concept';
        }

        field(18; "Description"; Code[100])
        {
            DataClassification = ToBeClassified;
            Caption = 'Description';
        }
        field(19; "HierarchyLevel"; Integer)
        {
            DataClassification = ToBeClassified;
            Caption = 'Hierarchy Level';
        }
        field(20; "Probability"; Option)
        {
            Caption = '% Probability';
            OptionMembers = "0","10","30","50","70","90";
            DataClassification = SystemMetadata;
        }
        field(21; IsClosedMonth; Boolean)
        {
            Caption = 'IsClosedMonth';
        }
        field(22; "JanStyleExpr"; Text[30])
        {
            Editable = false;
        }
        field(23; "FebStyleExpr"; Text[30])
        {
            Editable = false;
        }
        field(24; "MarStyleExpr"; Text[30])
        {
            Editable = false;
        }
        field(25; "AprStyleExpr"; Text[30])
        {
            Editable = false;
        }
        field(26; "MayStyleExpr"; Text[30])
        {
            Editable = false;
        }
        field(27; "JunStyleExpr"; Text[30])
        {
            Editable = false;
        }
        field(28; "JulStyleExpr"; Text[30])
        {
            Editable = false;
        }
        field(29; "AugStyleExpr"; Text[30])
        {
            Editable = false;
        }
        field(30; "SepStyleExpr"; Text[30])
        {
            Editable = false;
        }
        field(31; "OctStyleExpr"; Text[30])
        {
            Editable = false;
        }
        field(32; "NovStyleExpr"; Text[30])
        {
            Editable = false;
        }
        field(33; "DecStyleExpr"; Text[30])
        {
            Editable = false;
        }
        field(34; IsJanClosed; Boolean)
        {
            Caption = 'January Closed';
            DataClassification = ToBeClassified;
        }

        field(35; IsFebClosed; Boolean)
        {
            Caption = 'February Closed';
            DataClassification = ToBeClassified;
        }

        field(36; IsMarClosed; Boolean)
        {
            Caption = 'March Closed';
            DataClassification = ToBeClassified;
        }

        field(37; IsAprClosed; Boolean)
        {
            Caption = 'April Closed';
            DataClassification = ToBeClassified;
        }

        field(38; IsMayClosed; Boolean)
        {
            Caption = 'May Closed';
            DataClassification = ToBeClassified;
        }

        field(39; IsJunClosed; Boolean)
        {
            Caption = 'June Closed';
            DataClassification = ToBeClassified;
        }

        field(40; IsJulClosed; Boolean)
        {
            Caption = 'July Closed';
            DataClassification = ToBeClassified;
        }

        field(41; IsAugClosed; Boolean)
        {
            Caption = 'August Closed';
            DataClassification = ToBeClassified;
        }

        field(42; IsSepClosed; Boolean)
        {
            Caption = 'September Closed';
            DataClassification = ToBeClassified;
        }

        field(43; IsOctClosed; Boolean)
        {
            Caption = 'October Closed';
            DataClassification = ToBeClassified;
        }

        field(44; IsNovClosed; Boolean)
        {
            Caption = 'November Closed';
            DataClassification = ToBeClassified;
        }

        field(45; IsDecClosed; Boolean)
        {
            Caption = 'December Closed';
            DataClassification = ToBeClassified;
        }
    }
    keys
    {
        key(PK; Concept, Type, "Job No.", "Year")
        {
            Clustered = true;
        }
        key(TreeOrder; "Job No.", "Year", "HierarchyLevel", Concept, Type, Description)
        {
        }
        key(PK1; Probability, "Job No.", Description, Concept, Type, Year)
        {
        }
    }
}
