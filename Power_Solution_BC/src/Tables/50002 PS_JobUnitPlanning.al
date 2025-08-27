table 50002 PS_JobUnitPlanning
{
    Caption = 'Job Unit Planning';

    fields
    {
        field(1; PS_EntryNo; Integer)
        {
            Caption = 'Entry No.';
            DataClassification = SystemMetadata;
        }
        field(2; PS_JobNo; Code[20])
        {
            Caption = 'Job No.';
            DataClassification = SystemMetadata;
        }
        field(3; PS_JobUnitNo; Text[20])
        {
            Caption = 'Job unit No.';
            DataClassification = SystemMetadata;
        }
        field(4; PS_PlanningDate; Date)
        {
            Caption = 'Planning date';
            DataClassification = SystemMetadata;
        }
        field(5; PS_CertificationQuantity; Decimal)
        {
            Caption = 'Certification Quantity';
            DataClassification = SystemMetadata;
        }
        field(6; PS_ProductionQuantity; Decimal)
        {
            Caption = 'Production Quantity';
            DataClassification = SystemMetadata;
        }
        field(7; PS_CertificationAmount; Decimal)
        {
            Caption = 'Certification amount';
            DataClassification = SystemMetadata;
        }
        field(8; PS_CertificationAmountLCY; Decimal)
        {
            Caption = 'Certification amount (LCY)';
            DataClassification = SystemMetadata;
        }
        field(9; PS_ProductionAmount; Decimal)

        {
            Caption = 'Production Amount';
            DataClassification = SystemMetadata;
        }
        field(10; PS_ProductionAmountLCY; Decimal)
        {
            Caption = 'Production Amount (LCY)';
            DataClassification = SystemMetadata;
        }
        field(12; PS_UniqueKey; Code[20])
        {
            Caption = 'Unique Key';
            DataClassification = SystemMetadata;
        }
        field(13; PS_CertificationPorc; Decimal)
        {
            Caption = 'Certification Percent';
            DataClassification = SystemMetadata;
        }
        field(14; PS_ProductionPorc; Decimal)
        {
            Caption = 'Production Percent';
            DataClassification = SystemMetadata;
        }
        field(15; PS_PlanningType; Option)
        {
            Caption = 'Planning Type';
            OptionMembers = "Certification","Production";
            DataClassification = SystemMetadata;
        }
        field(16; PS_Real; Boolean)
        {
            Caption = 'Real';
            DataClassification = SystemMetadata;
        }
        field(17; PS_JobPlanningVersionCode; Code[20])
        {
            Caption = 'Job planning Version code';
            DataClassification = SystemMetadata;
        }
        field(18; PS_VersionName; Text[30])
        {
            Caption = 'Version Name';
            DataClassification = SystemMetadata;
        }
        field(19; PS_ActivePlanningVersion; Code[20])
        {
            Caption = 'Active planning Version';
            DataClassification = SystemMetadata;
        }
        field(20; PS_DescriptionExtend; Text[100])
        {
            Caption = 'Description';
            DataClassification = SystemMetadata;
        }
        field(25; PS_ClosingMonthCode; Code[20])
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
        key(Key1; PS_EntryNo, PS_ClosingMonthCode)
        {
        }
        key(Key2; PS_JobNo, PS_JobUnitNo, PS_JobPlanningVersionCode, PS_PlanningType, PS_ClosingMonthCode)
        {
        }
        key(Key3; PS_JobNo, PS_JobUnitNo, PS_JobPlanningVersionCode, PS_PlanningDate, PS_PlanningType, PS_ClosingMonthCode)
        {
        }
        key(Key4; PS_JobNo, PS_JobUnitNo, PS_JobPlanningVersionCode, PS_PlanningDate, PS_Real, PS_PlanningType, PS_ClosingMonthCode)
        {
        }
    }
}
