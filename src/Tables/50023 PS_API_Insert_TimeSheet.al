table 50023 "PS API Insert TimeSheet"
{
    DataClassification = ToBeClassified;

    fields
    {
        field(1; "Document No."; Code[20]) { DataClassification = CustomerContent; }
        field(2; "Line No."; Integer) { DataClassification = CustomerContent; }
        field(3; "Resource No."; Code[20]) { DataClassification = CustomerContent; }
        field(4; "Job No."; Code[20]) { DataClassification = CustomerContent; }
        field(5; "Job Task No."; Code[20]) { DataClassification = CustomerContent; }
        field(6; Description; Text[100]) { DataClassification = CustomerContent; }
        field(7; "Timesheet Date"; Date) { DataClassification = CustomerContent; }
        field(8; Quantity; Decimal) { DataClassification = CustomerContent; }
        field(9; "Work Type Code"; Code[10]) { DataClassification = CustomerContent; }
    }
}
