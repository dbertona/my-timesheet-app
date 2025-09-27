table 50004 "PS_ObjectivesByDepartments"
{
    Caption = 'PS_ObjectivesByDepartments';
    DataClassification = ToBeClassified;

    fields
    {
        field(1; PS_Departments; Code[20])
        {
            Caption = 'Departments';
            TableRelation = "Dimension Value".Code where("Global Dimension No." = filter(1));
            DataClassification = SystemMetadata;
        }
        field(2; PS_Year; Integer)
        {
            Caption = 'Year';
            DataClassification = SystemMetadata;
        }
        field(3; "PS_Billing Target"; Decimal)
        {
            Caption = 'Billing Target';
            DataClassification = SystemMetadata;
        }
        field(4; "PS_Margin Target"; Decimal)
        {
            Caption = 'Margin Target';
            DataClassification = SystemMetadata;
        }
        field(5; "PS_Cost Target"; Decimal)
        {
            Caption = 'Cost Target';
            DataClassification = SystemMetadata;
        }
    }
    keys
    {
        key(PK; PS_Departments, PS_Year)
        {
            Clustered = true;
        }
    }
}
