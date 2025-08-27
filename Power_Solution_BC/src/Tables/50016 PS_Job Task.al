table 50016 "PS_Job_Task"
{
    Caption = 'Project Task';
    DrillDownPageID = "Job Task Lines";
    LookupPageID = "Job Task Lines";
    DataClassification = CustomerContent;

    fields
    {
        field(1; "Job No."; Code[20])
        {
            Caption = 'Project No.';
            Editable = false;
            NotBlank = true;
            TableRelation = Job;
        }
        field(2; "Job Task No."; Code[20])
        {
            Caption = 'Project Task No.';

        }
        field(3; Description; Text[100])
        {
            Caption = 'Description';
        }
        field(4; "Job Task Type"; Enum "Job Task Type")
        {
            Caption = 'Project Task Type';
        }
        field(10; "Schedule (Total Cost)"; Decimal)
        {
            AutoFormatType = 1;
            BlankZero = true;
            Caption = 'Budget (Total Cost)';
            Editable = false;
        }
        field(11; "Schedule (Total Price)"; Decimal)
        {
            AutoFormatType = 1;
            BlankZero = true;
            Caption = 'Budget (Total Price)';
            Editable = false;
        }
        field(12; "Usage (Total Cost)"; Decimal)
        {
            AutoFormatType = 1;
            BlankZero = true;
            Caption = 'Actual (Total Cost)';
            Editable = false;
        }
        field(13; "Usage (Total Price)"; Decimal)
        {
            AutoFormatType = 1;
            BlankZero = true;
            Caption = 'Actual (Total Price)';
            Editable = false;
        }
        field(21; Totaling; Text[250])
        {
            Caption = 'Totaling';
        }

        field(60; "Global Dimension 1 Code"; Code[20])
        {
            CaptionClass = '1,1,1';
            Caption = 'Global Dimension 1 Code';
            TableRelation = "Dimension Value".Code where("Global Dimension No." = const(1),
                                                          Blocked = const(false));
        }
        field(61; "Global Dimension 2 Code"; Code[20])
        {
            CaptionClass = '1,1,2';
            Caption = 'Global Dimension 2 Code';
            TableRelation = "Dimension Value".Code where("Global Dimension No." = const(2),
                                                          Blocked = const(false));
        }

        field(66; "Start Date"; Date)
        {
            Caption = 'Start Date';
            Editable = false;

        }
        field(67; "End Date"; Date)
        {
            Caption = 'End Date';
            Editable = false;

        }
    }

    keys
    {
        key(Key1; "Job No.", "Job Task No.")
        {
            Clustered = true;
        }
        key(Key2; "Job Task No.")
        {
        }
        key(Key3; SystemCreatedAt)
        {
        }
    }

    fieldgroups
    {
        fieldgroup(DropDown; "Job No.", "Job Task No.", Description, "Job Task Type")
        {
        }
        fieldgroup(Brick; "Job Task No.", Description)
        {
        }
    }
}

