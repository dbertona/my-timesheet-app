table 50015 "PS_Year"
{
    DataClassification = ToBeClassified;
    fields
    {
        field(1; "PS_Year"; Integer)
        {
            Caption = 'Year';
            DataClassification = ToBeClassified;
        }
    }

    keys
    {
        key(PK; "PS_Year")
        {
            Clustered = true;
        }
    }
}
