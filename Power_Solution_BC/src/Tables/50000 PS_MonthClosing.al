table 50000 "PS_MonthClosing"
{
    Caption = 'MonthClosing';
    DataClassification = ToBeClassified;

    fields
    {
        field(1; PS_JobNo; Code[20])
        {
            Caption = 'Job No.';
            TableRelation = Job."No.";
            NotBlank = true;
            DataClassification = SystemMetadata;
        }
        field(2; PS_Description; Text[100])
        {
            Caption = 'Description';
            DataClassification = SystemMetadata;
        }
        field(3; PS_GlobalDimension1Code; Code[20])
        {
            Caption = 'Department';
            DataClassification = SystemMetadata;
        }
        field(4; PS_ClosingMonthCode; Code[20])
        {
            Caption = 'Closing code';
            DataClassification = SystemMetadata;
        }
        field(5; PS_ClosingMonthName; Text[30])
        {
            Caption = 'Closing name';
            DataClassification = SystemMetadata;
        }
        field(6; PS_ClosingMonthDate; Date)
        {
            Caption = 'Closing Date';
            DataClassification = SystemMetadata;
        }
        field(7; PS_Status; Option)
        {
            Caption = 'Status';
            OptionMembers = Open,Close;
            //Editable = false;
            DataClassification = SystemMetadata;
        }
        field(8; PS_BillablePriceTotal; Decimal)
        {
            Caption = 'Billable Import';
            DataClassification = SystemMetadata;
        }
        field(9; PS_CostTotal; Decimal)
        {
            Caption = 'Cost Amount';
            DataClassification = SystemMetadata;
        }
        field(10; PS_Month; Code[2])
        {
            Caption = 'Month';
            DataClassification = SystemMetadata;
        }
        field(11; PS_Year; Code[4])
        {
            Caption = 'Year';
            DataClassification = SystemMetadata;
        }
        field(12; "Job Status"; Enum "Job Status")
        {
            Caption = 'Job Status';
            FieldClass = FlowField;
            CalcFormula = Lookup(Job.Status WHERE("No." = Field(PS_JobNo)));
        }
    }

    keys
    {
        key(Key1; PS_JobNo, PS_ClosingMonthCode) { }
        key(Key2; PS_JobNo, PS_ClosingMonthDate) { }
        key(Key3; PS_JobNo, PS_Status) { }
        key(Key4; PS_Status) { }
        key(Key5; PS_GlobalDimension1Code) { }
    }
    trigger OnInsert()
    BEGIN
        PS_YEAR := Format(Date2DMY(Rec.PS_ClosingMonthDate, 3));
        PS_Month := Format(Date2DMY(PS_ClosingMonthDate, 2));
    END;
}
