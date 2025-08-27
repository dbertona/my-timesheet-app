table 50018 "PS_ProjectTaskResourceHours"
{
    DataClassification = ToBeClassified;

    fields
    {
        field(1; "PS_JobNo."; Code[20])
        {
            DataClassification = ToBeClassified;
            Caption = 'Project';
        }
        field(2; "PS_ResourceNo."; Code[20])
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
        field(6; "PS_JobTotalHours"; Decimal)
        {
            Caption = 'Total Hours Imputed';
            FieldClass = FlowField;

            CalcFormula = Sum("Job Ledger Entry".Quantity
                WHERE("Job No." = FIELD("PS_JobNo."),
                    "Entry Type" = CONST(Usage),
                    "Type" = CONST(RESOURCE),
                    "ARBVRNComputedForHours" = CONST(True)));
        }
        field(7; "PS_ResourceName"; Text[100])
        {
            Caption = 'Resource Name';
            FieldClass = FlowField;
            CalcFormula = Lookup(Resource.Name WHERE("No." = FIELD("PS_ResourceNo.")));
        }
        field(8; "PS_OpenMonthHours"; Decimal)
        {
            Caption = 'Total Open Month Hours';
            FieldClass = FlowField;
            CalcFormula = Sum("Job Ledger Entry".Quantity
                WHERE("Job No." = FIELD("PS_JobNo."),
                    "Job Task No." = FIELD("PS_JobTaskNo."),
                    "Entry Type" = CONST(Usage),
                    "Type" = CONST(RESOURCE),
                    "PS_Month" = FIELD(PS_Month),
                    "PS_Year" = FIELD(PS_Year),
                    "ARBVRNComputedForHours" = CONST(True)));
        }
        field(9; "PS_JobTaskNo."; Code[20])
        {
            Caption = 'Project Task No.';
            TableRelation = "Job Task"."Job Task No." where("Job No." = field("PS_JobNo."));
        }
        field(10; "PS_JobandTaskTotalHours"; Decimal)
        {
            Caption = 'Total Hours Imputed by Resource by Task';
            FieldClass = FlowField;
            CalcFormula = Sum("Job Ledger Entry".Quantity
                WHERE("Job No." = FIELD("PS_JobNo."),
                    "Job Task No." = FIELD("PS_JobTaskNo."),
                    "No." = FIELD("PS_ResourceNo."),
                    "Entry Type" = CONST(Usage),
                    "Type" = CONST(RESOURCE),
                    "PS_Month" = FIELD(PS_Month),
                    "PS_Year" = FIELD(PS_Year),
                    "ARBVRNComputedForHours" = CONST(True)));
        }
    }
    keys
    {
        key(PK; "PS_JobNo.", "PS_ResourceNo.", "PS_JobTaskNo.") { Clustered = true; }
    }
}
