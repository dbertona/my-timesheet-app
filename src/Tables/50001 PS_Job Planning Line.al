table 50001 "PS_JobPlanningLine"
{
    Caption = 'PS project Planning Line';

    fields
    {
        field(1; "PS_LineNo."; Integer)
        {
            Caption = 'Line No.';
            Editable = false;
            DataClassification = SystemMetadata;
        }
        field(2; "PS_JobNo."; Code[20])
        {
            Caption = 'Job No.';
            NotBlank = true;
            TableRelation = Job;
            DataClassification = SystemMetadata;
        }
        field(3; "PS_PlanningDate"; Date)
        {
            Caption = 'Planning Date';
            DataClassification = SystemMetadata;

        }
        field(4; "PS_DocumentNo."; Code[20])
        {
            Caption = 'Document No.';
            DataClassification = SystemMetadata;
        }
        field(5; PS_Type; Enum "Job Planning Line Type")
        {
            Caption = 'Type';
            DataClassification = SystemMetadata;
        }
        field(6; "PS_No."; Code[20])
        {
            Caption = 'No.';
            DataClassification = SystemMetadata;
            TableRelation = if (PS_Type = const(Resource)) Resource
            else
            if (PS_Type = const(Item)) Item where(Blocked = const(false))
            else
            if (PS_Type = const("G/L Account")) "G/L Account"
            else
            if (PS_Type = const(Text)) "Standard Text";
        }
        field(7; PS_Description; Text[100])
        {
            Caption = 'Description';
            DataClassification = SystemMetadata;
        }
        field(8; PS_Quantity; Decimal)
        {
            Caption = 'Quantity';
            DecimalPlaces = 0 : 5;
            DataClassification = SystemMetadata;
        }
        field(9; "PS_DirectUnitCost(LCY)"; Decimal)
        {
            AutoFormatType = 2;
            Caption = 'Direct Unit Cost (LCY)';
            DataClassification = SystemMetadata;
        }
        field(10; "PS_UnitCost(LCY)"; Decimal)
        {
            AutoFormatType = 2;
            Caption = 'Unit Cost (LCY)';
            Editable = false;
            DataClassification = SystemMetadata;
        }
        field(11; "PS_TotalCost(LCY)"; Decimal)
        {
            AutoFormatType = 1;
            Caption = 'Total Cost (LCY)';
            Editable = false;
            DataClassification = SystemMetadata;
        }
        field(12; "PS_UnitPrice(LCY)"; Decimal)
        {
            AutoFormatType = 2;
            Caption = 'Unit Price (LCY)';
            Editable = false;
            DataClassification = SystemMetadata;
        }
        field(13; "PS_TotalPrice(LCY)"; Decimal)
        {
            AutoFormatType = 1;
            Caption = 'Total Price (LCY)';
            Editable = false;
            DataClassification = SystemMetadata;
        }
        field(14; "PS_ResourceGroupNo."; Code[20])
        {
            Caption = 'Resource Group No.';
            Editable = false;
            TableRelation = "Resource Group";
            DataClassification = SystemMetadata;
        }
        field(15; "PS_UnitofMeasureCode"; Code[10])
        {
            Caption = 'Unit of Measure Code';
            DataClassification = SystemMetadata;
            TableRelation = if (PS_Type = const(Item)) "Item Unit of Measure".Code where("Item No." = field("PS_No."))
            else
            if (PS_Type = const(Resource)) "Resource Unit of Measure".Code where("Resource No." = field("PS_No."))
            else
            "Unit of Measure";
        }
        field(16; "PS_LastDateModified"; Date)
        {
            Caption = 'Last Date Modified';
            DataClassification = SystemMetadata;
            Editable = false;
        }
        field(17; "PS_UserID"; Code[50])
        {
            Caption = 'User ID';
            DataClassification = EndUserIdentifiableInformation;
            Editable = false;
            TableRelation = User."User Name";
        }
        field(18; "PS_WorkTypeCode"; Code[10])
        {
            Caption = 'Work Type Code';
            TableRelation = "Work Type";
            DataClassification = SystemMetadata;

        }
        field(19; "PS_DocumentDate"; Date)
        {
            Caption = 'Document Date';
            DataClassification = SystemMetadata;
        }
        field(20; "PS_JobTaskNo."; Code[20])
        {
            Caption = 'Job Task No.';
            NotBlank = true;
            DataClassification = SystemMetadata;
            TableRelation = "Job Task"."Job Task No." where("Job No." = field("PS_JobNo."));
        }
        field(21; "PS_LineType"; Enum "Job Planning Line Line Type")
        {
            Caption = 'Line Type';
            DataClassification = SystemMetadata;
        }
        field(22; "PS_CurrencyCode"; Code[10])
        {
            Caption = 'Currency Code';
            DataClassification = SystemMetadata;
            Editable = false;
            TableRelation = Currency;
        }
        field(23; "PS_CurrencyDate"; Date)
        {
            AccessByPermission = TableData Currency = R;
            Caption = 'Currency Date';
            DataClassification = SystemMetadata;
        }
        field(24; PS_Status; Enum "Job Planning Line Status")
        {
            Caption = 'Status';
            Editable = false;
            InitValue = "Order";
            DataClassification = SystemMetadata;
        }
        field(25; "PS_ClosingMonthCode"; Code[20])
        {
            DataClassification = SystemMetadata;
        }
        field(26; "PS_% Probability"; Option)
        {
            Caption = '% Probability';
            OptionMembers = "0","10","30","50","70","90";
            DataClassification = SystemMetadata;
        }
        field(27; "PS_ProbabilizedPrice(LCY)"; Decimal)
        {
            Caption = 'Probabilized Price (LCY)';
            Editable = false;
            DataClassification = SystemMetadata;
        }

        field(28; "PS_ProbabilizedCost(LCY)"; Decimal)
        {
            Caption = 'Probabilized Cost (LCY)';
            Editable = false;
            DataClassification = SystemMetadata;
        }
    }
    keys
    {
        key(Key1; "PS_JobNo.", "PS_JobTaskNo.", "PS_LineNo.", "PS_ClosingMonthCode")
        {
            Clustered = true;
        }
        key(Key2; "PS_JobNo.", "PS_PlanningDate", "PS_DocumentNo.")
        {
        }
    }
}
