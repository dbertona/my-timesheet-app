table 50005 "PS_UniqueJobPlanning_EnDesuso"
{
    DataClassification = ToBeClassified;

    fields
    {
        field(1; "Job No."; Code[20])
        {
            DataClassification = ToBeClassified;
        }
        field(2; "Year"; Integer)
        {
            DataClassification = ToBeClassified;
        }
        field(3; "Month"; Integer)
        {
            DataClassification = ToBeClassified;
        }
        field(4; "Invoice"; Decimal)
        {
            DataClassification = ToBeClassified;
        }
        field(5; "Cost"; Decimal)
        {
            DataClassification = ToBeClassified;
        }
        field(6; "No."; Code[20])
        {
            DataClassification = ToBeClassified;
        }
        field(7; "ARBVRNAnaliticConcept"; Code[20])
        {
            DataClassification = ToBeClassified;
        }
    }

    keys
    {
        key(PK; "Job No.", "Year", "Month", "Invoice", "Cost", "No.")
        {
            Clustered = true;
        }
    }
}
