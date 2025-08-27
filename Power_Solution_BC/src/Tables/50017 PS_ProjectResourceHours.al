table 50017 "PSProjectResourceHours"
{
    DataClassification = ToBeClassified;

    fields
    {
        field(1; "PS_Job No."; Code[20])
        {
            DataClassification = ToBeClassified;
            Caption = 'Project';
        }
        field(2; "PS_Resource No."; Code[20])
        {
            DataClassification = ToBeClassified;
            Caption = 'Resource';
        }
        field(3; PS_Month; Code[2]) // First Open Month
        {
            Caption = 'Month';
            DataClassification = SystemMetadata;
        }
        field(4; PS_Year; Code[4]) // First Open year
        {
            Caption = 'Year';
            DataClassification = SystemMetadata;
        }
        field(5; "PS_TotalHours"; Decimal)
        {
            Caption = 'Total Hours Imputed by Resource';
            FieldClass = FlowField;

            CalcFormula = Sum("Job Ledger Entry".Quantity
                WHERE("Job No." = FIELD("PS_Job No."),
                      "No." = FIELD("PS_Resource No."),
                      "Entry Type" = CONST(Usage),
                      "Type" = CONST(RESOURCE),
                      "ARBVRNComputedForHours" = CONST(True)));
        }
        field(6; "PS_JobTotalHours"; Decimal)
        {
            Caption = 'Total Hours Imputed';
            FieldClass = FlowField;

            CalcFormula = Sum("Job Ledger Entry".Quantity
                WHERE("Job No." = FIELD("PS_Job No."),
                    "Entry Type" = CONST(Usage),
                    "Type" = CONST(RESOURCE),
                    "ARBVRNComputedForHours" = CONST(True)));
        }
        field(7; "PS_ResourceName"; Text[100])
        {
            Caption = 'Resource Name';
            FieldClass = FlowField;
            CalcFormula = Lookup(Resource.Name WHERE("No." = FIELD("PS_Resource No.")));
        }
        field(8; "PS_OpenMonthHours"; Decimal)
        {
            Caption = 'Open Month Hours';
            FieldClass = FlowField;
            CalcFormula = Sum("Job Ledger Entry".Quantity
                WHERE("Job No." = FIELD("PS_Job No."),
                    "No." = FIELD("PS_Resource No."),
                    "Entry Type" = CONST(Usage),
                    "Type" = CONST(RESOURCE),
                    "PS_Month" = FIELD(PS_Month),
                    "PS_Year" = FIELD(PS_Year)));
        }
    }
    keys
    {
        key(PK; "PS_Job No.", "PS_Resource No.") { Clustered = true; } // Clave primaria combinada de Proyecto y Recurso
    }
}
