table 50003 "PS_JobLedgerEntryMonthYear"
{
    Caption = 'PS_Job_ Ledger_Entry_Month_Year';

    fields
    {
        field(1; "PS_EntryNo."; Integer)
        {
            Caption = 'Line No.';
            Editable = true;
            TableRelation = "Job Ledger Entry"."Entry No."; // Relación directa con Job Ledger Entry
            NotBlank = true;
            DataClassification = SystemMetadata;
        }

        field(2; "PS_JobNo."; Code[20])
        {
            Caption = 'Job No.';
            Editable = true;
            TableRelation = "Job Ledger Entry"."Job No."; // Relación con Job Ledger Entry
            DataClassification = SystemMetadata;
        }
        Field(5; "PS_Month"; Code[2])
        {
            Caption = 'Month';
            Editable = true;
            DataClassification = SystemMetadata;
        }
        field(6; "PS_Year"; Code[4])
        {
            Caption = 'Year';
            Editable = true;
            DataClassification = SystemMetadata;
        }
    }
    keys
    {
        key(Key1; "PS_EntryNo.")
        {
            Clustered = true;

        }
    }
}
