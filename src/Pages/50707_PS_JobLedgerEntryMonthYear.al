page 50707 PS_JobLedgerEntryMonthYear
{
    ApplicationArea = All;
    Caption = 'PS_JobLedgerEntryMonthYear';
    PageType = List;
    SourceTable = PS_JobLedgerEntryMonthYear;
    UsageCategory = Lists;

    layout
    {
        area(content)
        {
            repeater(General)
            {
                field("PS_Entry No."; Rec."PS_EntryNo.")
                {
                    ToolTip = 'Specifies the value of the Line No. field.';
                }
                field("PS_Job No."; Rec."PS_JobNo.")
                {
                    ToolTip = 'Specifies the value of the project No. field.';
                }
                field(PS_Month; Rec.PS_Month)
                {
                    ToolTip = 'Specifies the value of the Month field.';
                }
                field(PS_Year; Rec.PS_Year)
                {
                    ToolTip = 'Specifies the value of the Year field.';
                }
            }
        }
    }
}
