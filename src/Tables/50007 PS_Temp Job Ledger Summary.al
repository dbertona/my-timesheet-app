table 50720 "PS_Temp Job Ledger Summary"
{
    DataClassification = ToBeClassified;

    fields
    {
        field(1; "Resource No"; Code[20])
        {
            DataClassification = CustomerContent;
        }
        field(2; "Resource Name"; Text[100])
        {
            DataClassification = CustomerContent;
        }
        field(3; "Total Cost by Payroll"; Decimal)
        {
            DataClassification = ToBeClassified;
        }
        field(4; "Total Cost for Imputation"; Decimal)
        {
            DataClassification = ToBeClassified;
        }
        field(5; "Percentage Difference"; Decimal)
        {
            DataClassification = ToBeClassified;
        }
        field(6; "Compensation Reserve"; Decimal)
        {
            DataClassification = ToBeClassified;
        }
        field(7; "IsTotalLine"; Boolean)
        {
            DataClassification = ToBeClassified;
        }
        field(8; "RowStyle"; Text[30])
        {
            DataClassification = ToBeClassified;
        }
    }


    keys
    {
        key(PK; "Resource No")
        {
            Clustered = true;
        }
    }
}
