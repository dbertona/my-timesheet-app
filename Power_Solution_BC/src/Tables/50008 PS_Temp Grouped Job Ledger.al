table 50008 "PS_Temp Grouped Job Ledger"
{
    DataClassification = ToBeClassified;

    fields
    {
        field(1; "Job No."; Code[20])
        {
            DataClassification = CustomerContent;
        }
        field(2; "Resource No."; Code[20])
        {
            DataClassification = CustomerContent;
        }
        field(3; "Resource Name"; Text[100])
        {
            DataClassification = CustomerContent;
        }
        field(4; "Grouped Total Cost"; Decimal)
        {
            DataClassification = ToBeClassified;
        }
        field(5; "Percentage of Total"; Decimal)
        {
            DataClassification = ToBeClassified;
        }
        field(6; "Adjustment"; Decimal)
        {
            DataClassification = ToBeClassified;
        }
        field(7; "Job Task No."; Code[20])
        {
            DataClassification = ToBeClassified;
        }
    }

    keys
    {
        key(PK; "Job No.", "Resource No.", "Job Task No.")
        {
            Clustered = true;
        }
        key(Key2; "Resource No.", "Job No.")
        {
        }
        key(SortKey; "Resource No.", "Percentage of Total")
        {
        }
    }
}


